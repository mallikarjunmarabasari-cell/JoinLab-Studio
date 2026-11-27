import { PGlite } from "@electric-sql/pglite";

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

  if (practice.dataset_slug !== datasetSlug) {
    return {
      passed: false,
      feedback: "This practice item does not belong to the selected dataset.",
    };
  }

  const expectedSql = practice.reference_sql;

  if (typeof expectedSql !== "string" || !expectedSql.trim()) {
    return {
      passed: false,
      feedback: "Reference SQL is missing for this practice item.",
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

    const preserveOrder = practice.preserve_order === true;
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
