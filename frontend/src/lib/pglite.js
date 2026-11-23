import { PGlite } from "@electric-sql/pglite";

// Keep a separate PGlite instance for each authenticated account.
const databasePromises = new Map();

function validateUserId(userId) {
  if (
    typeof userId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    )
  ) {
    throw new Error("A valid authenticated user ID is required.");
  }

  return userId.toLowerCase();
}

// Open or reuse the persistent database belonging to this account.
export function getDatabase(userId) {
  const normalizedUserId = validateUserId(userId);

  let databasePromise = databasePromises.get(normalizedUserId);

  if (!databasePromise) {
    const databaseName = `idb://sqldesk-user-${normalizedUserId}`;

    databasePromise = PGlite.create(databaseName).catch((error) => {
      databasePromises.delete(normalizedUserId);
      throw error;
    });

    databasePromises.set(normalizedUserId, databasePromise);
  }

  return databasePromise;
}

// Execute SQL only against the requesting account's local database.
export async function executeQuery(userId, sql) {
  const database = await getDatabase(userId);
  return database.query(sql);
}

// Close the in-memory connection without deleting persistent IndexedDB data.
export async function closeDatabase(userId) {
  const normalizedUserId = validateUserId(userId);
  const databasePromise = databasePromises.get(normalizedUserId);

  if (!databasePromise) return;

  databasePromises.delete(normalizedUserId);

  const database = await databasePromise;
  await database.close();
}
