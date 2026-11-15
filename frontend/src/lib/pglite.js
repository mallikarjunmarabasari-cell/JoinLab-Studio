import { PGlite } from '@electric-sql/pglite' //Imports the database engine installed through npm.

// Shared database initialization promise
let databasePromise = null //Database initialization: We maintain a reference to the database initialization promise.

// Initialize the database only once
export function getDatabase() { //The first call initializes the database. Subsequent calls reuse the same promise instead of creating another database.
  if (!databasePromise) {
    databasePromise = PGlite.create() //Creates the database and returns a promise that resolves when initialization is complete. This is the recommended initialization approach in the PGlite API
  }

  return databasePromise
}

// Execute SQL against the shared database
export async function executeQuery(sql) { //Execute SQL: This waits for database initialization, then executes the supplied SQL.
  const database = await getDatabase()

  return database.query(sql)
}