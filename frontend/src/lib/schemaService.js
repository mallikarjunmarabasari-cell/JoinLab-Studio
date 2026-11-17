import { getDatabase } from "./pglite.js";

// information_schema.tables is PostgreSQL's metadata view describing tables accessible through the database.

// Retrieve all user-created tables from the public schema
export async function getDatabaseTables() {
  const database = await getDatabase();

  const result = await database.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  return result.rows.map((row) => row.table_name);
}

// Retrieve column metadata for a selected table
export async function getTableColumns(tableName) {
  const database = await getDatabase();

  const result = await database.query(
    `
      SELECT
        column_name,
        data_type,
        udt_name,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position;
    `,
    [tableName],
  );

  return result.rows;
}

// Retrieve constraints for a selected table
export async function getTableConstraints(tableName) {
  const database = await getDatabase();

  const result = await database.query(
    `
      SELECT
        tc.constraint_name,
        tc.constraint_type,

        (
          SELECT array_agg(
            kcu.column_name
            ORDER BY kcu.ordinal_position
          )
          FROM information_schema.key_column_usage kcu
          WHERE kcu.constraint_catalog = tc.constraint_catalog
            AND kcu.constraint_schema = tc.constraint_schema
            AND kcu.constraint_name = tc.constraint_name
            AND kcu.table_schema = tc.table_schema
            AND kcu.table_name = tc.table_name
        ) AS columns,

        (
          SELECT array_agg(
            ccu.table_name || '.' || ccu.column_name
          )
          FROM information_schema.constraint_column_usage ccu
          WHERE ccu.constraint_catalog = tc.constraint_catalog
            AND ccu.constraint_schema = tc.constraint_schema
            AND ccu.constraint_name = tc.constraint_name
        ) AS referenced_columns,

        (
          SELECT cc.check_clause
          FROM information_schema.check_constraints cc
          WHERE cc.constraint_catalog = tc.constraint_catalog
            AND cc.constraint_schema = tc.constraint_schema
            AND cc.constraint_name = tc.constraint_name
          LIMIT 1
        ) AS check_clause

      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
      ORDER BY tc.constraint_type, tc.constraint_name;
    `,
    [tableName],
  );

  return result.rows.filter((constraint) => {
    if (constraint.constraint_type !== "CHECK") {
      return true;
    }

    const clause = (constraint.check_clause ?? "")
      .trim()
      .replace(/^[()\s]+|[()\s]+$/g, "")
      .replace(/"/g, "")
      .replace(/\s+/g, " ")
      .toUpperCase();

    // NOT NULL is already represented by column nullability.
    const isNotNullConstraint =
  /^(?:[A-Z_][A-Z0-9_$]*\.)*[A-Z_][A-Z0-9_$]* IS NOT NULL$/.test(clause)

    return !isNotNullConstraint;
  });
}
