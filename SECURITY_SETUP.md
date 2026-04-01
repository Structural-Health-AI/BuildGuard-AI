# BuildGuard-AI Security Setup Guide

## Quick Start (Development)

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./buildguard.db
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 3: Run Backend

```bash
python main.py
```

Server runs at `http://localhost:8001`

### Step 4: Test Authentication

```bash
# 1. Register
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPass123!",
    "full_name":"Test User"
  }'

# 2. Try login (fails - email not verified yet)
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
# Returns: 403 "Please verify your email"

# 3. TODO: Verify email via token sent to email
#    (Email sending not yet implemented)

# 4. After verification, login works
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
# Returns: { access_token: "...", refresh_token: "..." }
```

---

## What's Now Secure

### ✅ Passwords
- Hashed with bcrypt (12 rounds = ~300ms per hash)
- Minimum 12 characters required
- Must include: uppercase, lowercase, digit, special character
- Never stored in plain text

### ✅ Sessions
- 30-minute access tokens (auto-expire)
- 7-day refresh tokens (for getting new access)
- JWT signatures prevent tampering
- Token type field prevents confusion attacks

### ✅ Email Verification
- Required before login
- 48-hour token expiration
- One-time use (can't reuse token)
- Security best practice: don't reveal if email exists

### ✅ Password Reset
- 24-hour token expiration
- One-time use (can't reuse token)
- Can't reset for non-existent emails (to hide email existence)
- Password change tracked

### ✅ Rate Limiting
- Max 10 login attempts per minute (IP-based)
- Max 5 failed logins in 15 minutes (email-based)
- Max 5 registrations per minute (IP-based)
- Max 5 password resets per hour (email-based)

### ✅ Secrets Protection
- All secrets in `.env` file
- `.env` is git-ignored (never committed)
- `SECRET_KEY` never in source code
- Use environment variables for all credentials

### ✅ Protected Endpoints
- All `/api/sensor/*` endpoints require auth
- All `/api/image/*` endpoints require auth
- All `/api/reports/*` endpoints require auth
- Authentication: `Authorization: Bearer <token>` header

### ✅ CORS Security
- Restrictive by default
- Production: only specified origins
- Development: localhost allowed
- Prevents CSRF and XSS attacks

### ✅ Security Headers
- X-Frame-Options: DENY (prevent clickjacking)
- X-Content-Type-Options: nosniff (prevent MIME sniffing)
- X-XSS-Protection: enabled
- Content-Security-Policy: restrictive
- HSTS: forces HTTPS in production

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns tokens)
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification-email` - Resend verification
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/refresh-token` - Get new access token
- `GET /api/auth/me` - Get current user info (protected)

### Existing Endpoints (Now Protected)
- All `/api/sensor/*` endpoints
- All `/api/image/*` endpoints
- All `/api/reports/*` endpoints

---

## Important: Still TODO

- [ ] **Email Sending** - Choose provider and implement:
  - SendGrid, AWS SES, Gmail SMTP, or Resend
  - Implement `send_verification_email()`
  - Implement `send_password_reset_email()`

- [ ] **Frontend Login** - Create React components:
  - Login form
  - Registration form
  - Password reset form
  - Email verification page
  - Token management (store/refresh)

- [ ] **Production Hardening** - Before deployment:
  - Use PostgreSQL (not SQLite)
  - Configure HTTPS/TLS
  - Set strong `SECRET_KEY`
  - Implement secrets management
  - Set up monitoring
  - Run security audit

---

## Common Issues & Solutions

### "Email already registered"
- Email is in database. Try different email or use password reset.

### "Too many failed login attempts"
- Wait 15 minutes, then try again.

### "Please verify your email before logging in"
- Check email for verification link (not yet implemented).
- Use resend verification email endpoint once implemented.

### "Invalid or expired token"
- Token expires after 30 minutes for access token.
- Use refresh token to get new access token.

### 401 Unauthorized on protected endpoints
- Make sure to include: `Authorization: Bearer <your_token>` header
- Verify token is still valid (hasn't expired)
- Verify email is verified (for first login)

---

## Security Best Practices

1. **Never commit `.env` file** (secrets in .gitignore)
2. **Use strong passwords** (12+ chars, mixed case, numbers, symbols)
3. **Keep `SECRET_KEY` secret** (change in production)
4. **Use HTTPS in production** (not HTTP)
5. **Monitor failed login attempts** (check database)
6. **Rotate `SECRET_KEY` periodically** (invalidates all tokens)
7. **Store tokens securely** (localStorage + httpOnly cookies)
8. **Don't log sensitive data** (passwords, tokens)

---

## Documentation Files

- **`backend/SECURITY.md`** - Detailed security implementation
- **`SECURITY_AUDIT_REPORT.md`** - Complete audit report
- **`.env.example`** - Configuration template
- **`backend/core/config.py`** - Settings configuration
- **`backend/core/security.py`** - Crypto utilities
- **`backend/api/auth_routes.py`** - Authentication endpoints
- **`backend/models/user_model.py`** - Database models

---

## Support

For detailed information on:
- **How authentication works:** See `SECURITY_AUDIT_REPORT.md`
- **Endpoint details:** See `/docs` (Swagger UI) at `http://localhost:8001/docs`
- **Database schema:** See `backend/models/user_model.py`
- **Configuration options:** See `backend/core/config.py`
