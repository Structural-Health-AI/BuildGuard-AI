/**
 * Session Manager - Generates and manages unique user session IDs
 * Stores session ID in localStorage to persist across browser sessions
 */

const SESSION_ID_KEY = 'buildguard_session_id'

/**
 * Generate a unique session ID
 * Format: buildguard_<timestamp>_<random>
 */
function generateSessionId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `buildguard_${timestamp}_${random}`
}

/**
 * Get the current session ID
 * Creates a new one if it doesn't exist
 */
export function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_ID_KEY)
  
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  
  return sessionId
}

/**
 * Reset the session ID (useful for "new user" functionality)
 */
export function resetSessionId() {
  const newSessionId = generateSessionId()
  localStorage.setItem(SESSION_ID_KEY, newSessionId)
  return newSessionId
}

/**
 * Get the current session ID or create new one
 */
export function initializeSession() {
  return getSessionId()
}
