# BuildGuard-AI Authentication System - Testing Guide

**Date**: 2026-04-01
**Status**: Ready for Testing

---

## Quick Start Testing

### 1. Start the Backend

```bash
cd backend
python -m uvicorn main:app --reload
```

Backend runs at: `http://localhost:8001`

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Manual Testing Flows

### Flow 1: User Registration & Email Verification

**Step 1: Register**
1. Go to `http://localhost:5173/register`
2. Fill in:
   - Email: `testuser@example.com`
   - Full Name: `Test User`
   - Password: `SecurePassword123!@#` (must meet all requirements)
   - Confirm Password: `SecurePassword123!@#`
3. Click "Create Account"
4. ✅ Should see success message and redirect to `/verify-email`

**Step 2: Verify Email (Simulate)**

Since SMTP isn't configured, check backend logs for token:
```bash
# Look for: "Email sent to testuser@example.com"
# Copy the verification_token from logs
```

Then verify via API:
```bash
curl -X POST "http://localhost:8001/api/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

Or manually construct verification URL:
```
http://localhost:5173/verify-email?token=eyJhbGciOiJIUzI1NiIs...
```

✅ Should show "Email Verified!" message and redirect to login

---

### Flow 2: User Login

**Step 1: Navigate to Login**
1. Go to `http://localhost:5173/login`
2. Enter:
   - Email: `testuser@example.com`
   - Password: `SecurePassword123!@#`
3. Click "Login"

**Step 2: Verify Success**
- ✅ Should redirect to `/dashboard`
- ✅ User email displayed in sidebar/mobile menu
- ✅ Logout button visible

**Step 3: Check Token Storage**
```javascript
// In browser console
localStorage.getItem('access_token')  // Should have JWT
localStorage.getItem('refresh_token')  // Should have JWT
```

---

### Flow 3: Protected Routes

**Step 1: Test Protected Endpoints**
1. While logged in, navigate to:
   - `/dashboard` ✅ Should load
   - `/sensor-analysis` ✅ Should load
   - `/image-analysis` ✅ Should load
   - `/reports` ✅ Should load

**Step 2: Test Logout**
1. Click "Logout" button
2. ✅ Should redirect to home page
3. ✅ localStorage should be cleared

**Step 3: Try Accessing Protected Route After Logout**
1. Try navigating to `/dashboard`
2. ✅ Should redirect to `/login`

---

### Flow 4: Password Reset

**Step 1: Request Password Reset**
1. Go to `http://localhost:5173/forgot-password`
2. Enter email: `testuser@example.com`
3. Click "Send Reset Link"
4. ✅ Should show "Password reset link sent" message

**Step 2: Simulate Reset Email (No SMTP)**

Check backend logs for password reset token, then navigate to:
```
http://localhost:5173/reset-password?token=eyJhbGciOiJIUzI1NiIs...
```

**Step 3: Reset Password**
1. Enter new password: `NewPassword456!@#`
2. Confirm password: `NewPassword456!@#`
3. Click "Reset Password"
4. ✅ Should show success and redirect to login
5. Login with new password ✅ Should work

---

## API Testing with cURL

### Test 1: Register User

```bash
curl -X POST "http://localhost:8001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "full_name": "API Test User",
    "password": "ApiTestPassword123!@#"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "api-test@example.com",
  "full_name": "API Test User",
  "is_email_verified": false,
  "is_active": true,
  "is_admin": false
}
```

### Test 2: Verify Email (with token from Step 1)

```bash
curl -X POST "http://localhost:8001/api/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Expected Response:**
```json
{
  "message": "Email verified successfully"
}
```

### Test 3: Login

```bash
curl -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "password": "ApiTestPassword123!@#"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 1800
}
```

### Test 4: Access Protected Endpoint

```bash
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X GET "http://localhost:8001/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "api-test@example.com",
  "full_name": "API Test User",
  "is_email_verified": true,
  "is_active": true,
  "is_admin": false
}
```

### Test 5: Refresh Token

```bash
REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST "http://localhost:8001/api/auth/refresh-token" \
  -H "Authorization: Bearer $REFRESH_TOKEN"
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 1800
}
```

### Test 6: Sensor Endpoint (Protected)

```bash
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X GET "http://localhost:8001/api/sensor/history" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**
```json
[]
```

