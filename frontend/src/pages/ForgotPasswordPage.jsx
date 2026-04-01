/**
 * Forgot Password Page
 * Request password reset link
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Loader, Check } from 'lucide-react'
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

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { requestPasswordReset, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [touched, setTouched] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email) {
      setError('Email is required')
      return
    }

    const result = await requestPasswordReset(email)

    if (result.success) {
      setSuccess(result.message)
      setEmail('')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } else {
      setError(result.error || 'Failed to request password reset')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: T.offWhite }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{ background: T.charcoal }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: T.charcoal }}>
            Reset Password
          </h1>
          <p style={{ color: T.textSecondary }}>Enter your email to receive a reset link</p>
        </div>

        {/* Form Card */}
        <div className="p-6 rounded-lg" style={{ background: T.white, border: `1px solid ${T.border}` }}>
          {/* Success Alert */}
          {success && (
            <div
              className="flex items-start gap-3 p-3 rounded-lg mb-6"
              style={{ background: 'rgba(22, 163, 74, 0.08)' }}
            >
              <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: T.success }} />
              <p className="text-sm" style={{ color: T.success }}>
                {success}
              </p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div
              className="flex items-start gap-3 p-3 rounded-lg mb-6"
              style={{ background: 'rgba(220, 38, 38, 0.08)' }}
            >
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: T.error }} />
              <p className="text-sm" style={{ color: T.error }}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.charcoal }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                style={{
                  borderColor: touched && !email ? T.error : T.border,
                  background: T.white,
                }}
                disabled={loading}
              />
              {touched && !email && (
                <p className="text-xs mt-1" style={{ color: T.error }}>
                  Email is required
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors mt-6"
              style={{
                background: loading ? 'rgba(194, 100, 74, 0.6)' : T.terra,
                color: T.white,
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = T.terraHover)}
              onMouseLeave={(e) => !loading && (e.target.style.background = T.terra)}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Links */}
          <p className="text-sm text-center mt-6">
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

        {/* Security Notice */}
        <p className="text-xs text-center mt-6" style={{ color: T.textSecondary }}>
          🔒 Password reset links expire in 24 hours for security
        </p>
      </div>
    </div>
  )
}
