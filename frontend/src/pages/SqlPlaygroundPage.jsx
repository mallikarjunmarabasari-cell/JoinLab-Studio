// Import React state and the database service
import { useEffect, useState } from 'react'
// import { executeQuery } from '../lib/pglite.js'
import { executeQuery, getDatabase } from '../lib/pglite.js'
import '../components/SqlPlayground.css'

import CodeMirror from '@uiw/react-codemirror'
// import { sql, PostgreSQL } from '@codemirror/lang-sql' //eslint error
import { sql as sqlLanguage, PostgreSQL } from '@codemirror/lang-sql'

import { loadEmployeePracticeDataset } from '../lib/datasetService.js'

import {
  getDatabaseTables,
  getTableColumns,
  getTableConstraints,
} from '../lib/schemaService.js'

import {
  getSavedScripts,
  createSavedScript,
  updateSavedScript,
  deleteSavedScript,
} from '../lib/savedScriptsService.js'

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

function formatColumnType(column) {
  if (column.character_maximum_length !== null) {
    return `${column.data_type}(${column.character_maximum_length})`
  }

  if (
    column.data_type === 'numeric' &&
    column.numeric_precision !== null
  ) {
    return `numeric(${column.numeric_precision},${column.numeric_scale ?? 0})`
  }

  return column.data_type
}