---

## Security Testing

### Test 1: Invalid Token

```bash
curl -X GET "http://localhost:8001/api/auth/me" \
  -H "Authorization: Bearer invalid_token_12345"
```

**Expected**: 401 Unauthorized ✅

### Test 2: Expired Token

```bash
# Manually craft an expired token by modifying a valid one
# (Change expiration time in JWT)

curl -X GET "http://localhost:8001/api/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected**: 401 Unauthorized ✅

### Test 3: Missing Authorization Header

```bash
curl -X GET "http://localhost:8001/api/auth/me"
```

**Expected**: 403 Forbidden ✅

### Test 4: Rate Limiting (Login Attempts)

```bash
# Try logging in with wrong password 5+ times
for i in {1..6}; do
  curl -X POST "http://localhost:8001/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "api-test@example.com",
      "password": "WrongPassword"
    }'
  sleep 1
done
```

**Expected After 5 Attempts**: 429 Too Many Requests ✅

### Test 5: Password Hashing Verification

```javascript
// In Node.js
const bcrypt = require('bcrypt');

// Fetch user from database and get hashed_password
// The hash should NOT match the plain password

const plainPassword = "ApiTestPassword123!@#";
const hashedFromDB = "$2b$12$..."; // from database

bcrypt.compare(plainPassword, hashedFromDB, (err, isMatch) => {
  console.log("Password matches:", isMatch); // Should be true
});
```

**Expected**: ✅ Password should be bcrypt hashed (12 rounds)

### Test 6: Token Not Exposed

```bash
# Register and check response
curl -X POST "http://localhost:8001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "security-test@example.com",
    "full_name": "Security Test",
    "password": "SecurePassword123!@#"
  }'
```

**Expected**:
- ✅ Response should NOT contain `hashed_password`
- ✅ Response should NOT contain `access_token`
- ✅ Response should NOT contain `refresh_token`
- ✅ Only safe fields returned (id, email, full_name, is_active, is_admin)

---

## Frontend Testing Checklist

### Registration Page (`/register`)
- [ ] Email validation (required, valid format)
- [ ] Password strength indicators (all 5 requirements)
- [ ] Confirm password matching
- [ ] Submit button disabled until all requirements met
- [ ] Error messages displayed correctly
- [ ] Success message shows on registration
- [ ] Redirect to `/verify-email` after success

### Login Page (`/login`)
- [ ] Email required validation
- [ ] Password required validation
- [ ] Show/hide password toggle works
- [ ] Error message on invalid credentials
- [ ] Success redirects to `/dashboard`
- [ ] Rate limiting message after 5 attempts

### Verify Email Page (`/verify-email`)
- [ ] Token in URL auto-verifies
- [ ] Manual verification email input works
- [ ] Resend email option available
- [ ] Success redirects to `/login`
- [ ] Invalid token shows error with resend option

### Forgot Password Page (`/forgot-password`)
- [ ] Email required
- [ ] Shows "check your email" message
- [ ] Redirects to login after success

### Reset Password Page (`/reset-password`)
- [ ] Token validation (shows error if missing/invalid)
- [ ] Password strength requirements shown
- [ ] Confirm password matching
- [ ] Success redirects to login
- [ ] Cannot login with old password

### Protected Routes
- [ ] `/dashboard` shows for authenticated users
- [ ] `/sensor-analysis` shows for authenticated users
- [ ] `/image-analysis` shows for authenticated users
- [ ] `/reports` shows for authenticated users
- [ ] Logout button visible in sidebar
- [ ] Logout clears tokens and redirects home
- [ ] Direct URL access redirects to login if not authenticated

---

## Performance Testing

### Test 1: Token Refresh Performance

```bash
time curl -X POST "http://localhost:8001/api/auth/refresh-token" \
  -H "Authorization: Bearer $REFRESH_TOKEN"
