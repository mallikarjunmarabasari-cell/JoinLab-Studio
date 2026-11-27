import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql as sqlLanguage, PostgreSQL } from '@codemirror/lang-sql'

import {
    getPublishedDatasets,
    getPublishedDataset,
    getPublishedPracticeItems,
    getUserPracticeProgress,
    markPracticeCompleted,
} from '../lib/learningContentService.js'

import {
    DatasetVersionMismatchError,
    openPracticeDatabase,
    executePracticeQuery,
    getPracticeTables,
    resetPracticeDatabase,
} from '../lib/practiceDatabaseService.js'

import { validatePracticeAttempt } from '../lib/practiceValidationService.js'
import './PracticePage.css'

function formatCellValue(value) {
    if (value === null) return 'NULL'
    if (value instanceof Date) return value.toISOString().slice(0, 10)
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

function PracticePage({ user }) {
    const [datasets, setDatasets] = useState([])
    const [selectedDataset, setSelectedDataset] = useState(null)
    const [activeDataset, setActiveDataset] = useState(null)

    const [practiceItems, setPracticeItems] = useState([])
    const [activePracticeItemId, setActivePracticeItemId] = useState(null)
    const [progress, setProgress] = useState({})

    const [isLoadingDatasets, setIsLoadingDatasets] = useState(true)
    const [isLoadingPracticeItems, setIsLoadingPracticeItems] = useState(false)
    const [isOpeningDataset, setIsOpeningDataset] = useState(false)
    const [isResettingDataset, setIsResettingDataset] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const [isSavingProgress, setIsSavingProgress] = useState(false)

    const [datasetsError, setDatasetsError] = useState('')
    const [workspaceError, setWorkspaceError] = useState('')
    const [workspaceMessage, setWorkspaceMessage] = useState('')
    const [queryError, setQueryError] = useState('')
    const [practiceFeedback, setPracticeFeedback] = useState('')
    const [validationPassed, setValidationPassed] = useState(null)

    const [queryResult, setQueryResult] = useState(null)
    const [sql, setSql] = useState('SELECT * FROM employees;')
    const [tables, setTables] = useState([])
    const [showHints, setShowHints] = useState(false)

    const activePracticeItem = practiceItems.find(
        (practice) => practice.id === activePracticeItemId
    )

    const [datasetVersionMismatch, setDatasetVersionMismatch] = useState(null)

    async function loadDatasets() {
        setIsLoadingDatasets(true)
        setDatasetsError('')

        try {
            const result = await getPublishedDatasets()
            setDatasets(result)
        } catch (error) {
            setDatasetsError(
                error instanceof Error ? error.message : String(error)
            )
        } finally {
            setIsLoadingDatasets(false)
        }
    }

    useEffect(() => {
        let isActive = true

        getPublishedDatasets()
            .then((result) => {
                if (isActive) {
                    setDatasets(result)
                }
            })
            .catch((error) => {
                if (isActive) {
                    setDatasetsError(
                        error instanceof Error ? error.message : String(error)
                    )
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoadingDatasets(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [user.id])

    async function handleSelectDataset(dataset) {
        setSelectedDataset(dataset)
        setActiveDataset(null)
        setPracticeItems([])
        setActivePracticeItemId(null)
        setProgress({})
        setTables([])
        setWorkspaceError('')
        setWorkspaceMessage('')
        setQueryResult(null)
        setQueryError('')
        setPracticeFeedback('')
        setValidationPassed(null)
        setIsLoadingPracticeItems(true)
        setDatasetVersionMismatch(null)

        try {
            const practiceItemList = await getPublishedPracticeItems(dataset.slug)

            const progressList = await getUserPracticeProgress(
                dataset.slug,
                dataset.version,
                practiceItemList.map((practice) => practice.slug)
            )

            const progressMap = Object.fromEntries(
                progressList.map((item) => [item.practice_slug, item])
            )

            setPracticeItems(practiceItemList)
            setProgress(progressMap)
            setActivePracticeItemId(practiceItemList[0]?.id ?? null)
        } catch (error) {
            setWorkspaceError(
                error instanceof Error ? error.message : String(error)
            )
        } finally {
            setIsLoadingPracticeItems(false)
        }
    }

    async function handleLoadDataset() {
        if (!selectedDataset) return

        setIsOpeningDataset(true)
        setWorkspaceError('')
        setWorkspaceMessage('')
        setDatasetVersionMismatch(null)

        try {
            const dataset = await getPublishedDataset(selectedDataset.slug)

            const result = await openPracticeDatabase(user.id, dataset)

            setActiveDataset(dataset)
            setTables(result.tables)

            setWorkspaceMessage(
                result.resumed
                    ? 'Resumed your existing practice database. Your previous SQL changes are preserved.'
                    : 'Dataset initialized successfully in your local practice database.'
            )

            if (practiceItems.length > 0) {
                setActivePracticeItemId(practiceItems[0].id)
                setSql(practiceItems[0].starter_sql)
            }
        } catch (error) {
            if (error instanceof DatasetVersionMismatchError) {
                setDatasetVersionMismatch({
                    storedVersion: error.storedVersion,
                    publishedVersion: error.publishedVersion,
                })
            } else {
                setWorkspaceError(
                    error instanceof Error ? error.message : String(error)
                )
            }
        } finally {
            setIsOpeningDataset(false)
        }
    }


    async function handleResetDataset() {
        if (!selectedDataset || (!activeDataset && !datasetVersionMismatch)) return

        const confirmed = window.confirm(
            'Reset this dataset to its latest published version? All changes, inserted records and custom tables in this dataset workspace will be lost. Your general SQL Playground and cloud practice progress will remain unchanged.'
        )

        if (!confirmed) return

        setIsResettingDataset(true)
        setWorkspaceError('')
        setWorkspaceMessage('')

        try {
            // Fetch the latest published content before making destructive changes.
            const latestDataset = await getPublishedDataset(selectedDataset.slug)

            const latestPracticeItems = await getPublishedPracticeItems(
                latestDataset.slug
            )

            // Load progress belonging to this exact dataset version.
            const latestProgressList = await getUserPracticeProgress(
                latestDataset.slug,
                latestDataset.version,
                latestPracticeItems.map((practice) => practice.slug)
            )

            const latestProgressMap = Object.fromEntries(
                latestProgressList.map((item) => [
                    item.practice_slug,
                    item,
                ])
            )

            // Only reset the local database after content and progress are available.
            const result = await resetPracticeDatabase(
                user.id,
                latestDataset
            )

            const firstPracticeItem = latestPracticeItems[0] ?? null

            const updatedDatasetSummary = {
                id: latestDataset.id,
                slug: latestDataset.slug,
                name: latestDataset.name,
                description: latestDataset.description,
                expected_tables: latestDataset.expected_tables,
                version: latestDataset.version,
            }

            // Synchronize the dataset selector and active workspace.
            setDatasets((current) =>
                current.map((dataset) =>
                    dataset.slug === latestDataset.slug
                        ? updatedDatasetSummary
                        : dataset
                )
            )

            setSelectedDataset(updatedDatasetSummary)
            setActiveDataset(latestDataset)

            // Synchronize exercises and version-specific cloud progress.
            setPracticeItems(latestPracticeItems)
            setProgress(latestProgressMap)
            setActivePracticeItemId(firstPracticeItem?.id ?? null)

            // Synchronize the local database explorer and SQL editor.
            setTables(result.tables)
            setSql(firstPracticeItem?.starter_sql ?? '')

            // Clear stale results and validation feedback.
            setQueryResult(null)
            setQueryError('')
            setPracticeFeedback('')
            setValidationPassed(null)
            setShowHints(false)
            setDatasetVersionMismatch(null)

            setWorkspaceMessage(
                `Dataset updated to published version ${result.version}. Practice items and progress have been synchronized.`
            )
        } catch (error) {
            setWorkspaceError(
                error instanceof Error ? error.message : String(error)
            )
        } finally {
            setIsResettingDataset(false)
        }
    }


    function handleSqlChange(nextSql) {
        setSql(nextSql)
        setQueryResult(null)
        setQueryError('')
        setPracticeFeedback('')
        setValidationPassed(null)
        setWorkspaceMessage('')
    }
    async function handleRunQuery() {
        if (!activeDataset || !sql.trim()) return

        setIsRunning(true)
        setQueryError('')
        setQueryResult(null)
        setPracticeFeedback('')
        setValidationPassed(null)
        setWorkspaceError('')
        setWorkspaceMessage('')

        try {
            const result = await executePracticeQuery(
                user.id,
                activeDataset.slug,
                sql
            )

            setQueryResult(result)

            try {
                const currentTables = await getPracticeTables(
                    user.id,
                    activeDataset.slug
                )
                setTables(currentTables)
            } catch (tableError) {
                setWorkspaceError(
                    'Query executed, but the table explorer could not refresh: ' +
                    (tableError instanceof Error
                        ? tableError.message
                        : String(tableError))
                )
            }

            if (!activePracticeItem) {
                setPracticeFeedback(
                    'Query executed. Select a practice item to validate your answer.'
                )
                return
            }

            const validation = await validatePracticeAttempt({
                dataset: activeDataset,
                practice: activePracticeItem,
                submittedSql: sql,
            })

            setPracticeFeedback(validation.feedback)
            setValidationPassed(validation.passed)

            if (
                validation.passed &&
                progress[activePracticeItem.slug]?.status !== 'completed'
            ) {
                setIsSavingProgress(true)

                try {
                    const completed = await markPracticeCompleted(
                        activeDataset.slug,
                        activePracticeItem.slug,
                        activeDataset.version
                    )

                    setProgress((current) => ({
                        ...current,
                        [completed.practice_slug]: completed,
                    }))

                    setWorkspaceMessage(
                        'Completed: ' + activePracticeItem.title
                    )
                } catch (saveError) {
                    setWorkspaceError(
                        'Your answer is correct, but progress could not be saved: ' +
                        (saveError instanceof Error
                            ? saveError.message
                            : String(saveError))
                    )
                } finally {
                    setIsSavingProgress(false)
                }
            }
        } catch (error) {
            setQueryError(
                error instanceof Error ? error.message : String(error)
            )
        } finally {
            setIsRunning(false)
        }
    }
    function handleSelectPractice(practice) {
        setActivePracticeItemId(practice.id)
        setSql(practice.starter_sql || '')
        setQueryResult(null)
        setQueryError('')
        setPracticeFeedback('')
        setValidationPassed(null)
        setShowHints(false)
    }
    function handleBackToDatasets() {
        setSelectedDataset(null)
        setActiveDataset(null)
        setPracticeItems([])
        setProgress({})
        setTables([])
        setWorkspaceError('')
        setWorkspaceMessage('')
        setQueryResult(null)
        setQueryError('')
        setPracticeFeedback('')
        setValidationPassed(null)
        setDatasetVersionMismatch(null)
    }

    const completedCount = practiceItems.filter(
        (practice) => progress[practice.id]?.status === 'completed'
    ).length

    return (
        <div className="practice-page">
            <section className="page-heading">
                <div>
                    <p className="eyebrow">LEARNING</p>
                    <h2>SQL Practice</h2>
                    <p>
                        Practice PostgreSQL through curated datasets and
                        step-by-step SQL exercises.
                    </p>
                </div>
            </section>

            {datasetsError && (
                <div className="practice-error" role="alert">
                    <p>{datasetsError}</p>
                    <button type="button" onClick={loadDatasets}>
                        Retry
                    </button>
                </div>
            )}

            {!selectedDataset && (
                <section className="practice-panel">
                    <div className="practice-panel-heading">
                        <div>
                            <h3>Practice Datasets</h3>
                            <p>Select a dataset to explore its SQL exercises.</p>
                        </div>

                        <button
                            type="button"
                            onClick={loadDatasets}
                            disabled={isLoadingDatasets}
                        >
                            {isLoadingDatasets ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {isLoadingDatasets ? (
                        <p className="practice-empty">
                            Loading published datasets...
                        </p>
                    ) : datasets.length > 0 ? (
                        <div className="dataset-grid">
                            {datasets.map((dataset) => (
                                <article className="dataset-card" key={dataset.id}>
                                    <div className="dataset-card-top">
                                        <span className="dataset-category">POSTGRESQL</span>
                                        <span className="dataset-version">
                                            v{dataset.version}
                                        </span>
                                    </div>

                                    <h3>{dataset.name}</h3>

                                    <p>{dataset.description}</p>

                                    <div className="dataset-tables">
                                        {dataset.expected_tables?.map((table) => (
                                            <span key={table}>{table}</span>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className="practice-primary-button"
                                        onClick={() => handleSelectDataset(dataset)}
                                    >
                                        View Practice
                                    </button>
                                </article>
                            ))}
                        </div>
                    ) : !datasetsError ? (
                        <p className="practice-empty">
                            No published datasets are currently available.
                        </p>
                    ) : null}
                </section>
            )}

            {selectedDataset && (
                <>
                    <button
                        type="button"
                        className="practice-back-button"
                        onClick={handleBackToDatasets}
                    >
                        ← All datasets
                    </button>

                    <section className="selected-dataset-header">
                        <div>
                            <p className="eyebrow">PRACTICE DATASET</p>
                            <h3>{selectedDataset.name}</h3>
                            <p>{selectedDataset.description}</p>

                            <span className="dataset-version">
                                Dataset version {selectedDataset.version}
                            </span>
                        </div>

                        <div className="dataset-load-actions">
                            <button
                                type="button"
                                className="practice-primary-button"
                                onClick={handleLoadDataset}
                                disabled={isOpeningDataset || isResettingDataset}
                            >
                                {isOpeningDataset
                                    ? 'Opening...'
                                    : activeDataset
                                        ? 'Resume Dataset'
                                        : 'Load Dataset'}
                            </button>

                            {activeDataset && (
                                <button
                                    type="button"
                                    className="practice-secondary-button"
                                    onClick={handleResetDataset}
                                    disabled={isResettingDataset || isOpeningDataset}
                                >
                                    {isResettingDataset ? 'Resetting...' : 'Reset to Original'}
                                </button>
                            )}
                        </div>
                    </section>

                    {workspaceError && (
                        <p className="practice-error" role="alert">
                            {workspaceError}
                        </p>
                    )}

                    {workspaceMessage && (
                        <p className="practice-success" role="status">
                            {workspaceMessage}
                        </p>
                    )}
                    {datasetVersionMismatch && (
                        <section className="practice-panel">
                            <div className="practice-panel-heading">
                                <div>
                                    <h3>Dataset update available</h3>
                                    <p>
                                        Your saved workspace uses version{' '}
                                        <strong>{datasetVersionMismatch.storedVersion}</strong>,
                                        but version{' '}
                                        <strong>{datasetVersionMismatch.publishedVersion}</strong>
                                        {' '}is now published.
                                    </p>
                                </div>
                            </div>

                            <p>
                                Your existing local SQL changes have been preserved.
                                Resetting will replace only this dataset's local workspace.
                                Your cloud progress remains unchanged.
                            </p>

                            <div className="dataset-load-actions">
                                <button
                                    type="button"
                                    className="practice-primary-button"
                                    onClick={handleResetDataset}
                                    disabled={isResettingDataset}
                                >
                                    {isResettingDataset
                                        ? 'Updating...'
                                        : `Reset to version ${datasetVersionMismatch.publishedVersion}`}
                                </button>

                                <button
                                    type="button"
                                    className="practice-secondary-button"
                                    onClick={() => setDatasetVersionMismatch(null)}
                                    disabled={isResettingDataset}
                                >
                                    Not now
                                </button>
                            </div>
                        </section>
                    )}

                    {isLoadingPracticeItems ? (
                        <p className="practice-empty">Loading practice exercises...</p>
                    ) : (
                        <div className="practice-workspace">
                            <aside className="practice-panel practice-navigator">
                                <div className="practice-panel-heading">
                                    <div>
                                        <h3>Practice</h3>
                                        <p>
                                            {completedCount} of {practiceItems.length} completed
                                        </p>
                                    </div>
                                </div>

                                <div className="practice-progress-track">
                                    <div
                                        style={{
                                            width: practiceItems.length
                                                ? `${(completedCount / practiceItems.length) * 100}%`
                                                : '0%',
                                        }}
                                    />
                                </div>

                                <div className="practice-list">
                                    {practiceItems.map((practice, index) => (
                                        <button
                                            type="button"
                                            key={practice.id}
                                            className={`practice-list-item ${activePracticeItemId === practice.id ? 'active' : ''
                                                }`}
                                            onClick={() => handleSelectPractice(practice)}
                                        >
                                            <span className="practice-list-number">
                                                {progress[practice.id]?.status === 'completed'
                                                    ? '✓'
                                                    : String(index + 1).padStart(2, '0')}
                                            </span>

                                            <span className="practice-list-copy">
                                                <strong>{practice.title}</strong>
                                                <small>{practice.topic}</small>
                                            </span>

                                            <span
                                                className={`difficulty-tag ${practice.difficulty}`}
                                            >
                                                {practice.difficulty}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </aside>

                            <div className="practice-main-column">
                                {activePracticeItem ? (
                                    <section className="practice-panel practice-instructions">
                                        <div className="practice-panel-heading">
                                            <div>
                                                <span className="dataset-category">
                                                    {activePracticeItem.topic}
                                                </span>
                                                <h3>{activePracticeItem.title}</h3>
                                            </div>

                                            <span
                                                className={`difficulty-tag ${activePracticeItem.difficulty}`}
                                            >
                                                {activePracticeItem.difficulty}
                                            </span>
                                        </div>

                                        <p>{activePracticeItem.prompt}</p>

                                        {activePracticeItem.hints?.length > 0 && (
                                            <div className="practice-hints">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowHints((current) => !current)}
                                                >
                                                    {showHints ? 'Hide hints' : 'Show hints'}
                                                </button>

                                                {showHints && (
                                                    <ol>
                                                        {activePracticeItem.hints.map((hint, index) => (
                                                            <li key={index}>{hint}</li>
                                                        ))}
                                                    </ol>
                                                )}
                                            </div>
                                        )}
                                    </section>
                                ) : (
                                    <section className="practice-panel">
                                        <p className="practice-empty">
                                            No published practice exercises found for this dataset.
                                        </p>
                                    </section>
                                )}

                                {!activeDataset ? (
                                    <section className="practice-panel">
                                        <h3>Your SQL workspace</h3>
                                        <p className="practice-empty">
                                            Load the dataset to initialize your private SQL
                                            practice database. Your editor and SQL execution
                                            workspace will become available here.
                                        </p>
                                    </section>
                                ) : (
                                    <>
                                        <section className="practice-panel practice-editor-panel">
                                            <div className="practice-panel-heading">
                                                <div>
                                                    <h3>SQL Editor</h3>
                                                    <p>PostgreSQL · Local practice database</p>
                                                </div>

                                                <span className="database-ready">
                                                    Database ready
                                                </span>
                                            </div>

                                            <div className="practice-code-editor">
                                                <CodeMirror
                                                    value={sql}
                                                    height="250px"
                                                    theme="dark"
                                                    extensions={[
                                                        sqlLanguage({ dialect: PostgreSQL }),
                                                    ]}
                                                    onChange={handleSqlChange}
                                                    basicSetup
                                                />
                                            </div>

                                            <div className="practice-editor-toolbar">
                                                <span>
                                                    {isRunning
                                                        ? 'Executing SQL...'
                                                        : 'Ready to execute'}
                                                </span>

                                                <button
                                                    type="button"
                                                    className="practice-primary-button"
                                                    onClick={handleRunQuery}
                                                    disabled={isRunning || !sql.trim()}
                                                >
                                                    {isRunning ? 'Running...' : 'Run Query'}
                                                </button>
                                            </div>
                                        </section>

                                        <section className="practice-panel">
                                            <div className="practice-panel-heading">
                                                <h3>Query Results</h3>
                                            </div>

                                            {queryError && (
                                                <p className="practice-error" role="alert">
                                                    {queryError}
                                                </p>
                                            )}

                                            {practiceFeedback && (
                                                <p
                                                    className={
                                                        validationPassed === true
                                                            ? 'practice-success'
                                                            : validationPassed === false
                                                                ? 'practice-error'
                                                                : 'practice-empty'
                                                    }
                                                    role="status"
                                                >
                                                    {practiceFeedback}
                                                </p>
                                            )}

                                            {queryResult && (
                                                <>
                                                    <p className="query-duration">
                                                        {queryResult.command || 'QUERY'} completed ·
                                                        {' '}{queryResult.rows?.length ?? 0} row(s) returned
                                                    </p>

                                                    {queryResult.fields?.length > 0 ? (
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
                                                        <p>SQL executed successfully. No rows returned.</p>
                                                    )}
                                                </>
                                            )}

                                            {!queryResult && !queryError && (
                                                <p className="practice-empty">
                                                    Execute your SQL query to see results.
                                                </p>
                                            )}
                                        </section>

                                        <section className="practice-panel">
                                            <div className="practice-panel-heading">
                                                <div>
                                                    <h3>Database Explorer</h3>
                                                    <p>{tables.length} table(s) available</p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            setTables(
                                                                await getPracticeTables(
                                                                    user.id,
                                                                    activeDataset.slug
                                                                )
                                                            )
                                                        } catch (error) {
                                                            setWorkspaceError(error.message)
                                                        }
                                                    }}
                                                >
                                                    Refresh
                                                </button>
                                            </div>

                                            {tables.length > 0 ? (
                                                <div className="practice-table-list">
                                                    {tables.map((tableName) => (
                                                        <button
                                                            type="button"
                                                            key={tableName}
                                                            onClick={() => {
                                                                setSql(
                                                                    `SELECT * FROM "${tableName.replace(/"/g, '""')}" LIMIT 100;`
                                                                )
                                                                setQueryResult(null)
                                                                setQueryError('')
                                                                setPracticeFeedback('')
                                                                setValidationPassed(null)
                                                            }}
                                                        >
                                                            <span>▤</span>
                                                            {tableName}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="practice-empty">
                                                    No tables found in the current dataset.
                                                </p>
                                            )}
                                        </section>

                                        {activePracticeItem && (
                                            <div className="practice-completion">
                                                <span>
                                                    {progress[activePracticeItem.slug]?.status === 'completed'
                                                        ? 'Practice completed. Progress saved.'
                                                        : isSavingProgress
                                                            ? 'Correct answer. Saving progress...'
                                                            : validationPassed === true
                                                                ? 'Correct answer verified. Progress saving may need attention.'
                                                                : 'Your answer is checked automatically when you run your SQL.'}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default PracticePage
