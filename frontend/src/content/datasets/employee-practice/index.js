import datasetSql from './dataset.sql?raw'

const datasetId = 'employee-practice'

const practiceItems = [
    {
        id: 'view-all-employees',
        slug: 'view-all-employees',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'View all employees',
        prompt: "Retrieve every column and every row from the employees table.",
        topic: 'SELECT',
        difficulty: 'easy',
        starter_sql: "SELECT\n    -- Choose the columns to retrieve\nFROM employees;",
        hints: ["Use SELECT * to return every column.","The table name is employees."],
        points: 10,
        sort_order: 1,
        reference_sql: `SELECT *
FROM employees;`,
    },
    {
        id: 'choose-employee-columns',
        slug: 'choose-employee-columns',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Choose specific columns',
        prompt: "Display each employee name, department and job title. Return only these three columns.",
        topic: 'SELECT columns',
        difficulty: 'easy',
        starter_sql: "SELECT\n    -- Add the required columns\nFROM employees;",
        hints: ["List the required column names after SELECT.","Separate column names with commas."],
        points: 10,
        sort_order: 2,
        reference_sql: `SELECT name, department, job_title
FROM employees;`,
    },
    {
        id: 'filter-it-employees',
        slug: 'filter-it-employees',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find IT employees',
        prompt: "Retrieve all employees who belong to the IT department.",
        topic: 'WHERE',
        difficulty: 'easy',
        starter_sql: "SELECT *\nFROM employees\nWHERE -- Add the department condition;",
        hints: ["Use a WHERE clause to filter rows.","Text values must be enclosed in single quotes."],
        points: 10,
        sort_order: 3,
        reference_sql: `SELECT *
FROM employees
WHERE department = 'IT';`,
    },
    {
        id: 'high-salary-employees',
        slug: 'high-salary-employees',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Filter by salary',
        prompt: "Find employees whose salary is greater than 65000. Display their names and salaries.",
        topic: 'Comparison operators',
        difficulty: 'easy',
        starter_sql: "SELECT name, salary\nFROM employees\nWHERE -- Add the salary condition;",
        hints: ["Use the greater-than operator.","Return only name and salary."],
        points: 10,
        sort_order: 4,
        reference_sql: `SELECT name, salary
FROM employees
WHERE salary > 65000;`,
    },
    {
        id: 'salary-and-age-filter',
        slug: 'salary-and-age-filter',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Combine two conditions',
        prompt: "Find employees earning between 50000 and 80000 inclusive who are younger than 32.",
        topic: 'AND / BETWEEN',
        difficulty: 'easy',
        starter_sql: "SELECT name, salary, age\nFROM employees\nWHERE -- Add the salary range\n  AND -- Add the age condition;",
        hints: ["BETWEEN includes both boundary values.","Combine the salary and age conditions with AND."],
        points: 15,
        sort_order: 5,
        reference_sql: `SELECT name, salary, age
FROM employees
WHERE salary BETWEEN 50000 AND 80000
  AND age < 32;`,
    },
    {
        id: 'employees-in-cities',
        slug: 'employees-in-cities',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Filter multiple cities',
        prompt: "Find employees based in Mumbai, Pune or Delhi. Return their names and cities.",
        topic: 'IN',
        difficulty: 'easy',
        starter_sql: "SELECT name, city\nFROM employees\nWHERE city -- Add a condition for the requested cities;",
        hints: ["IN checks whether a value matches any item in a list.","Use a comma-separated list of text values."],
        points: 15,
        sort_order: 6,
        reference_sql: `SELECT name, city
FROM employees
WHERE city IN ('Mumbai', 'Pune', 'Delhi');`,
    },
    {
        id: 'search-employee-names',
        slug: 'search-employee-names',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Search names with LIKE',
        prompt: "Find employees whose names contain the letter 'a', regardless of letter case.",
        topic: 'LIKE / ILIKE',
        difficulty: 'easy',
        starter_sql: "SELECT name\nFROM employees\nWHERE name -- Add a case-insensitive pattern condition;",
        hints: ["ILIKE performs a case-insensitive pattern match in PostgreSQL.","Percent signs match any sequence of characters."],
        points: 15,
        sort_order: 7,
        reference_sql: `SELECT name
FROM employees
WHERE name ILIKE '%a%';`,
    },
    {
        id: 'top-three-salaries',
        slug: 'top-three-salaries',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Sort and limit results',
        prompt: "Display the three highest-paid employees first. Return name and salary.",
        topic: 'ORDER BY / LIMIT',
        difficulty: 'easy',
        starter_sql: "SELECT name, salary\nFROM employees\nORDER BY -- Choose sorting column and direction\nLIMIT -- Choose the number of rows;",
        hints: ["DESC sorts from highest to lowest.","LIMIT restricts the number of returned rows."],
        points: 15,
        sort_order: 8,
        preserve_order: true,
        reference_sql: `SELECT name, salary
FROM employees
ORDER BY salary DESC
LIMIT 3;`,
    },
    {
        id: 'salary-summary',
        slug: 'salary-summary',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Calculate salary statistics',
        prompt: "Return the total number of employees, average salary, minimum salary and maximum salary in one result.",
        topic: 'Aggregate functions',
        difficulty: 'medium',
        starter_sql: "SELECT\n    -- Add COUNT, AVG, MIN and MAX\nFROM employees;",
        hints: ["Use COUNT, AVG, MIN and MAX.","Aggregate functions can appear together in one SELECT."],
        points: 20,
        sort_order: 9,
        reference_sql: `SELECT
    COUNT(*) AS employee_count,
    AVG(salary) AS average_salary,
    MIN(salary) AS minimum_salary,
    MAX(salary) AS maximum_salary
FROM employees;`,
    },
    {
        id: 'department-salary-average',
        slug: 'department-salary-average',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Average salary by department',
        prompt: "Calculate the average salary for each department. Show the department and its average salary.",
        topic: 'GROUP BY',
        difficulty: 'medium',
        starter_sql: "SELECT department,\n       -- Calculate average salary\nFROM employees\nGROUP BY department;",
        hints: ["GROUP BY creates one group for each department.","Apply AVG to the salary column."],
        points: 20,
        sort_order: 10,
        reference_sql: `SELECT department, AVG(salary) AS average_salary
FROM employees
GROUP BY department
ORDER BY department;`,
    },
    {
        id: 'high-paying-departments',
        slug: 'high-paying-departments',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Filter grouped departments',
        prompt: "Show departments whose average salary is greater than 60000.",
        topic: 'HAVING',
        difficulty: 'medium',
        starter_sql: "SELECT department,\n       -- Calculate average salary\nFROM employees\nGROUP BY department\nHAVING -- Add the average salary condition;",
        hints: ["HAVING filters groups after GROUP BY.","Use AVG(salary) in the HAVING condition."],
        points: 25,
        sort_order: 11,
        reference_sql: `SELECT department, AVG(salary) AS average_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > 60000;`,
    },
    {
        id: 'above-average-earners',
        slug: 'above-average-earners',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find above-average earners',
        prompt: "Find employees whose salary is greater than the overall average salary. Display their names and salaries in descending salary order.",
        topic: 'Subqueries',
        difficulty: 'medium',
        starter_sql: "SELECT name, salary\nFROM employees\nWHERE salary > (\n    -- Write a subquery for average salary\n)\nORDER BY salary DESC;",
        hints: ["First calculate the overall average in a subquery.","Compare each employee salary with the scalar result."],
        points: 25,
        sort_order: 12,
        preserve_order: true,
        reference_sql: `SELECT name, salary
FROM employees
WHERE salary > (
    SELECT AVG(salary)
    FROM employees
)
ORDER BY salary DESC;`,
    },
]

const employeePracticeDataset = {
    id: datasetId,
    slug: datasetId,
    name: 'Employee Practice',
    description: 'A 10-row employee dataset for practising foundational SQL queries, filtering, sorting, aggregation and subqueries.',
    dataset_sql: datasetSql,
    expected_tables: ['employees'],
    version: 1,
    practice_items: practiceItems,
}

export default employeePracticeDataset