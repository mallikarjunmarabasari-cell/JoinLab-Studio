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
    empid, name, department, job_title, salary,
    age, experience, city, joining_date, bonus
) VALUES
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