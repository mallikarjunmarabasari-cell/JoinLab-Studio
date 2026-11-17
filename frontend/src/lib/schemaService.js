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
