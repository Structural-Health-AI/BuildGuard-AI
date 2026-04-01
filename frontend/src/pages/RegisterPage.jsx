/**
 * Registration Page Component
 * Create new user account with email verification
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Loader, Check, X, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const T = {
  white: '#FFFFFF',
  offWhite: '#F8F7F5',
  charcoal: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E5E5',
  terra: '#C2644A',
  terraHover: '#A84E36',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#EA8C55',
}

const PASSWORD_REQUIREMENTS = {
  length: { test: (p) => p.length >= 12, label: '12+ characters' },
  uppercase: { test: (p) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  lowercase: { test: (p) => /[a-z]/.test(p), label: 'Lowercase letter' },
  number: { test: (p) => /\d/.test(p), label: 'Number' },
  special: { test: (p) => /[!@#$%^&*]/.test(p), label: 'Special character (!@#$%^&*)' },
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, loading } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [touched, setTouched] = useState({})

  // Password validation
  const validatePassword = (password) => {
    return Object.values(PASSWORD_REQUIREMENTS).every((req) => req.test(password))
  }

  const getPasswordRequirements = () => {
    return Object.entries(PASSWORD_REQUIREMENTS).map(([key, req]) => ({
      key,
      label: req.label,
      met: req.test(formData.password),
    }))
  }

  const requirements = getPasswordRequirements()
  const passwordsMatch = formData.password === formData.confirmPassword

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
    setSuccess(null)

    // Validation
    if (!formData.email || !formData.fullName || !formData.password || !formData.confirmPassword) {
      setError('All fields are required')
      return
    }

    if (!validatePassword(formData.password)) {
      setError('Password does not meet all requirements')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    // Register
    const result = await register(formData.email, formData.fullName, formData.password)

    if (result.success) {
      setSuccess(result.message)
      setFormData({ email: '', fullName: '', password: '', confirmPassword: '' })
      setTimeout(() => {
        navigate('/verify-email', { state: { email: formData.email } })
      }, 2000)
    } else {
      setError(result.error || 'Registration failed')
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
          <p style={{ color: T.textSecondary }}>Create Your Account</p>
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
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                style={{ borderColor: T.border, background: T.white }}
                disabled={loading}
              />
            </div>

            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.charcoal }}>
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                style={{ borderColor: T.border, background: T.white }}
                disabled={loading}
              />
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
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border transition-colors"
                  style={{
                    borderColor: formData.password && !validatePassword(formData.password) ? T.error : T.border,
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

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-3 space-y-1">
                  {requirements.map((req) => (
                    <div key={req.key} className="flex items-center gap-2 text-xs" style={{ color: req.met ? T.success : T.textMuted }}>
                      {req.met ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.charcoal }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border transition-colors"
                  style={{
                    borderColor: formData.confirmPassword && !passwordsMatch ? T.error : T.border,
                    background: T.white,
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: T.textSecondary }}
                  tabIndex="-1"
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs mt-1" style={{ color: T.error }}>
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !validatePassword(formData.password) || !passwordsMatch}
              className="w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors mt-6"
              style={{
                background: loading ? 'rgba(194, 100, 74, 0.6)' : T.terra,
                color: T.white,
                opacity: loading || !validatePassword(formData.password) || !passwordsMatch ? 0.6 : 1,
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = T.terraHover)}
              onMouseLeave={(e) => !loading && (e.target.style.background = T.terra)}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Links */}
          <p className="text-sm text-center mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium transition-colors"
              style={{ color: T.terra }}
              onMouseEnter={(e) => (e.target.style.color = T.terraHover)}
              onMouseLeave={(e) => (e.target.style.color = T.terra)}
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Security Notice */}
        <p className="text-xs text-center mt-6" style={{ color: T.textSecondary }}>
          🔒 Passwords are encrypted end-to-end and never stored in plain text
        </p>
      </div>
    </div>
  )
}
