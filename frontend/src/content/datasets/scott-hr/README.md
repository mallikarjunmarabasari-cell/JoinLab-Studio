JoinLab Studio - SCOTT & HR local dataset

Files:
  frontend/src/content/datasets/scott-hr/dataset.sql
  frontend/src/content/datasets/scott-hr/index.js
  frontend/src/content/datasets/index.js

Source:
  User-provided "SQL plus scott hr db.txt" and "SQL QUESTIONS.pdf".

SCOTT data represented:
  DEPT       4 rows
  EMP       14 rows
  SALGRADE   5 rows
  BONUS      0 rows (empty in source)
  HOTEL      0 rows (empty in source)

HR data represented:
  COUNTRIES    25 rows
  DEPARTMENTS  27 rows
  EMPLOYEES   107 rows
  JOBS         19 rows
  JOB_HISTORY  10 rows
  LOCATIONS    23 rows
  REGIONS       4 rows

There are 12 base tables in expected_tables. EMP_DETAILS_VIEW is mentioned as a
view in the source output; it is not treated as a base table and is not included.

The SQL converts Oracle SQL*Plus date values into PostgreSQL DATE literals and
uses lowercase identifiers. It includes constraints to make the described
relationships usable for join practice. BONUS and HOTEL remain empty as shown
in the source.

Source ambiguity:
The extracted SQL*Plus text for HR EMPLOYEES row 100 ends with the value `90`,
but does not retain enough trailing-column padding to unambiguously distinguish
MANAGER_ID from DEPARTMENT_ID. To avoid silently inventing a correction, this
seed currently preserves the value as manager_id=90 and department_id=NULL.
No self-referencing foreign key is imposed on HR employees.manager_id because
90 is not present as an employee_id in the supplied rows. Check the original
SQL*Plus output alignment before treating that one row as authoritative.

The catalogue index is updated to register all three local datasets:
Employee Practice, Movies & Theaters, and SCOTT & HR Practice.
