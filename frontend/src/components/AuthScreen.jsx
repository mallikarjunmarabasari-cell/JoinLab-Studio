import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './AuthScreen.css'

function AuthScreen() {
    const [mode, setMode] = useState('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [feedback, setFeedback] = useState(null)

    const isSignUp = mode === 'signup'

    function switchMode(nextMode) {
        setMode(nextMode)
        setFeedback(null)
        setPassword('')
    }


    async function handleGoogleSignIn() {
        if (isSubmitting) return

        setIsSubmitting(true)
        setFeedback(null)

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            })

            if (error) throw error
        } catch (error) {
            setFeedback({
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Google sign-in failed. Please try again.',
            })

            setIsSubmitting(false)
        }
    }


    async function handleSubmit(event) {
        event.preventDefault()

        if (isSubmitting) return

        setIsSubmitting(true)
        setFeedback(null)

        try {
            const normalizedEmail = email.trim()

            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                    },
                })

                if (error) throw error

                if (data.session) {
                    setFeedback({
                        type: 'success',
                        message: 'Account created. Verifying your session...',
                    })
                } else {
                    setFeedback({
                        type: 'success',
                        message:
                            'Account created. Check your email and confirm your address. Then return here and sign in.',
                    })
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password,
                })

                if (error) throw error

                setFeedback({
                    type: 'success',
                    message: 'Signed in. Verifying your workspace access...',
                })
            }
        } catch (error) {
            setFeedback({
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Authentication failed. Please try again.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="auth-page">
            <div className="auth-container">

                <header className="auth-brand">
                    <div className="auth-brand-mark">JL</div>

                    <div>
                        <h1>SQLDesk</h1>
                        <p>Interactive SQL learning environment</p>
                    </div>
                </header>

                <section className="auth-card">

                    <p className="auth-eyebrow">YOUR DATABASE WORKSPACE</p>

                    <h2>
                        {isSignUp ? 'Create your account' : 'Welcome back'}
                    </h2>

                    <p className="auth-description">
                        {isSignUp
                            ? 'Create an account to access your JoinLab workspace.'
                            : 'Sign in to continue working with your SQL projects.'}
                    </p>

                    <div className="auth-social-actions">
                        <button
                            type="button"
                            className="google-signin-button"
                            onClick={handleGoogleSignIn}
                            disabled={isSubmitting}
                        >
                            <span className="google-mark" aria-hidden="true">
                                G
                            </span>

                            {isSubmitting ? 'Connecting to Google...' : 'Continue with Google'}
                        </button>
                    </div>

                    <div className="auth-divider">
                        <span>OR CONTINUE WITH EMAIL</span>
                    </div>

                    <div className="auth-tabs">
                        <button
                            type="button"
                            className={!isSignUp ? 'auth-tab active' : 'auth-tab'}
                            onClick={() => switchMode('signin')}
                            disabled={isSubmitting}
                        >
                            Sign in
                        </button>

                        <button
                            type="button"
                            className={isSignUp ? 'auth-tab active' : 'auth-tab'}
                            onClick={() => switchMode('signup')}
                            disabled={isSubmitting}
                        >
                            Create account
                        </button>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>

                        <label htmlFor="auth-email">Email address</label>

                        <input
                            id="auth-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />

                        <label htmlFor="auth-password">Password</label>

                        <input
                            id="auth-password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter your password"
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                            required
                        />

                        {feedback && (
                            <p
                                className={`auth-feedback ${feedback.type}`}
                                role={feedback.type === 'error' ? 'alert' : 'status'}
                            >
                                {feedback.message}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="auth-submit-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'Please wait...'
                                : isSignUp
                                    ? 'Create account'
                                    : 'Sign in'}
                        </button>

                    </form>

                    <p className="auth-footer">
                        {isSignUp
                            ? 'Already have an account?'
                            : "Don't have an account?"}

                        <button
                            type="button"
                            onClick={() =>
                                switchMode(isSignUp ? 'signin' : 'signup')
                            }
                            disabled={isSubmitting}
                        >
                            {isSignUp ? 'Sign in' : 'Create account'}
                        </button>
                    </p>

                </section>

                <p className="auth-security-note">
                    Authentication secured by Supabase.
                </p>

            </div>
        </main>
    )
}

export default AuthScreen