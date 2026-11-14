import './SqlWorkspace.css'
function SqlWorkspace() {
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
          PostgreSQL sandbox · Setup pending
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
              <p>Explore datasets, write queries and inspect results.</p>
            </div>
          </section>

          <section className="workbench">
            {/* Database explorer */}
            <section className="panel schema-panel">
              <div className="panel-heading">
                <h3>Database Explorer</h3>
              </div>

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

              <textarea
                className="sql-editor"
                aria-label="SQL query editor"
                spellCheck={false}
                defaultValue={`SELECT *
FROM employees
LIMIT 10;`}
              />

              <div className="editor-toolbar">
                <span>Execution engine not connected yet</span>
                <button type="button" disabled>
                  Run Query
                </button>
              </div>
            </section>

            {/* Query results */}
            <section className="panel results-panel">
              <div className="panel-heading">
                <h3>Query Results</h3>
              </div>

              <p className="empty-state">
                Your query results will appear here.
              </p>
            </section>
          </section>
        </main>
      </div>
    </div>
  )
}

export default SqlWorkspace