import employeePracticeSql from "../data/datasets/employee-practice.sql?raw";
import { getDatabase } from "./pglite.js";

export async function loadEmployeePracticeDataset(userId) {
  const database = await getDatabase(userId);

  await database.exec(employeePracticeSql);

  const result = await database.query(`
    SELECT COUNT(*)::INTEGER AS employee_count
    FROM employees;
  `);

  return { employeeCount: result.rows[0].employee_count };
}
