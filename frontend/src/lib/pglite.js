import { PGlite } from '@electric-sql/pglite'

// Persistent database identity for the current local workspace
const DATABASE_NAME = 'idb://joinlab-studio-v0.2' //The idb:// prefix tells PGlite to use its IndexedDB filesystem.

// Shared database initialization promise
let databasePromise = null

// Initialize the database only once
export function getDatabase() {
  if (!databasePromise) {
    databasePromise = PGlite.create(DATABASE_NAME)
  }

  return databasePromise
}

// Execute SQL against the shared database
export async function executeQuery(sql) {
  const database = await getDatabase()

  return database.query(sql)
}