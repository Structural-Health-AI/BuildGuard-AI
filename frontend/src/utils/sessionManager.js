/**
 * Session Manager - Generates and manages unique user IDs
 * Each user gets a persistent ID that survives browser sessions
 */

const USER_ID_KEY = 'buildguard_user_id'

/**
 * Generate a unique user ID
 * Format: user_<timestamp>_<random>
 */
function generateUserId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `user_${timestamp}_${random}`
}

/**
 * Get the current user ID
 * Creates a new one if it doesn't exist (first time = new user)
 */
export function getUserId() {
  let userId = localStorage.getItem(USER_ID_KEY)
  
  if (!userId) {
    userId = generateUserId()
    localStorage.setItem(USER_ID_KEY, userId)
  }
  
  return userId
}

/**
 * Reset the user ID (creates a new user/starts fresh)
 */
export function resetUserId() {
  const newUserId = generateUserId()
  localStorage.setItem(USER_ID_KEY, newUserId)
  return newUserId
}

/**
 * Get the current user ID or create new one
 */
export function initializeUser() {
  return getUserId()
}

/**
 * Legacy: getSessionId now returns userId for backward compatibility
 */
export function getSessionId() {
  return getUserId()
}

/**
 * Legacy: resetSessionId now resets userId
 */
export function resetSessionId() {
  return resetUserId()
}
