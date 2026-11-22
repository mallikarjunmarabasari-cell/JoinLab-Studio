import { useEffect, useState } from 'react'

import SqlWorkspace from './components/SqlWorkspace.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import { supabase } from './lib/supabase'

import './App.css'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

function App() {
  const [session, setSession] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

  const [verification, setVerification] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [signOutError, setSignOutError] = useState('')

  const [isSigningOut, setIsSigningOut] = useState(false)

  const accessToken = session?.access_token
  const sessionUserId = session?.user?.id

  // Listen for session restoration, sign-in, sign-out and token refresh.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsAuthReady(true)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Verify the Supabase access token independently through FastAPI.
  useEffect(() => {
    if (!isAuthReady || !accessToken) return

    let active = true
    const controller = new AbortController()

    const requestKey = `${accessToken}:${retryCount}`

    async function verifyBackendSession() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/me`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          }
        )

        const data = await response.json().catch(() => null)

        if (response.status === 401) {
          throw new Error(
            'The backend rejected this access token. Try signing in again.'
          )
        }

        if (response.status === 503) {
          throw new Error(
            'The authentication service is temporarily unavailable.'
          )
        }

        if (!response.ok) {
          throw new Error(
            data?.detail || `Backend verification failed (${response.status}).`
          )
        }

        if (
          typeof data?.id !== 'string' ||
          data.id !== sessionUserId
        ) {
          throw new Error(
            'The authenticated user returned by the backend does not match the current session.'
          )
        }

        if (active) {
          setVerification({
            requestKey,
            status: 'verified',
            user: data,
          })
        }
      } catch (error) {
        if (error.name === 'AbortError') return

        const message =
          error instanceof TypeError
            ? `Cannot connect to the JoinLab API at ${API_BASE_URL}. Make sure the FastAPI server is running.`
            : error instanceof Error
              ? error.message
              : 'Unable to verify your account.'

        if (active) {
          setVerification({
            requestKey,
            status: 'error',
            message,
          })
        }
      }
    }

    verifyBackendSession()

    return () => {
      active = false
      controller.abort()
    }
  }, [isAuthReady, accessToken, sessionUserId, retryCount])

  async function handleSignOut() {
    setSignOutError('')
    setIsSigningOut(true)

    try {
      const { error } = await supabase.auth.signOut({
        scope: 'local', //The sign-out uses scope: 'local', meaning it terminates the current browser session rather than every session belonging to the account.
      })

      if (error) {
        setSignOutError(error.message)
      }
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : 'Unable to sign out.'
      )
    } finally {
      setIsSigningOut(false)
    }
  }

  const requestKey = accessToken
    ? `${accessToken}:${retryCount}`
    : null

  const currentVerification =
    verification?.requestKey === requestKey
      ? verification
      : null

  // Supabase is still restoring the persisted session.
  if (!isAuthReady) {
    return (
      <main className="app-state-page">
        <section className="app-state-card">
          <div className="app-state-spinner" />
          <h1>JoinLab Studio</h1>
          <p>Restoring your session...</p>
        </section>
      </main>
    )
  }

  // No authenticated session.
  if (!session) {
    return <AuthScreen />
  }

  // Backend rejected the session or could not be reached.
  if (currentVerification?.status === 'error') {
    return (
      <main className="app-state-page">
        <section className="app-state-card">
          <span className="app-state-kicker">
            ACCOUNT VERIFICATION FAILED
          </span>

          <h1>Unable to open workspace</h1>

          <p className="app-state-message">
            {currentVerification.message}
          </p>

          {signOutError && (
            <p className="app-state-error" role="alert">
              Sign-out failed: {signOutError}
            </p>
          )}

          <div className="app-state-actions">
            <button
              type="button"
              className="app-state-primary"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Retry verification
            </button>

            <button
              type="button"
              className="app-state-secondary"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        </section>
      </main>
    )
  }

  // A session exists, but FastAPI has not verified it yet.
  if (currentVerification?.status !== 'verified') {
    return (
      <main className="app-state-page">
        <section className="app-state-card">
          <div className="app-state-spinner" />
          <h1>Verifying your account</h1>
          <p>Connecting your authenticated session to JoinLab API...</p>
        </section>
      </main>
    )
  }

  return (
    <SqlWorkspace
      user={currentVerification.user}
      onSignOut={handleSignOut}
      isSigningOut={isSigningOut}
      signOutError={signOutError}
    />
  )
}

export default App