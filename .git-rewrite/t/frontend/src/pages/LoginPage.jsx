/**
 * Login Page Component
 * Secure user authentication with rate limiting
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Loader, Eye, EyeOff } from 'lucide-react'
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

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({})

  // Password validation
  const validatePassword = (password) => {
    return password.length >= 8
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters')
      return
    }

    // Login
    const result = await login(formData.email, formData.password)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: T.offWhite }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{ background: T.charcoal }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: T.charcoal }}>
            BuildGuard<span style={{ color: T.terra }}>AI</span>
          </h1>
          <p style={{ color: T.textSecondary }}>Structural Health Monitoring System</p>
        </div>

        {/* Form Card */}
        <div className="p-6 rounded-lg" style={{ background: T.white, border: `1px solid ${T.border}` }}>
          <h2 className="text-lg font-semibold mb-6" style={{ color: T.charcoal }}>
            Welcome Back
          </h2>

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
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                style={{
                  borderColor: touched.email && !formData.email ? T.error : T.border,
                  background: T.white,
                }}
                disabled={loading}
              />
              {touched.email && !formData.email && (
                <p className="text-xs mt-1" style={{ color: T.error }}>
                  Email is required
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.charcoal }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border transition-colors"
                  style={{
                    borderColor: touched.password && !validatePassword(formData.password) ? T.error : T.border,
                    background: T.white,
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: T.textSecondary }}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {touched.password && !validatePassword(formData.password) && (
                <p className="text-xs mt-1" style={{ color: T.error }}>
                  Password must be at least 8 characters
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
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-3 text-sm text-center">
            <p>
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium transition-colors"
                style={{ color: T.terra }}
                onMouseEnter={(e) => (e.target.style.color = T.terraHover)}
                onMouseLeave={(e) => (e.target.style.color = T.terra)}
              >
                Sign up
              </Link>
            </p>
            <p>
              <Link
                to="/forgot-password"
                className="transition-colors"
                style={{ color: T.textSecondary }}
                onMouseEnter={(e) => (e.target.style.color = T.charcoal)}
                onMouseLeave={(e) => (e.target.style.color = T.textSecondary)}
              >
                Forgot password?
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-xs text-center mt-6" style={{ color: T.textSecondary }}>
          🔒 Your password is securely encrypted with bcrypt + TLS
        </p>
      </div>
    </div>
  )
}
