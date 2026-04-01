# Authentication & Security Implementation Guide

## Overview

This document outlines the security features implemented in BuildGuard-AI to protect user accounts and sensitive operations.

## Implemented Security Features

### 1. Password Security ✅

**Implementation:**
- Passwords are hashed using **bcrypt** with 12 salt rounds
- Each password hash is unique due to random salt generation
- Hash is never reversible - only verification is possible
- Passwords are never stored in plain text or logs

**Best Practices Enforced:**
- Minimum 12 characters
- Must contain: uppercase, lowercase, number, special character
- Password changed timestamp tracked (`last_password_change_at`)

**Code Location:** `backend/core/security.py` - `PasswordHasher` class

```python
# Example usage
from core.security import PasswordHasher

hashed = PasswordHasher.hash_password("MyP@ssw0rd!")
is_valid = PasswordHasher.verify_password("MyP@ssw0rd!", hashed)
```

### 2. Session Management & Token Expiration ✅

**Implementation:**
- JWT tokens with cryptographically signed payload
- **Access tokens:** 30 minutes (short-lived)
- **Refresh tokens:** 7 days (long-lived)
- **Password reset tokens:** 24 hours (one-time use)
- **Email verification tokens:** 48 hours (one-time use)

**Token Claims:**
- `sub` - Subject (user ID)
- `exp` - Expiration time
- `iat` - Issued at time
- `type` - Token type (prevents token type confusion attacks)

**Code Location:** `backend/core/security.py` - `TokenManager` class

```python
# Token expires after 30 minutes
access_token = TokenManager.create_access_token(data={"sub": user_id})

# Refresh for new token
payload = TokenManager.verify_token(token, token_type="access")
if not payload: # Token expired or invalid
    new_token = TokenManager.create_access_token(data={"sub": user_id})
```

### 3. Email Verification ✅

**Implementation:**
- Users must verify their email before logging in
- Verification tokens are:
  - Unique and cryptographically generated
  - Timestamped with 48-hour expiration
  - Stored in database (one-time use)
  - Hashed when stored (never in plain text)

**Workflow:**
1. User registers with email
2. Verification token emailed (TODO: implement email sending)
3. User clicks verification link or provides token
4. Email marked as verified in database
5. User now can log in

**Endpoints:**
- `POST /api/auth/register` - Register with email
- `POST /api/auth/verify-email` - Verify with token
- `POST /api/auth/resend-verification-email` - Resend verification

**Code Location:** `backend/api/auth_routes.py` - `verify_email()`, `register()`

### 4. Password Reset with Expiring Tokens ✅

**Implementation:**
- Password reset tokens are:
  - One-time use (marked as `used` after reset)
  - Time-limited (24 hours)
  - Cryptographically secure
  - Hashed when stored
  - Can't be reused even if compromised

**Security Features:**
- Old failed attempts don't interfere with new tokens
- Token must be fresh (not expired, not used)
- Password change timestamp updated
- No email leak (both success and failure return same message)

**Endpoints:**
- `POST /api/auth/request-password-reset` - Request reset token
- `POST /api/auth/reset-password` - Reset with valid token

**Code Location:** `backend/api/auth_routes.py` - `request_password_reset()`, `reset_password()`

### 5. Login Rate Limiting ✅

**Implementation:**
- **Failed login attempts:** Max 5 in 15 minutes
- **Login endpoint:** Max 10 requests per minute per IP
- **Password reset requests:** Max 5 per hour per email
- **Registration:** Max 5 per minute per IP

**Tracking:**
- LoginAttempt records track:
  - Email address
  - IP address
  - User agent
  - Success/failure flag
  - Timestamp

**Security Headers:**
- `X-RateLimit-Limit` - Total requests allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - When limit resets

**Code Location:**
- `backend/api/auth_routes.py` - `check_login_attempts()`, decorators
- `backend/models/user_model.py` - `LoginAttempt` model

```python
# Rate limit protection on login endpoint
@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, ...):
    check_login_attempts(email, db)  # Check for too many failures
    # ... login logic
```

