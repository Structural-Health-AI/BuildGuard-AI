/**
 * Email Verification Page
 * Verify email with token or resend verification email
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Check, Loader, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const T = {
  white: '#FFFFFF',
  offWhite: '#F8F7F5',
  charcoal: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E5E5',
  terra: '#C2644A',
  terraHover: '#A84E36',
  error: '#DC2626',
  success: '#16A34A',
}

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { verifyEmail, resendVerificationEmail, loading } = useAuth()

  const [status, setStatus] = useState('idle') // idle, verifying, success, error
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [showResendForm, setShowResendForm] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(null)

  const token = searchParams.get('token')

  // Auto-verify if token is in URL
  useEffect(() => {
    if (token) {
      handleVerifyToken(token)
    }
  }, [token])

  const handleVerifyToken = async (verificationToken) => {
    setStatus('verifying')
    setError(null)

    const result = await verifyEmail(verificationToken)

    if (result.success) {
      setStatus('success')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } else {
      setStatus('error')
      setError(result.error || 'Email verification failed')
    }
  }

  const handleResendEmail = async (e) => {
    e.preventDefault()
    setResendLoading(true)
    setError(null)
    setResendSuccess(null)

    const result = await resendVerificationEmail(email)

    setResendLoading(false)

    if (result.success) {
      setResendSuccess(result.message)
      setEmail('')
      setTimeout(() => {
        setShowResendForm(false)
      }, 3000)
    } else {
      setError(result.error || 'Failed to resend verification email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: T.offWhite }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{ background: T.charcoal }}>
            <Mail className="h-6 w-6" style={{ color: T.white }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: T.charcoal }}>
            Verify Your Email
          </h1>
          <p style={{ color: T.textSecondary }}>Complete the final step to access BuildGuardAI</p>
        </div>

        {/* Content Card */}
        <div className="p-6 rounded-lg" style={{ background: T.white, border: `1px solid ${T.border}` }}>
          {/* Idle State */}
          {status === 'idle' && !showResendForm && (
            <div className="text-center space-y-6">
              <div
                className="p-4 rounded-lg"
                style={{ background: 'rgba(194, 100, 74, 0.08)' }}
              >
                <p style={{ color: T.textSecondary }}>
                  We've sent a verification email to your inbox. Click the link in the email to verify your account.
                </p>
              </div>

              <button
                onClick={() => setShowResendForm(true)}
                className="text-sm font-medium transition-colors"
                style={{ color: T.terra }}
                onMouseEnter={(e) => (e.target.style.color = T.terraHover)}
                onMouseLeave={(e) => (e.target.style.color = T.terra)}
              >
                Didn't receive an email? Resend it
              </button>

              <p className="text-xs" style={{ color: T.textSecondary }}>
                or{' '}
                <Link
                  to="/login"
                  className="font-medium transition-colors"
                  style={{ color: T.terra }}
                  onMouseEnter={(e) => (e.target.style.color = T.terraHover)}
                  onMouseLeave={(e) => (e.target.style.color = T.terra)}
                >
                  Go back to login
                </Link>
              </p>
            </div>
          )}

          {/* Verifying State */}
          {status === 'verifying' && (
            <div className="text-center space-y-4">
              <Loader className="h-8 w-8 animate-spin mx-auto" style={{ color: T.terra }} />
              <p style={{ color: T.textSecondary }}>Verifying your email...</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Check className="h-12 w-12 rounded-full p-2.5" style={{ background: 'rgba(22, 163, 74, 0.1)', color: T.success }} />
              </div>
              <div>
                <h2 className="font-semibold mb-1" style={{ color: T.charcoal }}>
                  Email Verified!
                </h2>
                <p style={{ color: T.textSecondary }}>Redirecting to login...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(220, 38, 38, 0.08)' }}>
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: T.error }} />
                <p className="text-sm" style={{ color: T.error }}>
                  {error || 'Verification failed. Your link may have expired.'}
                </p>
              </div>

              <button
                onClick={() => setShowResendForm(true)}
                className="w-full py-2.5 rounded-lg font-medium transition-colors"
                style={{ background: T.terra, color: T.white }}
                onMouseEnter={(e) => (e.target.style.background = T.terraHover)}
                onMouseLeave={(e) => (e.target.style.background = T.terra)}
              >
                Resend Verification Email
              </button>

              <p className="text-sm text-center">
                <Link
                  to="/login"
                  className="font-medium transition-colors"
                  style={{ color: T.terra }}
                  onMouseEnter={(e) => (e.target.style.color = T.terraHover)}
                  onMouseLeave={(e) => (e.target.style.color = T.terra)}
                >
                  Back to login
                </Link>
              </p>
            </div>
          )}

          {/* Resend Form */}
          {showResendForm && (
            <div className="space-y-4">
              <h2 className="font-semibold" style={{ color: T.charcoal }}>
                Resend Verification Email
              </h2>

              {resendSuccess && (
                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(22, 163, 74, 0.08)' }}>
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: T.success }} />
                  <p className="text-sm" style={{ color: T.success }}>
                    {resendSuccess}
                  </p>
                </div>
              )}

              <form onSubmit={handleResendEmail} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: T.charcoal }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                    style={{ borderColor: T.border, background: T.white }}
                    required
                    disabled={resendLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  style={{
                    background: resendLoading ? 'rgba(194, 100, 74, 0.6)' : T.terra,
                    color: T.white,
                  }}
                  onMouseEnter={(e) => !resendLoading && (e.target.style.background = T.terraHover)}
                  onMouseLeave={(e) => !resendLoading && (e.target.style.background = T.terra)}
                >
                  {resendLoading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Verification Email'
                  )}
                </button>
              </form>

              <button
                onClick={() => setShowResendForm(false)}
                className="w-full text-sm font-medium transition-colors"
                style={{ color: T.textSecondary }}
                onMouseEnter={(e) => (e.target.style.color = T.charcoal)}
                onMouseLeave={(e) => (e.target.style.color = T.textSecondary)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
