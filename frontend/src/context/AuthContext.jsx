/**
 * Authentication Context
 * Provides user authentication state and methods throughout the app
 */

import { createContext, useContext, useState, useEffect } from 'react'
import AuthService from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const currentUser = await AuthService.getCurrentUser()
          setUser(currentUser)
        }
      } catch (err) {
        console.error('Failed to load user:', err)
        setError(err.message)
        AuthService.logout()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    setError(null)
    setLoading(true)
    try {
      await AuthService.login(email, password)
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
      return { success: true }
    } catch (err) {
      const message = err.message || 'Login failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (email, fullName, password) => {
    setError(null)
    setLoading(true)
    try {
      await AuthService.register(email, fullName, password)
      return {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
      }
    } catch (err) {
      const message = err.message || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (token) => {
    setError(null)
    setLoading(true)
    try {
      await AuthService.verifyEmail(token)
      return { success: true, message: 'Email verified successfully' }
    } catch (err) {
      const message = err.message || 'Email verification failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationEmail = async (email) => {
    setError(null)
    setLoading(true)
    try {
      await AuthService.resendVerificationEmail(email)
      return { success: true, message: 'Verification email sent' }
    } catch (err) {
      const message = err.message || 'Failed to resend verification email'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const requestPasswordReset = async (email) => {
    setError(null)
    setLoading(true)
    try {
      await AuthService.requestPasswordReset(email)
      return { success: true, message: 'Password reset link sent to your email' }
    } catch (err) {
      const message = err.message || 'Failed to request password reset'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (token, newPassword) => {
    setError(null)
    setLoading(true)
    try {
      await AuthService.resetPassword(token, newPassword)
      return { success: true, message: 'Password reset successfully' }
    } catch (err) {
      const message = err.message || 'Password reset failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
    setError(null)
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