function SqlPlaygroundPage({ user }) {
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

  const [tables, setTables] = useState([])
  const [isRefreshingTables, setIsRefreshingTables] = useState(false)
  const [schemaError, setSchemaError] = useState('')

  const [selectedTable, setSelectedTable] = useState(null)
  const [columns, setColumns] = useState([])
  const [isLoadingColumns, setIsLoadingColumns] = useState(false)
  const [columnError, setColumnError] = useState('')

  const [constraints, setConstraints] = useState([])

  // Saved SQL scripts state
  const [savedScripts, setSavedScripts] = useState([])
  const [scriptName, setScriptName] = useState('')
  const [selectedScriptId, setSelectedScriptId] = useState(null)

  const [isLoadingScripts, setIsLoadingScripts] = useState(false)
  const [isSavingScript, setIsSavingScript] = useState(false)
  const [isDeletingScriptId, setIsDeletingScriptId] = useState(null)

  const [scriptMessage, setScriptMessage] = useState('')
  const [scriptError, setScriptError] = useState('')

  // Load cloud-saved scripts when the authenticated account opens SQLDesk.
  useEffect(() => {
    let isActive = true

    async function loadInitialScripts() {
      setIsLoadingScripts(true)
      setScriptError('')

      try {
        const scripts = await getSavedScripts()

        if (isActive) {
          setSavedScripts(scripts)
        }
      } catch (error) {
        if (isActive) {
          setScriptError(
            error instanceof Error ? error.message : String(error)
          )
        }
      } finally {
        if (isActive) {
          setIsLoadingScripts(false)
        }
      }
    }

    loadInitialScripts()

    return () => {
      isActive = false
    }
  }, [user.id])
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
      await getDatabase(user.id)

      setExecutionPhase('executing')

      // Start measuring query execution
      startedAt = performance.now()

      const result = await executeQuery(user.id, sql)

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
      const { employeeCount } = await loadEmployeePracticeDataset(user.id)

      await handleRefreshTables()

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

  async function handleRefreshTables() {
    setIsRefreshingTables(true)
    setSchemaError('')

    try {
      const tableNames = await getDatabaseTables(user.id)
      setTables(tableNames)
    } catch (error) {
      setSchemaError(
        error instanceof Error ? error.message : String(error)
      )
    } finally {
      setIsRefreshingTables(false)
    }
  }

  async function handleSelectTable(tableName) {
    setSelectedTable(tableName)
    setColumns([])
    setConstraints([])
    setColumnError('')
    setIsLoadingColumns(true)

    try {
      const [columnDetails, constraintDetails] = await Promise.all([
        getTableColumns(user.id, tableName),
        getTableConstraints(user.id, tableName),
      ])

      setColumns(columnDetails)
      setConstraints(constraintDetails)
    } catch (error) {
      setColumnError(
        error instanceof Error ? error.message : String(error)
      )
    } finally {
      setIsLoadingColumns(false)
    }
  }

  // Manually refresh the saved scripts list.
  async function handleRefreshSavedScripts() {
    setIsLoadingScripts(true)
    setScriptError('')
    setScriptMessage('')

    try {
      const scripts = await getSavedScripts()
      setSavedScripts(scripts)
    } catch (error) {
      setScriptError(
        error instanceof Error ? error.message : String(error)
      )
    } finally {
      setIsLoadingScripts(false)
    }
  }

  // Save the current editor contents as a new cloud script.
  async function handleSaveNewScript() {
    setIsSavingScript(true)
    setScriptError('')
    setScriptMessage('')

    try {
      const savedScript = await createSavedScript(scriptName, sql)

      setSavedScripts((currentScripts) => [
        savedScript,
        ...currentScripts.filter((script) => script.id !== savedScript.id),
      ])

      setSelectedScriptId(savedScript.id)
      setScriptName(savedScript.name)
      setScriptMessage(`Saved "${savedScript.name}".`)
    } catch (error) {
      setScriptError(
        error instanceof Error ? error.message : String(error)
      )
    } finally {
      setIsSavingScript(false)
    }
  }

  // Update the currently selected saved script.
  async function handleUpdateSavedScript() {
    if (!selectedScriptId) {
      setScriptError('Load a saved script before updating it.')
      return
    }

    setIsSavingScript(true)
    setScriptError('')
    setScriptMessage('')

    try {
      const updatedScript = await updateSavedScript(
        selectedScriptId,
        scriptName,
        sql
      )

      setSavedScripts((currentScripts) =>
        currentScripts
          .map((script) =>
            script.id === updatedScript.id ? updatedScript : script
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          )
      )

      setScriptMessage(`Updated "${updatedScript.name}".`)
    } catch (error) {
      setScriptError(
        error instanceof Error ? error.message : String(error)
      )
    } finally {
      setIsSavingScript(false)
    }
  }

  // Load a saved script into CodeMirror without executing it.
  function handleLoadSavedScript(script) {
    setSql(script.sql_text)
    setScriptName(script.name)
    setSelectedScriptId(script.id)

    setQueryResult(null)
    setQueryError('')
    setExecutionDuration(null)
    setExecutionPhase('idle')

    setScriptError('')
    setScriptMessage(`Loaded "${script.name}" into the editor.`)
  }

  // Prepare the editor contents to be saved as a different script.
  function handleStartNewScript() {
    setSelectedScriptId(null)
    setScriptName('')
    setScriptError('')
    setScriptMessage('Ready to save a new script.')
  }

  // Delete a saved script after confirmation.
  async function handleDeleteSavedScript(scriptId) {
    const script = savedScripts.find((item) => item.id === scriptId)

    if (!script) return

    const confirmed = window.confirm(
      `Delete "${script.name}"? This action cannot be undone.`
    )

    if (!confirmed) return

    setIsDeletingScriptId(scriptId)
    setScriptError('')
    setScriptMessage('')

    try {
      await deleteSavedScript(scriptId)

      setSavedScripts((currentScripts) =>
        currentScripts.filter((item) => item.id !== scriptId)
      )

      if (selectedScriptId === scriptId) {
        setSelectedScriptId(null)
      }

      setScriptMessage(`Deleted "${script.name}".`)
    } catch (error) {
      setScriptError(
        error instanceof Error ? error.message : String(error)
      )
    } finally {
      setIsDeletingScriptId(null)
    }
  }

  return (
    <>
        {/* Main workspace */}
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

              <div className="database-tables">
                <div className="panel-heading">
                  <h4>Tables</h4>

                  <button
                    type="button"
                    onClick={handleRefreshTables}
                    disabled={isRefreshingTables}
                  >
                    {isRefreshingTables ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {schemaError && (
                  <p className="query-error" role="alert">
                    {schemaError}
                  </p>
                )}

                {tables.length > 0 ? (
                  <ul className="database-table-list">
                    {tables.map((tableName) => (
                      <li key={tableName}>
                        <button
                          type="button"
                          className={`table-select-button ${selectedTable === tableName ? 'active' : ''
                            }`}
                          onClick={() => handleSelectTable(tableName)}
                        >
                          <span aria-hidden="true">▤</span>
                          {tableName}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">
                    No tables found. Load a dataset first.
                  </p>
                )}
                {selectedTable && (
                  <>
                    {/* Table columns */}
                    <section className="table-structure">
                      <h4>{selectedTable} — Columns</h4>

                      {isLoadingColumns ? (
                        <p>Loading columns...</p>
                      ) : columnError ? (
                        <p className="query-error" role="alert">
                          {columnError}
                        </p>
                      ) : columns.length > 0 ? (
                        <div className="results-table-wrapper">
                          <table className="query-results-table">
                            <thead>
                              <tr>
                                <th>Column</th>
                                <th>Data type</th>
                                <th>Nullable</th>
                              </tr>
                            </thead>

                            <tbody>
                              {columns.map((column) => (
                                <tr key={column.column_name}>
                                  <td>{column.column_name}</td>
                                  <td>{formatColumnType(column)}</td>
                                  <td>
                                    {column.is_nullable === 'YES' ? 'Yes' : 'No'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p>No column information available.</p>
                      )}
                    </section>

                    {/* Table constraints */}
                    <section className="table-constraints">
                      <h4>Constraints</h4>

                      {constraints.length > 0 ? (
                        <ul>
                          {constraints.map((constraint) => (
                            <li key={constraint.constraint_name}>
                              <strong>{constraint.constraint_type}</strong>

                              <span>{constraint.constraint_name}</span>

                              {constraint.columns?.length > 0 && (
                                <p>
                                  Columns: {constraint.columns.join(', ')}
                                </p>
                              )}

                              {constraint.constraint_type === 'FOREIGN KEY' &&
                                constraint.referenced_columns?.length > 0 && (
                                  <p>
                                    References: {constraint.referenced_columns.join(', ')}
                                  </p>
                                )}

                              {constraint.check_clause && (
                                <p>Check: {constraint.check_clause}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No constraints found.</p>
                      )}
                    </section>
                  </>
                )}
              </div>

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
              {/* Saved SQL Scripts */}
              <section className="saved-scripts-section">
                <div className="saved-scripts-header">
                  <h4>Saved SQL Scripts</h4>

                  <button
                    type="button"
                    onClick={handleRefreshSavedScripts}
                    disabled={isLoadingScripts}
                  >
                    {isLoadingScripts ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                <div className="saved-script-form">
                  <label htmlFor="saved-script-name">
                    Script name
                  </label>

                  <input
                    id="saved-script-name"
                    type="text"
                    value={scriptName}
                    onChange={(event) => setScriptName(event.target.value)}
                    placeholder="e.g. Employee salary analysis"
                    maxLength={100}
                    disabled={isSavingScript}
                  />

                  <div className="saved-script-actions">
                    <button
                      type="button"
                      onClick={handleSaveNewScript}
                      disabled={isSavingScript || !scriptName.trim() || !sql.trim()}
                    >
                      {isSavingScript ? 'Saving...' : 'Save as New'}
                    </button>

                    <button
                      type="button"
                      onClick={handleUpdateSavedScript}
                      disabled={
                        !selectedScriptId ||
                        isSavingScript ||
                        !scriptName.trim() ||
                        !sql.trim()
                      }
                    >
                      Update Selected
                    </button>

                    <button
                      type="button"
                      onClick={handleStartNewScript}
                      disabled={isSavingScript}
                    >
                      New Script
                    </button>
                  </div>
                </div>

                {scriptError && (
                  <p className="query-error" role="alert">
                    {scriptError}
                  </p>
                )}

                {scriptMessage && (
                  <p className="dataset-message" role="status">
                    {scriptMessage}
                  </p>
                )}

                <div className="saved-scripts-list">
                  {isLoadingScripts ? (
                    <p className="empty-state">Loading saved scripts...</p>
                  ) : savedScripts.length > 0 ? (
                    savedScripts.map((script) => (
                      <div className="saved-script-item" key={script.id}>
                        <div className="saved-script-details">
                          <strong>{script.name}</strong>
                          <span>
                            Updated {new Date(script.updated_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="saved-script-item-actions">
                          <button
                            type="button"
                            onClick={() => handleLoadSavedScript(script)}
                            aria-pressed={selectedScriptId === script.id}
                          >
                            Load
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSavedScript(script.id)}
                            disabled={
                              isDeletingScriptId !== null ||
                              isSavingScript
                            }
                          >
                            {isDeletingScriptId === script.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">
                      No saved scripts yet. Save your first SQL query above.
                    </p>
                  )}
                </div>
              </section>
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
        </>
  )
}
export default SqlPlaygroundPage