```

**Expected**: < 100ms ✅

### Test 2: Login Performance

```bash
time curl -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "password": "ApiTestPassword123!@#"
  }'
```

**Expected**: < 500ms ✅
(Password hashing with bcrypt 12 rounds takes time)

### Test 3: Protected Endpoint Performance

```bash
time curl -X GET "http://localhost:8001/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected**: < 50ms ✅

---

## Database Verification

### Check User Creation

```bash
sqlite3 backend/buildguard.db "SELECT id, email, is_email_verified, is_active FROM users;"
```

**Expected**: User with email and verification status

### Check Login Attempts

```bash
sqlite3 backend/buildguard.db "SELECT email, success, created_at FROM login_attempts LIMIT 10;"
```

**Expected**: All login attempts recorded (success and failures)

### Check Email Verification Tokens

```bash
sqlite3 backend/buildguard.db "SELECT user_id, verified, expires_at FROM email_verification_tokens LIMIT 5;"
```

**Expected**: Tokens with expiration times

### Check Password Reset Tokens

```bash
sqlite3 backend/buildguard.db "SELECT user_id, used, expires_at FROM password_reset_tokens LIMIT 5;"
```

**Expected**: Tokens with used status and expiration

---

## Browser Developer Console Tests

### Test 1: Check Token Storage

```javascript
// Open Developer Tools (F12) and run:
localStorage.getItem('access_token')    // Should exist when logged in
localStorage.getItem('refresh_token')   // Should exist when logged in
localStorage.getItem('access_token')    // Should be null when logged out
```

### Test 2: Check Network Requests

1. Open DevTools → Network tab
2. Login with credentials
3. Look for POST `/api/auth/login` request
4. ✅ Should see `access_token` and `refresh_token` in response
5. ✅ Should NOT see tokens in URL or visible query parameters

### Test 3: Check Security Headers

```javascript
// In DevTools → Network tab
// Click on any request and check Response Headers
// Should see:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Strict-Transport-Security: max-age=31536000
```

---

## Cleanup & Reset

### Reset for Fresh Testing

```bash
# Stop backend and frontend servers

# Delete database
rm backend/buildguard.db

# Restart backend
cd backend
python -m uvicorn main:app --reload

# Restart frontend
cd frontend
npm run dev
```

---

## Common Issues & Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| CORS error on login | Frontend URL not in ALLOWED_ORIGINS | Check `.env` CORS config |
| "Email verification failed" | Token expired or invalid | Generate new token or check expiration |
| "Too many login attempts" | Exceeded 5 failed attempts | Wait 15 minutes or check database |
| Wrong password, then successful login | Cached/wrong credentials | Clear localStorage and retry |
| Tokens not stored | localStorage disabled | Enable in browser settings |
| Email not sending | SMTP not configured | Update `.env` with SMTP credentials |

---

## Test Report Template

```
Date: ____
Tester: ____

Registration Flow:        [ ] PASS [ ] FAIL
Email Verification:      [ ] PASS [ ] FAIL
Login Flow:              [ ] PASS [ ] FAIL
Protected Routes:        [ ] PASS [ ] FAIL
Password Reset:          [ ] PASS [ ] FAIL
Rate Limiting:           [ ] PASS [ ] FAIL
Token Management:        [ ] PASS [ ] FAIL
Security Headers:        [ ] PASS [ ] FAIL
Database Integrity:      [ ] PASS [ ] FAIL

Issues Found:
1. ...
2. ...

Sign-off: __________________
```

---

## Next Steps After Testing

✅ If all tests pass:
1. Configure SMTP for production
2. Run security penetration testing
3. Deploy to staging environment
4. Run load testing
5. Deploy to production

❌ If tests fail:
1. Document the issue
2. Check backend logs: `backend/buildguard.db` queries
3. Check frontend console for errors
4. Review code changes
5. Fix and retest

---

Good luck with testing! 🚀
