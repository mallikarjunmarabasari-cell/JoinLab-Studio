import './SqlPlayground.css'

function AppLayout({
  user,
  onSignOut,
  isSigningOut,
  signOutError,
  activePage,
  onNavigate,
  children,
}) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">JL</div>

          <div>
            <h1>JoinLab Studio</h1>
            <p>SQL learning environment</p>
          </div>
        </div>

        <div className="topbar-right">
          <div className="connection-status">
            <span className="status-dot"></span>
            PostgreSQL · In-browser sandbox
          </div>

          <div className="account-controls">
            <div className="account-identity">
              <span className="account-label">SIGNED IN AS</span>
              <span className="account-email" title={user?.email || ''}>
                {user?.email || 'Authenticated user'}
              </span>
            </div>

            <button
              type="button"
              className="sign-out-button"
              onClick={onSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>

        {signOutError && (
          <p className="sign-out-error" role="alert">
            Sign-out failed: {signOutError}
          </p>
        )}
      </header>

      <div className="workspace-layout">
        <aside className="sidebar">
          <p className="sidebar-heading">WORKSPACE</p>

          <nav aria-label="Workspace navigation">
            <button
              type="button"
              className={`sidebar-item ${activePage === 'playground' ? 'active' : ''}`}
              onClick={() => onNavigate('playground')}
              aria-current={activePage === 'playground' ? 'page' : undefined}
            >
              SQL Playground
            </button>

            <div className="sidebar-item">
              PostgreSQL Lab
              <span className="sidebar-tag">SOON</span>
            </div>

            <div className="sidebar-item">Saved Projects</div>
          </nav>

          <div className="sidebar-divider"></div>

          <p className="sidebar-heading">LEARNING</p>

          <nav aria-label="Learning navigation">
            <button
              type="button"
              className={`sidebar-item ${activePage === 'practice' ? 'active' : ''}`}
              onClick={() => onNavigate('practice')}
              aria-current={activePage === 'practice' ? 'page' : undefined}
            >
              Practice
            </button>

            <div className="sidebar-item">
              Progress
              <span className="sidebar-tag">SOON</span>
            </div>
          </nav>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppLayout