import { PGlite } from "@electric-sql/pglite";

const connections = new Map();

export class DatasetVersionMismatchError extends Error {
  constructor(storedVersion, publishedVersion) {
    super(
      `Your workspace uses dataset version ${storedVersion}, but version ${publishedVersion} is currently published. Your existing workspace is preserved. Reset to Original to load the published version.`,
    );

    this.name = "DatasetVersionMismatchError";
    this.storedVersion = storedVersion;
    this.publishedVersion = publishedVersion;
  }
}

function validateIdentity(userId, datasetSlug) {
  if (
    typeof userId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    )
  ) {
    throw new Error("A valid authenticated user ID is required.");
  }

  if (
    typeof datasetSlug !== "string" ||
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(datasetSlug)
  ) {
    throw new Error("A valid dataset identifier is required.");
  }

  return {
    userId: userId.toLowerCase(),
    datasetSlug,
  };
}

function validateDataset(dataset) {
  if (
    !dataset ||
    typeof dataset.dataset_sql !== "string" ||
    !dataset.dataset_sql.trim() ||
    !Number.isInteger(dataset.version) ||
    dataset.version < 1
  ) {
    throw new Error("The published dataset definition is invalid.");
  }

  if (
    !Array.isArray(dataset.expected_tables) ||
    dataset.expected_tables.some(
      (name) => typeof name !== "string" || !/^[a-z_][a-z0-9_]*$/i.test(name),
    )
  ) {
    throw new Error("The dataset table definition is invalid.");
  }
}

function getConnection(userId, datasetSlug) {
  const identity = validateIdentity(userId, datasetSlug);
  const key = `${identity.userId}::${identity.datasetSlug}`;

  let connectionPromise = connections.get(key);

  if (!connectionPromise) {
    const databaseName = `idb://sqldesk-challenge-${identity.userId}-${identity.datasetSlug}`;

    connectionPromise = PGlite.create(databaseName).catch((error) => {
      connections.delete(key);
      throw error;
    });

    connections.set(key, connectionPromise);
  }

  return connectionPromise.then((database) => ({ database, key }));
}

async function ensureMetadataTable(database) {
  await database.exec(`
    CREATE SCHEMA IF NOT EXISTS sqldesk_internal;

    CREATE TABLE IF NOT EXISTS sqldesk_internal.dataset_metadata (
      singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton = TRUE),
      dataset_slug TEXT NOT NULL,
      dataset_version INTEGER NOT NULL,
      initialized_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function verifyExpectedTables(database, expectedTables) {
  const result = await database.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
  `);

  const actualTables = result.rows.map((row) => row.table_name);
  const missingTables = expectedTables.filter(
    (tableName) => !actualTables.includes(tableName),
  );

  if (missingTables.length) {
    throw new Error(
      `Dataset initialization did not create expected tables: ${missingTables.join(", ")}`,
    );
  }

  return actualTables;
}

async function initializeDataset(database, dataset) {
  await database.exec("BEGIN");

  try {
    await database.exec(dataset.dataset_sql);

    const tables = await verifyExpectedTables(
      database,
      dataset.expected_tables,
    );

    await database.query(
      `INSERT INTO sqldesk_internal.dataset_metadata
        (singleton, dataset_slug, dataset_version)
       VALUES (TRUE, $1, $2)
       ON CONFLICT (singleton)
       DO UPDATE SET
         dataset_slug = EXCLUDED.dataset_slug,
         dataset_version = EXCLUDED.dataset_version,
         initialized_at = NOW();`,
      [dataset.slug, dataset.version],
    );

    await database.exec("COMMIT");

    return tables;
  } catch (error) {
    await database.exec("ROLLBACK").catch(() => {});
    throw error;
  }
}

export async function openPracticeDatabase(userId, dataset) {
  validateDataset(dataset);

  const { database } = await getConnection(userId, dataset.slug);

  await ensureMetadataTable(database);

  const metadataResult = await database.query(`
    SELECT dataset_slug, dataset_version
    FROM sqldesk_internal.dataset_metadata
    WHERE singleton = TRUE;
  `);

  const metadata = metadataResult.rows[0];

  if (metadata) {
    if (metadata.dataset_slug !== dataset.slug) {
      throw new Error(
        "The stored workspace belongs to a different dataset. Your existing data has been preserved.",
      );
    }

    if (metadata.dataset_version !== dataset.version) {
      throw new DatasetVersionMismatchError(
        metadata.dataset_version,
        dataset.version,
      );
    }

    const tables = await verifyExpectedTables(
      database,
      dataset.expected_tables,
    );

    return {
      database,
      resumed: true,
      tables,
      version: metadata.dataset_version,
    };
  }

  const existingTables = await database.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
  `);

  if (existingTables.rows.length > 0) {
    throw new Error(
      "This database contains tables but has no SQLDesk dataset marker. Initialization was stopped to protect existing data.",
    );
  }

  const tables = await initializeDataset(database, dataset);

  return {
    database,
    resumed: false,
    tables,
    version: dataset.version,
  };
}

export async function executePracticeQuery(userId, datasetSlug, sqlText) {
  if (typeof sqlText !== "string" || !sqlText.trim()) {
    throw new Error("Enter a SQL query before running it.");
  }

  const { database } = await getConnection(userId, datasetSlug);

  return database.query(sqlText);
}

export async function getPracticeTables(userId, datasetSlug) {
  const { database } = await getConnection(userId, datasetSlug);

  const result = await database.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  return result.rows.map((row) => row.table_name);
}

export async function resetPracticeDatabase(userId, dataset) {
  validateDataset(dataset);

  const { database } = await getConnection(userId, dataset.slug);

  await ensureMetadataTable(database);
  await database.exec("BEGIN");

  try {
    // This database belongs exclusively to this user and dataset.
    // Reset removes all learner-created objects in its public schema.
    await database.exec(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
    `);

    await database.exec(dataset.dataset_sql);

    const tables = await verifyExpectedTables(
      database,
      dataset.expected_tables,
    );

    await database.query(
      `INSERT INTO sqldesk_internal.dataset_metadata
        (singleton, dataset_slug, dataset_version)
       VALUES (TRUE, $1, $2)
       ON CONFLICT (singleton)
       DO UPDATE SET
         dataset_slug = EXCLUDED.dataset_slug,
         dataset_version = EXCLUDED.dataset_version,
         initialized_at = NOW();`,
      [dataset.slug, dataset.version],
    );

    await database.exec("COMMIT");

    return {
      tables,
      version: dataset.version,
    };
  } catch (error) {
    await database.exec("ROLLBACK").catch(() => {});
    throw error;
  }
}

export async function closePracticeDatabasesForUser(userId) {
  if (typeof userId !== "string") return;

  const normalizedUserId = userId.toLowerCase();
  const prefix = `${normalizedUserId}::`;

  for (const [key, connectionPromise] of connections.entries()) {
    if (!key.startsWith(prefix)) continue;

    connections.delete(key);

    try {
      const database = await connectionPromise;
      await database.close();
    } catch (error) {
      console.error("Could not close a practice database:", error);
    }
  }
}
