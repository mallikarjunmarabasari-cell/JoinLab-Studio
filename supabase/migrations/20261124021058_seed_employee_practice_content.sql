insert into public.learning_datasets
  (slug, name, description, dataset_sql, expected_tables, version, is_published)
values (
  'employee-practice',
  'Employee Practice',
  'A beginner-to-intermediate SQL dataset with 10 employee records. Practice SELECT, filtering, sorting, aggregates, GROUP BY, HAVING and subqueries.',
  $dataset$
-- Employee Practice Dataset, version 1
-- Safe for initialization in a fresh, dedicated learner database.
CREATE TABLE employees (
    empid INTEGER PRIMARY KEY,
    name VARCHAR(50),
    department VARCHAR(30),
    job_title VARCHAR(50),
    salary INTEGER,
    age INTEGER,
    experience INTEGER,
    city VARCHAR(30),
    joining_date DATE,
    bonus INTEGER
);

INSERT INTO employees (
    empid, name, department, job_title, salary, age,
    experience, city, joining_date, bonus
)
VALUES
(101, 'Rohan Mehta', 'HR', 'HR Executive', 45000, 29, 4, 'Mumbai', '2019-06-10', 3000),
(102, 'Priya Singh', 'IT', 'Software Engg', 75000, 26, 3, 'Pune', '2020-09-15', 6000),
(103, 'Aman Verma', 'IT', 'Data Analyst', 68000, 28, 5, 'Delhi', '2018-03-12', 5000),
(104, 'Neha Patel', 'Finance', 'Accountant', 55000, 33, 7, 'Mumbai', '2017-11-22', 4000),
(105, 'Ravi Kumar', 'IT', 'Software Engg', 80000, 31, 6, 'Bangalore', '2016-01-18', 7000),
(106, 'Divya Sharma', 'Sales', 'Sales Executive', 48000, 27, 4, 'Delhi', '2021-04-05', 3500),
(107, 'Arjun Nair', 'HR', 'HR Manager', 67000, 35, 9, 'Kochi', '2014-08-28', 8000),
(108, 'Tanya Rao', 'Finance', 'Financial Analyst', 72000, 30, 8, 'Pune', '2015-05-10', 5500),
(109, 'Karan Shah', 'Sales', 'Sales Manager', 90000, 38, 10, 'Mumbai', '2012-07-14', 9000),
(110, 'Meena Joshi', 'IT', 'Tester', 60000, 25, 2, 'Hyderabad', '2022-01-02', 4000);
$dataset$,
  array['employees']::text[],
  1,
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  dataset_sql = excluded.dataset_sql,
  expected_tables = excluded.expected_tables,
  version = excluded.version,
  is_published = excluded.is_published,
  updated_at = now();

with dataset as (
  select id from public.learning_datasets where slug = 'employee-practice'
)
insert into public.sql_challenges
  (dataset_id, slug, title, prompt, topic, difficulty, starter_sql, hints, points, sort_order, is_published)
select
  dataset.id,
  challenge.slug,
  challenge.title,
  challenge.prompt,
  challenge.topic,
  challenge.difficulty,
  challenge.starter_sql,
  challenge.hints,
  challenge.points,
  challenge.sort_order,
  true
from dataset
cross join (values
  ('view-all-employees','View all employees','Retrieve every column and every row from the employees table.','SELECT','easy','SELECT *\nFROM employees;',array['Use SELECT * to return every column.','The table name is employees.']::text[],10,1),
  ('choose-employee-columns','Choose specific columns','Display each employee name, department and job title. Return only these three columns.','SELECT columns','easy','SELECT name, department, job_title\nFROM employees;',array['List the required column names after SELECT.','Separate column names with commas.']::text[],10,2),
  ('filter-it-employees','Find IT employees','Retrieve all employees who belong to the IT department.','WHERE','easy','SELECT *\nFROM employees\nWHERE department = ''IT'';',array['Use a WHERE clause to filter rows.','Text values must be enclosed in single quotes.']::text[],10,3),
  ('high-salary-employees','Filter by salary','Find employees whose salary is greater than 65000. Display their names and salaries.','Comparison operators','easy','SELECT name, salary\nFROM employees\nWHERE salary > 65000;',array['Use the greater-than operator.','Return only name and salary.']::text[],10,4),
  ('salary-and-age-filter','Combine two conditions','Find employees earning between 50000 and 80000 inclusive who are younger than 32.','AND / BETWEEN','easy','SELECT name, salary, age\nFROM employees\nWHERE salary BETWEEN 50000 AND 80000\n  AND age < 32;',array['BETWEEN includes both boundary values.','Combine the salary and age conditions with AND.']::text[],15,5),
  ('employees-in-cities','Filter multiple cities','Find employees based in Mumbai, Pune or Delhi. Return their names and cities.','IN','easy','SELECT name, city\nFROM employees\nWHERE city IN (''Mumbai'', ''Pune'', ''Delhi'');',array['IN checks whether a value matches any item in a list.','Use a comma-separated list of text values.']::text[],15,6),
  ('search-employee-names','Search names with LIKE','Find employees whose names contain the letter ''a'', regardless of letter case.','LIKE / ILIKE','easy','SELECT name\nFROM employees\nWHERE name ILIKE ''%a%'';',array['ILIKE performs a case-insensitive pattern match in PostgreSQL.','Percent signs match any sequence of characters.']::text[],15,7),
  ('top-three-salaries','Sort and limit results','Display the three highest-paid employees first. Return name and salary.','ORDER BY / LIMIT','easy','SELECT name, salary\nFROM employees\nORDER BY salary DESC\nLIMIT 3;',array['DESC sorts from highest to lowest.','LIMIT restricts the number of returned rows.']::text[],15,8),
  ('salary-summary','Calculate salary statistics','Return the total number of employees, average salary, minimum salary and maximum salary in one result.','Aggregate functions','medium','SELECT\n    COUNT(*) AS employee_count,\n    AVG(salary) AS average_salary,\n    MIN(salary) AS minimum_salary,\n    MAX(salary) AS maximum_salary\nFROM employees;',array['Use COUNT, AVG, MIN and MAX.','Aggregate functions can appear together in one SELECT.']::text[],20,9),
  ('department-salary-average','Average salary by department','Calculate the average salary for each department. Show the department and its average salary.','GROUP BY','medium','SELECT department, AVG(salary) AS average_salary\nFROM employees\nGROUP BY department\nORDER BY department;',array['GROUP BY creates one group for each department.','Apply AVG to the salary column.']::text[],20,10),
  ('high-paying-departments','Filter grouped departments','Show departments whose average salary is greater than 60000.','HAVING','medium','SELECT department, AVG(salary) AS average_salary\nFROM employees\nGROUP BY department\nHAVING AVG(salary) > 60000;',array['HAVING filters groups after GROUP BY.','Use AVG(salary) in the HAVING condition.']::text[],25,11),
  ('above-average-earners','Find above-average earners','Find employees whose salary is greater than the overall average salary. Display their names and salaries in descending salary order.','Subqueries','medium','SELECT name, salary\nFROM employees\nWHERE salary > (\n    SELECT AVG(salary)\n    FROM employees\n)\nORDER BY salary DESC;',array['First calculate the overall average in a subquery.','Compare each employee salary with the scalar result.']::text[],25,12)
) as challenge(slug, title, prompt, topic, difficulty, starter_sql, hints, points, sort_order)
on conflict (dataset_id, slug) do update
set
  title = excluded.title,
  prompt = excluded.prompt,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  starter_sql = excluded.starter_sql,
  hints = excluded.hints,
  points = excluded.points,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published,
  updated_at = now();
