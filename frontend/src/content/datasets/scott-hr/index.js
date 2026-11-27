import datasetSql from './dataset.sql?raw'

const datasetId = 'scott-hr'

const practiceItems = [
    {
        id: 'view-scott-employees',
        slug: 'view-scott-employees',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'View SCOTT employees',
        prompt: 'Retrieve the employee number, employee name, job and department number for every employee in the SCOTT EMP table.',
        topic: 'SELECT columns',
        difficulty: 'easy',
        starter_sql: `SELECT
    -- Add EMPNO, ENAME, JOB and DEPTNO
FROM emp;`,
        hints: [
            'Use the EMP table from the SCOTT sample schema.',
            'The required columns are EMPNO, ENAME, JOB and DEPTNO.',
        ],
        points: 10,
        sort_order: 1,
        reference_sql: `SELECT empno, ename, job, deptno
FROM emp;`,
    },
    {
        id: 'filter-clerks-under-1500',
        slug: 'filter-clerks-under-1500',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find clerks earning below 1500',
        prompt: 'Retrieve the details of employees who work as CLERK and earn less than 1500.',
        topic: 'WHERE / AND',
        difficulty: 'easy',
        starter_sql: `SELECT *
FROM emp
WHERE job = 'CLERK'
  AND -- Add the salary condition;`,
        hints: [
            'Both conditions must be true, so combine them with AND.',
            'Use the JOB and SAL columns from EMP.',
        ],
        points: 10,
        sort_order: 2,
        reference_sql: `SELECT *
FROM emp
WHERE job = 'CLERK'
  AND sal < 1500;`,
    },
    {
        id: 'annual-salary-for-smith',
        slug: 'annual-salary-for-smith',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Calculate Smith’s annual salary',
        prompt: 'Display the annual salary of the employee whose name is SMITH.',
        topic: 'Expressions / WHERE',
        difficulty: 'easy',
        starter_sql: `SELECT ename,
       -- Calculate annual salary from SAL
FROM emp
WHERE -- Filter for SMITH;`,
        hints: [
            'Calculate annual salary by multiplying monthly SAL by 12.',
            'Use an alias to name the calculated result annual_salary.',
        ],
        points: 10,
        sort_order: 3,
        reference_sql: `SELECT ename, sal * 12 AS annual_salary
FROM emp
WHERE ename = 'SMITH';`,
    },
    {
        id: 'employees-in-jones-department',
        slug: 'employees-in-jones-department',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find employees in Jones’s department',
        prompt: 'Display the employee name and department number for employees who work in the same department as JONES.',
        topic: 'Subqueries',
        difficulty: 'medium',
        starter_sql: `SELECT ename, deptno
FROM emp
WHERE deptno = (
    -- Retrieve JONES's department number
);`,
        hints: [
            'First retrieve JONES’s DEPTNO in a subquery.',
            'Compare other employees’ DEPTNO values with the returned value.',
        ],
        points: 20,
        sort_order: 4,
        reference_sql: `SELECT ename, deptno
FROM emp
WHERE deptno = (
    SELECT deptno
    FROM emp
    WHERE ename = 'JONES'
);`,
    },
    {
        id: 'employee-manager-names-for-clerks',
        slug: 'employee-manager-names-for-clerks',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Display clerks and their managers',
        prompt: 'Display the name of each employee working as a CLERK together with the name of that employee’s manager.',
        topic: 'Self JOIN',
        difficulty: 'medium',
        starter_sql: `SELECT e.ename AS employee_name,
       m.ename AS manager_name
FROM emp AS e
INNER JOIN emp AS m
    ON -- Match employee MGR with manager EMPNO
WHERE -- Keep only clerks;`,
        hints: [
            'Use EMP twice with different table aliases.',
            'Match the employee MGR column with the manager EMPNO column.',
        ],
        points: 20,
        sort_order: 5,
        reference_sql: `SELECT e.ename AS employee_name,
       m.ename AS manager_name
FROM emp AS e
INNER JOIN emp AS m
    ON e.mgr = m.empno
WHERE e.job = 'CLERK';`,
    },
    {
        id: 'salesmen-with-department-names',
        slug: 'salesmen-with-department-names',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find salesmen and department names',
        prompt: 'Display the employee name and department name for every employee working as SALESMAN.',
        topic: 'INNER JOIN',
        difficulty: 'medium',
        starter_sql: `SELECT e.ename, d.dname
FROM emp AS e
INNER JOIN dept AS d
    ON -- Match EMP and DEPT
WHERE -- Filter SALESMAN employees;`,
        hints: [
            'EMP and DEPT share the DEPTNO column.',
            'Filter the employee JOB after joining the tables.',
        ],
        points: 20,
        sort_order: 6,
        reference_sql: `SELECT e.ename, d.dname
FROM emp AS e
INNER JOIN dept AS d
    ON e.deptno = d.deptno
WHERE e.job = 'SALESMAN';`,
    },
    {
        id: 'employee-count-by-department-excluding-president',
        slug: 'employee-count-by-department-excluding-president',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Count employees by department',
        prompt: "Find the number of employees working in each department, excluding the PRESIDENT. Sort by department number.",
        topic: 'GROUP BY',
        difficulty: 'medium',
        starter_sql: `SELECT deptno, COUNT(*) AS employee_count
FROM emp
WHERE -- Exclude the PRESIDENT
GROUP BY deptno
ORDER BY deptno;`,
        hints: [
            'Exclude the PRESIDENT before grouping the rows.',
            'Group by DEPTNO and count the remaining employees.',
        ],
        points: 20,
        sort_order: 7,
        preserve_order: true,
        reference_sql: `SELECT deptno, COUNT(*) AS employee_count
FROM emp
WHERE job <> 'PRESIDENT'
GROUP BY deptno
ORDER BY deptno;`,
    },
    {
        id: 'departments-with-average-salary-under-3000',
        slug: 'departments-with-average-salary-under-3000',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Filter departments by average salary',
        prompt: "Display each department number and its average salary only when the average salary is less than 3000. Sort by department number.",
        topic: 'GROUP BY / HAVING',
        difficulty: 'medium',
        starter_sql: `SELECT deptno, AVG(sal) AS average_salary
FROM emp
GROUP BY deptno
HAVING -- Keep department averages below 3000
ORDER BY deptno;`,
        hints: [
            'GROUP BY creates one group for each department.',
            'Use HAVING to filter groups based on AVG(sal).',
        ],
        points: 25,
        sort_order: 8,
        preserve_order: true,
        reference_sql: `SELECT deptno, AVG(sal) AS average_salary
FROM emp
GROUP BY deptno
HAVING AVG(sal) < 3000
ORDER BY deptno;`,
    },
    {
        id: 'employees-earning-more-than-adams',
        slug: 'employees-earning-more-than-adams',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find employees earning more than Adams',
        prompt: 'Display the names of employees whose salary is greater than the salary of ADAMS.',
        topic: 'Scalar subquery',
        difficulty: 'medium',
        starter_sql: `SELECT ename
FROM emp
WHERE sal > (
    -- Retrieve ADAMS's salary
);`,
        hints: [
            'Retrieve ADAMS’s salary in a scalar subquery.',
            'Compare each employee’s SAL with that single value.',
        ],
        points: 20,
        sort_order: 9,
        reference_sql: `SELECT ename
FROM emp
WHERE sal > (
    SELECT sal
    FROM emp
    WHERE ename = 'ADAMS'
);`,
    },
    {
        id: 'hr-employees-and-departments',
        slug: 'hr-employees-and-departments',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Join HR employees with departments',
        prompt: 'Display the first name, last name and department name for HR employees who have a department assigned.',
        topic: 'INNER JOIN',
        difficulty: 'medium',
        starter_sql: `SELECT e.first_name, e.last_name, d.department_name
FROM employees AS e
INNER JOIN departments AS d
    ON -- Match department IDs;`,
        hints: [
            'Use the HR EMPLOYEES and DEPARTMENTS tables.',
            'Join them using DEPARTMENT_ID.',
        ],
        points: 20,
        sort_order: 10,
        reference_sql: `SELECT e.first_name, e.last_name, d.department_name
FROM employees AS e
INNER JOIN departments AS d
    ON e.department_id = d.department_id;`,
    },
    {
        id: 'hr-employees-and-cities',
        slug: 'hr-employees-and-cities',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find HR employees and their cities',
        prompt: 'Display each HR employee’s first name, last name and city using the employee, department and location tables.',
        topic: 'Multi-table JOIN',
        difficulty: 'medium',
        starter_sql: `SELECT e.first_name, e.last_name, l.city
FROM employees AS e
INNER JOIN departments AS d
    ON -- Connect employees to departments
INNER JOIN locations AS l
    ON -- Connect departments to locations;`,
        hints: [
            'Join EMPLOYEES to DEPARTMENTS using DEPARTMENT_ID.',
            'Join DEPARTMENTS to LOCATIONS using LOCATION_ID.',
        ],
        points: 25,
        sort_order: 11,
        reference_sql: `SELECT e.first_name, e.last_name, l.city
FROM employees AS e
INNER JOIN departments AS d
    ON e.department_id = d.department_id
INNER JOIN locations AS l
    ON d.location_id = l.location_id;`,
    },
    {
        id: 'hr-jobs-with-multiple-employees',
        slug: 'hr-jobs-with-multiple-employees',
        dataset_id: datasetId,
        dataset_slug: datasetId,
        title: 'Find jobs with multiple employees',
        prompt: "Display each job title and the number of employees assigned to it, showing only jobs with more than one employee. Sort alphabetically by job title.",
        topic: 'GROUP BY / HAVING / JOIN',
        difficulty: 'medium',
        starter_sql: `SELECT j.job_title, COUNT(*) AS employee_count
FROM employees AS e
INNER JOIN jobs AS j
    ON -- Match the JOB_ID columns
GROUP BY j.job_title
HAVING -- Keep jobs with more than one employee
ORDER BY j.job_title;`,
        hints: [
            'Join EMPLOYEES to JOBS using JOB_ID.',
            'Group by JOB_TITLE and use HAVING COUNT(*) > 1.',
        ],
        points: 25,
        sort_order: 12,
        preserve_order: true,
        reference_sql: `SELECT j.job_title, COUNT(*) AS employee_count
FROM employees AS e
INNER JOIN jobs AS j
    ON e.job_id = j.job_id
GROUP BY j.job_title
HAVING COUNT(*) > 1
ORDER BY j.job_title;`,
    },
]

const scottHrDataset = {
    id: datasetId,
    slug: datasetId,
    name: 'SCOTT & HR Practice',
    description: 'The SCOTT EMP/DEPT sample schema and the HR employees, departments, jobs and location schema for practising subqueries, self joins, grouping and relational joins.',
    dataset_sql: datasetSql,
    expected_tables: [
        'bonus',
        'countries',
        'departments',
        'dept',
        'emp',
        'employees',
        'hotel',
        'job_history',
        'jobs',
        'locations',
        'regions',
        'salgrade',
    ],
    version: 1,
    practice_items: practiceItems,
}

export default scottHrDataset
