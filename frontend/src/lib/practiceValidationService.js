import { PGlite } from "@electric-sql/pglite";

const referenceQueriesByDataset = {
  "employee-practice": {
    "view-all-employees": `
      SELECT * FROM employees;
    `,

    "choose-employee-columns": `
      SELECT name, department, job_title
      FROM employees;
    `,

    "filter-it-employees": `
      SELECT *
      FROM employees
      WHERE department = 'IT';
    `,

    "high-salary-employees": `
      SELECT name, salary
      FROM employees
      WHERE salary > 65000;
    `,

    "salary-and-age-filter": `
      SELECT name, salary, age
      FROM employees
      WHERE salary BETWEEN 50000 AND 80000
        AND age < 32;
    `,

    "employees-in-cities": `
      SELECT name, city
      FROM employees
      WHERE city IN ('Mumbai', 'Pune', 'Delhi');
    `,

    "search-employee-names": `
      SELECT name
      FROM employees
      WHERE name ILIKE '%a%';
    `,

    "top-three-salaries": `
      SELECT name, salary
      FROM employees
      ORDER BY salary DESC
      LIMIT 3;
    `,

    "salary-summary": `
      SELECT
        COUNT(*) AS employee_count,
        AVG(salary) AS average_salary,
        MIN(salary) AS minimum_salary,
        MAX(salary) AS maximum_salary
      FROM employees;
    `,

    "department-salary-average": `
      SELECT department, AVG(salary) AS average_salary
      FROM employees
      GROUP BY department
      ORDER BY department;
    `,

    "high-paying-departments": `
      SELECT department, AVG(salary) AS average_salary
      FROM employees
      GROUP BY department
      HAVING AVG(salary) > 60000;
    `,

    "above-average-earners": `
      SELECT name, salary
      FROM employees
      WHERE salary > (
        SELECT AVG(salary)
        FROM employees
      )
      ORDER BY salary DESC;
    `,
  },
};

const orderSensitivePracticeItemsByDataset = {
  "employee-practice": new Set(["top-three-salaries", "above-average-earners"]),
};

function normalizeValue(value) {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return { type: "date", value: value.toISOString() };
  }

  if (typeof value === "bigint") {
    return { type: "bigint", value: value.toString() };
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeValue(value[key])]),
    );
  }

  return value;
}

function normalizeResult(result, preserveOrder) {
  const fields = result.fields ?? [];

  const rows = (result.rows ?? []).map((row) =>
    fields.map((field) => normalizeValue(row[field.name])),
  );

  if (!preserveOrder) {
    rows.sort((left, right) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right)),
    );
  }

  return {
    columnCount: fields.length,
    rows,
  };
}

export async function validatePracticeAttempt({
  dataset,
  practice,
  submittedSql,
}) {
  if (
    !dataset ||
    typeof dataset.dataset_sql !== "string" ||
    !dataset.dataset_sql.trim()
  ) {
    return {
      passed: false,
      feedback: "The published dataset SQL is unavailable for validation.",
    };
  }

  if (typeof submittedSql !== "string" || !submittedSql.trim()) {
    return {
      passed: false,
      feedback: "Write a SQL query before running it.",
    };
  }

  const datasetSlug = dataset.slug;
  const practiceSlug = practice?.slug;

  if (!datasetSlug || !practiceSlug) {
    return {
      passed: false,
      feedback: "The dataset or practice item identifier is missing.",
    };
  }

  if (practice.dataset_id !== dataset.id) {
    return {
      passed: false,
      feedback: "This practice item does not belong to the selected dataset.",
    };
  }

  const expectedSql = referenceQueriesByDataset[datasetSlug]?.[practiceSlug];
  if (!expectedSql) {
    return {
      passed: false,
      feedback: "Validation is not configured for this practice item yet.",
    };
  }

  let submissionDatabase;
  let referenceDatabase;

  try {
    // Two independent databases, both initialized from the original dataset.
    submissionDatabase = await PGlite.create();
    referenceDatabase = await PGlite.create();

    await Promise.all([
      submissionDatabase.exec(dataset.dataset_sql),
      referenceDatabase.exec(dataset.dataset_sql),
    ]);

    // Each query runs against its own clean database.
    const submittedResult = await submissionDatabase.query(submittedSql);
    const expectedResult = await referenceDatabase.query(expectedSql);

    const preserveOrder =
      orderSensitivePracticeItemsByDataset[datasetSlug]?.has(practiceSlug) ??
      false;
    const actual = normalizeResult(submittedResult, preserveOrder);
    const expected = normalizeResult(expectedResult, preserveOrder);

    const passed = JSON.stringify(actual) === JSON.stringify(expected);

    return {
      passed,
      feedback: passed
        ? "Correct! Your answer has been verified."
        : "Your query executed, but its result does not match the expected result. Review the instructions and hints.",
    };
  } catch (error) {
    return {
      passed: false,
      feedback:
        error instanceof Error
          ? `Validation could not be completed: ${error.message}`
          : "Unable to validate this query.",
    };
  } finally {
    // Temporary databases must never remain open after validation.
    await Promise.allSettled(
      [submissionDatabase, referenceDatabase]
        .filter(Boolean)
        .map((database) => database.close()),
    );
  }
}
