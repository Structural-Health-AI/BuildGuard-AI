# BuildGuard-AI Security Guide

## Overview

This guide covers secrets management, security best practices, and credential rotation procedures for BuildGuard-AI.

---

## ⚠️ Critical Security Rules

1. **NEVER commit `.env` files to Git**
   - The `.env` file in this project is protected by `.gitignore`
   - Always work with local copies only

2. **NEVER hardcode secrets in source code**
   - Use environment variables from `.env` file
   - Load them in `core/config.py` using Pydantic settings

3. **NEVER share credentials**
   - Keep local `.env` files private
   - Use secure credential management for production (e.g., DigitalOcean Secrets, Doppler)

4. **ALWAYS rotate secrets after exposure**
   - Change passwords immediately if leaked
   - Update all dependent systems

---

## Local Development Setup

### Step 1: Create Backend Environment File

```bash
cd backend
cp .env.example .env
```

### Step 2: Configure Supabase PostgreSQL

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings → Database → Connection String
4. Copy the PostgreSQL connection string
5. Generate a new password from Supabase dashboard
6. Update `backend/.env`:

```env
# From Supabase Dashboard
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Generate a new SECRET_KEY
SECRET_KEY=<generate-new-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 3: Email Configuration (Optional)

For testing password reset and email verification:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<your-gmail-app-password>
SENDER_EMAIL=your-email@gmail.com
SENDER_NAME=BuildGuard-AI
```

**Get Gmail App Password:**
1. Enable 2-Factor Authentication on your Google Account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows Computer"
4. Copy the generated 16-character password

### Step 4: Create Frontend Environment File

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=BuildGuard-AI
```

---

## Security Features Implemented

### Pre-Commit Hooks
- Prevents accidentally committing `.env` files
- Blocks commits with hardcoded secrets
- Installation: `./pre-commit-hook.sh`

### Environment Templates
- `backend/.env.example` - Safe template with placeholders
- `frontend/.env.example` - Frontend configuration template

### Startup Validation
- `backend/core/config.py` includes security checks
- Warns about default secrets in development
- Prevents production deployment with default credentials

---

## Credential Rotation Checklist

**Timeline:** Plan 1 hour for full rotation. Recommended quarterly or after suspected compromise.

### Pre-Rotation Planning
- [ ] Schedule maintenance window (off-peak hours)
- [ ] Notify team members of upcoming credential rotation
- [ ] Backup current credentials (stored securely)
- [ ] Prepare rollback plan in case of issues

### 1. Database Credentials (Supabase) — 15 minutes

**Generate New Credentials:**
- [ ] Log in to [Supabase Dashboard](https://app.supabase.com)
- [ ] Navigate to Project Settings → Database
- [ ] Click "Change password"
- [ ] Generate new password (save in secure location)

**Update Application:**
- [ ] Update `DATABASE_URL` in `backend/.env`
- [ ] Test: `cd backend && python test_db.py`
- [ ] Run migrations if needed: `python migrate_db.py`

**Verify:**
- [ ] Application starts without database errors
- [ ] Queries execute successfully
- [ ] No stale connection errors

### 2. JWT SECRET_KEY (Authentication) — 30 minutes

**Generate New Key:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Update Application:**
- [ ] Copy generated key
- [ ] Update `SECRET_KEY` in `backend/.env`
- [ ] Restart backend service
- [ ] All existing JWT tokens become invalid
- [ ] Users will need to re-login

**Verify:**
- [ ] Application starts successfully
- [ ] Login flow works
- [ ] New JWT tokens generate correctly
- [ ] Token validation succeeds

**Communicate:**
- [ ] Notify users they may be logged out (if production)
- [ ] Send advance notification if possible
- [ ] Monitor for support requests

### 3. SMTP Credentials (Email) — 10 minutes

(Only needed if using email features)

**Generate New Credentials:**
- [ ] For Gmail: Generate new App Password
  - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
  - Select "Mail" and your device
  - Copy generated 16-character password

**Update Application:**
- [ ] Update `SMTP_PASSWORD` in `backend/.env`
- [ ] Delete old app password from Gmail

**Verify:**
- [ ] Test email sending: trigger password reset
- [ ] Check email inbox for test message
- [ ] Verify email content is correct

---

## Production Secrets Management (DigitalOcean/Doppler)

For production deployments, use a dedicated secrets management service instead of `.env` files:

### Option 1: DigitalOcean App Platform Secrets
```bash
# Managed via DigitalOcean Dashboard
# Secrets are encrypted at rest and in transit
# No need to manage .env files on the server
```

### Option 2: Doppler (Recommended)
```bash
# Install Doppler CLI
curl -Ls https://cli.doppler.com/install.sh | sh

# Authenticate
doppler login

# Run application with secrets
doppler run -- python main.py
```

Benefits:
- Centralized secrets management
- Team access control
- Audit logs for all access
- Environment-specific configurations
- Automatic rotation support

---

## Audit Findings

A security audit identified exposed credentials in the local development environment:
- Supabase Database Password
- JWT SECRET_KEY

**Status:** These were only in local `.env` (gitignored), not in Git history.

**Action:** Rotate credentials immediately using the checklist above.

---

## Security Hardening

Run the security hardening script:
```bash
./security-hardening.sh
```

Verify security measures:
```bash
./verify-security.sh
```

---

## Support & Questions

For security questions or to report vulnerabilities:
1. Check [SECURITY.md](../backend/SECURITY.md) for backend-specific details
2. Contact the security team with details
3. Do NOT report security issues publicly

---

**Last Updated:** 2026-04-19
