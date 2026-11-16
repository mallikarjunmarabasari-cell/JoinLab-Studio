// The ?raw suffix tells Vite to import the file contents as a string rather than treating it as an executable JavaScript module.
import employeePracticeSql from '../data/datasets/employee-practice.sql?raw'
import { getDatabase } from './pglite.js'

export async function loadEmployeePracticeDataset() {
  // Get the existing PGlite instance
  const database = await getDatabase()

  // Execute the complete dataset SQL script
  await database.exec(employeePracticeSql)

  // Verify the number of imported employees
  const result = await database.query(`
    SELECT COUNT(*)::INTEGER AS employee_count
    FROM employees;
  `)

  return {
    employeeCount: result.rows[0].employee_count,
  }
}