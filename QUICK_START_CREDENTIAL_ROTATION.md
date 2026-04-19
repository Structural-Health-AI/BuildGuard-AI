# 🚀 Quick Start - Credential Rotation

## Copy-Paste Command Guide

Follow these exact steps with commands you can copy and paste directly.

---

## Step 1: Install Pre-Commit Hook

This prevents accidentally committing secrets in the future.

### Windows:
```bash
setup-pre-commit-hook.bat
```

### Verify installation:
```bash
Test-Path ".\.git\hooks\pre-commit"
# Should return: True
```

---

## Step 2: Generate New JWT SECRET_KEY

### Option A: Using Python
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Option B: Using OpenSSL
```bash
openssl rand -base64 32
```

**Save the output** - you'll need it in the next step.

---

## Step 3: Update backend/.env

### 3a. Open the file
```bash
cd backend
notepad .env
# Or use your favorite editor
```

### 3b. Update SECRET_KEY

Find this line:
```
SECRET_KEY=e9EJMSt9OiwiNE-JgB7hvgrtabxWuvmymohdHn39zUs
```

Replace with:
```
SECRET_KEY=<your-generated-key-from-step-2>
```

### 3c. Update DATABASE_URL

You'll rotate this in Step 4. For now, keep it as-is.

---

## Step 4: Rotate Supabase Password

This step requires manual action in the web interface.

### 4a. Get the new password

1. Go to https://app.supabase.com
2. Click your project
3. Click "Settings" (gear icon)
4. Click "Database" in the left menu
5. Click "Change password"
6. Save the new password securely

### 4b. Update DATABASE_URL in backend/.env

Find this line:
```
DATABASE_URL=postgresql://postgres:Dipendra@159357@db.msoahnrvdwyclxkcbiin.supabase.co:5432/postgres
```

Replace with:
```
DATABASE_URL=postgresql://postgres:[NEW_PASSWORD]@db.msoahnrvdwyclxkcbiin.supabase.co:5432/postgres
```

(Keep the host part `@db.msoahnrvdwyclxkcbiin.supabase.co` the same, only change the password)

### 4c. Save the file

Save and close the editor.

---

## Step 5: Verify Everything Works

### 5a. Test database connection
```bash
cd backend
python test_db.py
```

**Expected output:**
```
✓ Database connection successful
```

### 5b. Test application startup
```bash
cd backend
python main.py
```

**Expected output:**
```
✓ Configuration loaded successfully
ℹ️  Uvicorn running on http://127.0.0.1:8001
```

Press `Ctrl+C` to stop the server.

### 5c. Test frontend configuration (optional)
```bash
cd ../frontend
npm install  # If not already installed
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Step 6: Verify Secrets are Safe

### Check .env is not in git
```bash
git check-ignore backend\.env
# Should return: backend\.env (not in git, good!)
```

### Check git history for secrets
```bash
git log --all -S "PASSWORD" --oneline
# Should show no .env files in recent commits
```

---

## Step 7: Notify Team

Send this message to your team:

```
🔐 Security Update: Credentials Rotated

We've rotated the following credentials:
- ✓ JWT SECRET_KEY
- ✓ Supabase Database Password

New developers should:
1. Get fresh backend/.env and frontend/.env from your team
2. Never commit these files to git
3. See SECRETS_MANAGEMENT_GUIDE.md for setup

All users will be logged out. Please log in again.
```

---

## Troubleshooting

### "Database connection failed"
```bash
# Check your DATABASE_URL in backend/.env
# Make sure:
# 1. Host is correct (should end with .supabase.co)
# 2. Password is URL-encoded (special chars like @ might need %40)
# 3. No spaces or typos
```

### "Configuration loaded but with warnings"
This is normal for development. Just make sure:
```bash
# Run this check
python -c "from core.config import settings; print(f'Environment: {settings.environment}')"
# Should show: Environment: development
```

### "Pre-commit hook not working"
```bash
# Verify hook is executable
Test-Path ".\.git\hooks\pre-commit"
# Should return: True
```

### "Import errors when running Python"
```bash
# Install dependencies
pip install -r requirements.txt

# Or use virtual environment
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## Verification Checklist

Before you're done, verify:

- [ ] Pre-commit hook installed
- [ ] New SECRET_KEY in backend/.env
- [ ] New Supabase password in DATABASE_URL
- [ ] `python test_db.py` succeeds
- [ ] `python main.py` starts without errors
- [ ] Frontend `.env` has correct API_URL
- [ ] `.env` files are in `.gitignore`
- [ ] Old credentials deleted from notes
- [ ] Team notified of rotation

---

## Important Reminders

### ✅ DO:
- Keep backend/.env out of git ✓ (it's in .gitignore)
- Store credentials securely
- Rotate quarterly
- Test after rotation
- Notify team of changes

### ❌ DO NOT:
- Commit .env files
- Hardcode secrets in source code
- Share credentials via email
- Use default placeholder secrets in production

---

## Quick Reference

```bash
# Test database
cd backend && python test_db.py

# Run backend
cd backend && python main.py

# Run frontend
cd frontend && npm run dev

# Check git safety
git check-ignore backend\.env

# Generate new secret
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Need Help?

See these documents:
- **Setup Questions:** SECRETS_MANAGEMENT_GUIDE.md
- **Security Details:** SECURITY_REMEDIATION_PLAN.md
- **Quarterly Rotation:** SECRETS_ROTATION_CHECKLIST.md
- **Overview:** SECURITY_AUDIT_SUMMARY.md

