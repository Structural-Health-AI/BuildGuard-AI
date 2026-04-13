/**
 * Authentication Service
 * Handles API calls for authentication and JWT token management
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

class AuthService {
  /**
   * Register a new user account
   */
  static async register(email, fullName, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        full_name: fullName,
        password,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Registration failed')
    }

    return await response.json()
  }

  /**
   * Login user with email and password
   */
  static async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    const data = await response.json()

    // Store tokens securely
    this.setTokens(data.access_token, data.refresh_token)

    return data
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token) {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Email verification failed')
    }

    return await response.json()
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email) {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to resend verification email')
    }

    return await response.json()
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email) {
    const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to request password reset')
    }

    return await response.json()
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Password reset failed')
    }

    return await response.json()
  }

  /**
   * Get current user information
   */
  static async getCurrentUser() {
    const token = this.getAccessToken()
    if (!token) return null

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token
        await this.refreshToken()
        return this.getCurrentUser()
      }
      return null
    }

    return await response.json()
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken() {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      this.logout()
      throw new Error('No refresh token available')
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
      },
    })

    if (!response.ok) {
      this.logout()
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    this.setTokens(data.access_token, data.refresh_token)

    return data
  }

  /**
   * Logout user and clear tokens
   */
  static logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  /**
   * Store tokens in localStorage
   * SECURITY: In production, use secure HTTP-only cookies instead
   */
  static setTokens(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  /**
   * Get access token from localStorage
   */
  static getAccessToken() {
    return localStorage.getItem('access_token')
  }

  /**
   * Get refresh token from localStorage
   */
  static getRefreshToken() {
    return localStorage.getItem('refresh_token')
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated() {
    return !!this.getAccessToken()
  }

  /**
   * Get authorization header for API requests
   */
  static getAuthHeader() {
    const token = this.getAccessToken()
    if (!token) return {}

    return {
      'Authorization': `Bearer ${token}`,
    }
  }
}

export default AuthService
