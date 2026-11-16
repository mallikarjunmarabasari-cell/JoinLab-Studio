// Import React state and the database service
import { useState } from 'react'
// import { executeQuery } from '../lib/pglite.js'
import { executeQuery, getDatabase } from '../lib/pglite.js'
import './SqlWorkspace.css'

import CodeMirror from '@uiw/react-codemirror'
// import { sql, PostgreSQL } from '@codemirror/lang-sql' //eslint error
import { sql as sqlLanguage, PostgreSQL } from '@codemirror/lang-sql'

import { loadEmployeePracticeDataset } from '../lib/datasetService.js'

import './SqlWorkspace.css'
// Add a helper to format database values
// Place this function above function SqlWorkspace()
function formatCellValue(value) {
  if (value === null) return 'NULL'

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? 'Invalid Date'
      : value.toISOString().slice(0, 10)
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

function formatDuration(durationMs) {
  if (durationMs < 1) {
    return `${durationMs.toFixed(2)} ms`
  }

  if (durationMs < 1000) {
    return `${durationMs.toFixed(1)} ms`
  }

  return `${(durationMs / 1000).toFixed(2)} s`
}

// result-formatting function
function formatQuerySummary(result) {
  const command = result.command || 'QUERY'
  const returnedRows = result.rows?.length ?? 0

  const modifyingCommands = [
    'INSERT',
    'UPDATE',
    'DELETE',
    'MERGE',
  ]

  if (command === 'SELECT') {
    return `${command} completed · ${returnedRows} row(s) returned`
  }

  if (modifyingCommands.includes(command)) {
    const affectedRows = result.affectedRows ?? result.rowCount ?? 0

    const returnedMessage = returnedRows > 0
      ? ` · ${returnedRows} row(s) returned`
      : ''

    return `${command} completed · ${affectedRows} row(s) affected${returnedMessage}`
  }

  return `${command} completed`
}

function SqlWorkspace() {
  // SQL editor state
  const [sql, setSql] = useState(
    "SELECT 1 AS result, 'JoinLab PostgreSQL' AS message;"
  )

  // Query execution states
  const [queryResult, setQueryResult] = useState(null)
  const [queryError, setQueryError] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const [executionDuration, setExecutionDuration] = useState(null)
  const [executionPhase, setExecutionPhase] = useState('idle')

  const [isLoadingDataset, setIsLoadingDataset] = useState(false)
  const [datasetMessage, setDatasetMessage] = useState('')

  // Run SQL against PGlite
  async function handleRunQuery() {
    setIsRunning(true)
    setQueryError('')
    setQueryResult(null)
    setExecutionDuration(null)
    setExecutionPhase('initializing')

    let startedAt = null

    try {
      // Ensure PostgreSQL is initialized before measuring query time
      await getDatabase()

      setExecutionPhase('executing')

      // Start measuring query execution
      startedAt = performance.now()

      const result = await executeQuery(sql)

      setQueryResult(result)

    } catch (error) {
      setQueryError(
        error instanceof Error ? error.message : String(error)
      )

    } finally {
      // Record duration for both successful and failed SQL queries
      if (startedAt !== null) {
        setExecutionDuration(performance.now() - startedAt)
      }

      setExecutionPhase('idle')
      setIsRunning(false)
    }
  }

  async function handleLoadEmployeeDataset() {
    setIsLoadingDataset(true)
    setDatasetMessage('')

    try {
      const { employeeCount } = await loadEmployeePracticeDataset()

      setDatasetMessage(
        `Employee Practice dataset loaded: ${employeeCount} employees.`
      )
    } catch (error) {
      setDatasetMessage(
        `Dataset loading failed: ${error instanceof Error ? error.message : String(error)
        }`
      )
    } finally {
      setIsLoadingDataset(false)
    }
  }

  return (
    <div className="app-shell">

      {/* Application header */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">JL</div>

          <div>
            <h1>JoinLab Studio</h1>
            <p>SQL learning environment</p>
          </div>
        </div>

        <div className="connection-status">
          <span className="status-dot"></span>
          PostgreSQL · In-browser sandbox
        </div>
      </header>

      <div className="workspace-layout">

        {/* Left navigation */}
        <aside className="sidebar">
          <p className="sidebar-heading">WORKSPACE</p>

          <nav aria-label="Workspace navigation">
            <div className="sidebar-item active">
              SQL Playground
            </div>

            <div className="sidebar-item">
              PostgreSQL Lab
              <span className="sidebar-tag">SOON</span>
            </div>

            <div className="sidebar-item">Saved Projects</div>
          </nav>

          <div className="sidebar-divider"></div>

          <p className="sidebar-heading">LEARNING</p>

          <div className="sidebar-item">Challenges</div>
          <div className="sidebar-item">Progress</div>
        </aside>

        {/* Main workspace */}
        <main className="main-content">

          <section className="page-heading">
            <div>
              <p className="eyebrow">SQL WORKSPACE</p>
              <h2>SQL Playground</h2>
              <p>
                Explore datasets, write queries and inspect results.
              </p>
            </div>
          </section>

          <section className="workbench">

            {/* Database explorer */}
            <section className="panel schema-panel">
              <div className="panel-heading">
                <h3>Database Explorer</h3>
              </div>
              <button
                type="button"
                className="dataset-load-button"
                onClick={handleLoadEmployeeDataset}
                disabled={isLoadingDataset}
              >
                {isLoadingDataset
                  ? 'Loading dataset...'
                  : 'Load Employee Practice Dataset'}
              </button>

              {datasetMessage && (
                <p className="dataset-message" role="status">
                  {datasetMessage}
                </p>
              )}

              <p className="empty-state">
                Select a dataset to explore its tables.
              </p>
            </section>

            {/* SQL editor */}
            <section className="panel editor-panel">
              <div className="panel-heading">
                <h3>Query Editor</h3>
                <span>PostgreSQL</span>
              </div>

              <div className="sql-editor-container">
                <CodeMirror
                  value={sql}
                  height="180px"
                  theme="dark"
                  extensions={[
                    sqlLanguage({ dialect: PostgreSQL })
                  ]}
                  onChange={(value) => setSql(value)}
                  basicSetup
                />
              </div>

              <div className="editor-toolbar">
                <span>
                  {executionPhase === 'initializing' && 'Initializing PostgreSQL...'}
                  {executionPhase === 'executing' && 'Executing SQL...'}
                  {executionPhase === 'idle' && (
                    queryError
                      ? 'Execution failed'
                      : queryResult
                        ? 'Execution completed'
                        : 'Ready to execute'
                  )}
                </span>

                <button
                  type="button"
                  onClick={handleRunQuery}
                  disabled={isRunning || !sql.trim()}
                >
                  {isRunning ? 'Running...' : 'Run Query'}
                </button>
              </div>
            </section>

            {/* Query results */}
            <section className="panel results-panel">
              <div className="panel-heading">
                <h3>Query Results</h3>
              </div>

              {queryError && (
                <p className="query-error" role="alert">
                  {queryError}
                </p>
              )}

              {queryResult && (
                <div className="query-output">

                  <p className="query-status">
                    {formatQuerySummary(queryResult)}
                  </p>
                  {executionDuration !== null && (
                    <p className="query-duration">
                      Execution time: {formatDuration(executionDuration)}
                    </p>
                  )}

                  {queryResult.fields.length > 0 ? (
                    <div className="results-table-wrapper">
                      <table className="query-results-table">

                        <thead>
                          <tr>
                            {queryResult.fields.map((field, index) => (
                              <th key={`${field.name}-${index}`}>
                                {field.name}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {queryResult.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {queryResult.fields.map((field, index) => (
                                <td key={`${field.name}-${index}`}>
                                  {formatCellValue(row[field.name])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>

                      </table>
                    </div>
                  ) : (
                    <p>
                      Query executed successfully. No rows returned.
                    </p>
                  )}

                </div>
              )}

              {!queryResult && !queryError && (
                <p className="empty-state">
                  Your query results will appear here.
                </p>
              )}

            </section>

          </section>
        </main>
      </div>
    </div>
  )
}

export default SqlWorkspace