### 6. Protected Secrets ✅

**Implementation:**
- All secrets and sensitive config in environment variables (`.env`)
- Never in source code or committed to git
- Using `python-dotenv` for local development
- Using pydantic-settings for type-safe access

**Secrets Protected:**
- `SECRET_KEY` - JWT signing key
- `SMTP_PASSWORD` - Email service password
- `DATABASE_URL` - Database connection string (in production)
- `ALGORITHM` - JWT algorithm

**Access Pattern:**
```python
from core.config import get_settings

settings = get_settings()
secret = settings.secret_key  # Loaded from .env, never in code
```

**Setup:**
1. Copy `.env.example` to `.env`
2. Update values in `.env`
3. **Never commit `.env` to git** (it's in .gitignore)

**Code Location:** `backend/core/config.py`

### 7. Protected Endpoints ✅

**Implementation:**
- All sensitive endpoints require JWT authentication
- Authentication via Bearer token in Authorization header
- Token validated on every protected request
- Failed auth returns 401 with no information leakage
- Dependency injection pattern for clean, reusable authentication

**Protected Endpoints:**
- `GET /api/auth/me` - Get current user info
- `POST /api/sensor/predict` - Sensor analysis
- `GET /api/sensor/history` - Sensor history
- `GET /api/sensor/{id}` - Single sensor prediction
- `DELETE /api/sensor/{id}` - Delete sensor prediction
- `POST /api/image/analyze` - Image analysis
- `GET /api/image/history` - Image history
- `GET /api/image/{id}` - Single image analysis
- `DELETE /api/image/{id}` - Delete image analysis
- `POST /api/reports` - Create report
- `GET /api/reports` - List reports
- `GET /api/reports/{id}` - Get report
- `PUT /api/reports/{id}` - Update report
- `DELETE /api/reports/{id}` - Delete report
- `GET /api/dashboard/stats` - Dashboard statistics

**Making Requests:**
```javascript
// Frontend example
fetch('/api/sensor/predict', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
```

**Code Location:**
- `backend/api/dependencies.py` - `get_current_user()` dependency
- `backend/api/sensor_routes.py` - Protected sensor endpoints
- `backend/api/image_routes.py` - Protected image endpoints
- `backend/api/report_routes.py` - Protected report endpoints
- `backend/main.py` - Protected dashboard endpoint

### 8. CORS Security ✅

**Implementation:**
- Restrictive CORS policy
- Production: Only allows configured origins
- Development: Allows localhost for testing
- Credentials allowed with specific origins only

**Configuration:**
```python
# Production (in .env)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Development (in .env)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ENVIRONMENT=development
```

**Prevented Attacks:**
- XSS from malicious domains
- CSRF (when combined with SameSite cookies)
- Unauthorized cross-origin API access

**Code Location:** `backend/main.py` - CORS middleware setup

### 9. Security Headers ✅

**Implementation:**
- Added to every HTTP response
- Prevents common browser-based attacks

**Headers:**
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Blocks XSS
- `Strict-Transport-Security` - Forces HTTPS
- `Content-Security-Policy` - Limits resource loading
- `Referrer-Policy` - Controls referrer information

**Code Location:** `backend/main.py` - `add_security_headers()` middleware

### 10. Database Models ✅

**User Model (`models/user_model.py`):**
```python
class User(Base):
    - email: String (unique, indexed)
    - hashed_password: String (bcrypt hash)
    - is_email_verified: Boolean
    - is_active: Boolean
    - is_admin: Boolean
    - failed_login_attempts: Integer
    - last_login_at: DateTime
    - last_password_change_at: DateTime
```

**LoginAttempt Tracking:**
```python
class LoginAttempt(Base):
    - email: String
    - ip_address: String
    - success: Boolean
    - user_agent: String
    - created_at: DateTime
```

**Token Tracking (One-time use prevention):**
```python
class PasswordResetToken(Base):
    - user_id: Integer
    - token_hash: String (SHA256 hash)
    - used: Boolean
    - used_at: DateTime

class EmailVerificationToken(Base):
    - user_id: Integer
    - token_hash: String
    - verified: Boolean
    - verified_at: DateTime
```

## Setup & Configuration

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Configure environment:**
   ```env
   SECRET_KEY=your-super-secret-key-min-32-chars
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   DATABASE_URL=sqlite:///./buildguard.db
   ENVIRONMENT=development
   ```

4. **Initialize database:**
   ```bash
   python -c "from database import init_database; init_database()"
   ```

5. **Run server:**
   ```bash
   python main.py
   ```

### Frontend Integration

The frontend should:

1. **Login**
   ```javascript
   const response = await fetch('/api/auth/login', {
     method: 'POST',
     body: JSON.stringify({ email, password })
   })
   const { access_token, refresh_token } = await response.json()
   localStorage.setItem('token', access_token)
   ```

2. **Store tokens securely:**
   - Access token: `localStorage` (expires in 30 min)
   - Refresh token: `httpOnly` cookie (optional, more secure)

3. **Attach token to requests:**
   ```javascript
   const headers = {
     'Authorization': `Bearer ${localStorage.getItem('token')}`
   }
   ```

4. **Handle token expiration:**
   ```javascript
   if (response.status === 401) {
     // Use refresh token to get new access token
     const newToken = await fetch('/api/auth/refresh-token', {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${refreshToken}` }
     })
   }
   ```

## TODO: Email Integration

The following email features need implementation:

1. **`send_verification_email(email, token)`**
   - Called after registration
   - Should include verification link with token

2. **`send_password_reset_email(email, token)`**
   - Called when user requests password reset
   - Should include reset link with token

3. **`send_welcome_email(email)`**
   - Called after email verification
   - Optional: send welcome message

### Recommended Email Services:
- SendGrid (enterprise)
- AWS SES (scalable)
- Gmail SMTP (development)
- Resend (modern, open source friendly)

## Security Checklist

### Development
- [ ] Copy `.env.example` to `.env`
- [ ] Set secure `SECRET_KEY` (min 32 characters)
- [ ] Configure SMTP for email sending
- [ ] Test registration flow
- [ ] Test password reset flow
- [ ] Test login rate limiting

### Production Deployment
- [ ] [ ] Change `SECRET_KEY` to unique, strong value
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS (TLS/SSL)
- [ ] Configure production CORS origins only
- [ ] Set `ENVIRONMENT=production`
- [ ] Use environment-specific `.env` file
- [ ] Enable secrets management (AWS Secrets Manager, HashiCorp Vault)
- [ ] Implement request logging with no sensitive data
- [ ] Set up monitoring for failed login attempts
- [ ] Configure rate limiting appropriately
- [ ] Use managed database with encrypted connections
- [ ] Enable audit logging
- [ ] Test all security features

## Testing

### Test Login Rate Limiting
```bash
# Should fail after 5 attempts
for i in {1..6}; do
  curl -X POST http://localhost:8001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test Token Expiration
```bash
# Token expires after 30 minutes
echo "Token created at: $(date)"
sleep 1800  # Wait 30 minutes
curl -H "Authorization: Bearer $token" http://localhost:8001/api/auth/me
# Should return 401 Unauthorized
```

### Test Email Verification
```bash
# Can't login without verification
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"SecureP@ss123"}'
# Returns 403: Please verify your email
```

## Common Issues

### "Invalid or expired token"
- Token has expired (create new one with refresh token)
- Token type mismatch (trying to use refresh token as access token)
- Secret key changed (tokens become invalid)

### "Too many failed login attempts"
- Wait 15 minutes for the window to reset
- Check IP address (might be different for localhost)
- Verify email exists and password is correct

### Email verification not working
- Email sending not implemented yet (see TODO section)
- Token might be expired (48 hours max)
- Check token hash matches stored hash

## References

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Current Practices](https://tools.ietf.org/html/draft-ietf-oauth-jwt-bcp-07)
- [bcrypt Documentation](https://github.com/pyca/bcrypt)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
