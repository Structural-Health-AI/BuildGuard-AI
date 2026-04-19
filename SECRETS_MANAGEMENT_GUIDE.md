# 🔐 BuildGuard-AI Security Setup Guide

## Environment Configuration & Secrets Management

This guide explains how to safely configure your local development environment and manage secrets.

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
   - Use secure credential management for production

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

### Step 2: Fill in Your Secrets

Edit `backend/.env` and replace all placeholder values:

#### Option A: Local SQLite Development
```env
# Use SQLite for quick local testing
DATABASE_URL=sqlite:///./buildguard.db
SECRET_KEY=your-development-secret-key-32-chars-minimum
ALGORITHM=HS256
# ... other settings
```

#### Option B: Supabase PostgreSQL

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
# ... other settings
```

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Or using OpenSSL:
```bash
openssl rand -base64 32
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
5. Paste in `SMTP_PASSWORD`

### Step 4: Create Frontend Environment File

```bash
cd frontend
cp .env.example .env
```

Keep frontend `.env` minimal (no secrets):
```env
VITE_API_URL=http://localhost:8001/api
VITE_ENV=development
```

---

## Production Secrets Management

### Azure Key Vault (Recommended for Azure deployments)

```python
# backend/core/config.py
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

class AzureSecrets:
    def __init__(self):
        credential = DefaultAzureCredential()
        self.client = SecretClient(
            vault_url="https://your-vault.vault.azure.net/",
            credential=credential
        )
    
    def get_secret(self, name: str) -> str:
        return self.client.get_secret(name).value
```

### GitHub Secrets (For CI/CD)

Store secrets for GitHub Actions:
```bash
gh secret set SECRET_KEY --body "your-secret-key"
gh secret set DATABASE_URL --body "postgresql://..."
```

Use in workflows:
```yaml
env:
  SECRET_KEY: ${{ secrets.SECRET_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Docker Secrets (For Container Deployments)

```bash
# Create secrets
echo "your-secret-key" | docker secret create jwt_secret -
echo "postgresql://..." | docker secret create database_url -

# Use in docker-compose.yml
services:
  backend:
    secrets:
      - jwt_secret
      - database_url
```

---

## Verifying Configuration

### 1. Test Backend Startup

```bash
cd backend
python main.py
```

You should see:
```
ℹ️  Uvicorn running on http://127.0.0.1:8001
```

### 2. Validate Environment Variables

```bash
cd backend
python -c "from core.config import settings; print(settings)"
```

### 3. Test Database Connection

```bash
cd backend
python test_db.py
```

### 4. Test Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Rotating Secrets

### When to Rotate:
- After exposure or suspected breach
- Regularly (quarterly recommended)
- After staff changes or access revocation
- Before deploying to production

### How to Rotate:

1. **Database Password (Supabase)**
   ```
   - Log in to Supabase Dashboard
   - Project Settings → Database → Change Password
   - Update DATABASE_URL in .env
   - Test connection
   ```

2. **JWT SECRET_KEY**
   ```
   - Generate new key: openssl rand -base64 32
   - Update SECRET_KEY in .env
   - Current users will need to re-login
   - Consider graceful token migration
   ```

3. **SMTP Password (Gmail)**
   ```
   - Go to myaccount.google.com/apppasswords
   - Delete old password
   - Generate new one
   - Update SMTP_PASSWORD in .env
   ```

---

## Troubleshooting

### "No such file or directory: '.env'"
```bash
cd backend
cp .env.example .env
# Fill in your values
```

### "Database connection failed"
- Check `DATABASE_URL` format is correct
- Verify database server is running
- For Supabase, ensure IP isn't restricted

### "Authentication failed - Invalid token"
- Check `SECRET_KEY` matches between frontend/backend
- Verify `ALGORITHM` is consistent
- Clear browser localStorage and re-login

### "SMTP connection refused"
- Enable "Less secure app access" (Gmail)
- Use App Password instead of regular password
- Check `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USER`

---

## Security Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] No hardcoded secrets in source code
- [ ] Environment validation works at startup
- [ ] Database connection is tested
- [ ] Email configuration (if needed) is working
- [ ] Frontend API URL is correct
- [ ] Production uses Azure Key Vault or similar
- [ ] Secrets are rotated regularly
- [ ] Access logs are monitored
- [ ] Backup encryption is enabled

---

## Quick Reference Commands

```bash
# Generate a secure secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Check if .env is gitignored
git check-ignore backend/.env

# Test database connection
cd backend && python test_db.py

# Run backend development server
cd backend && python main.py

# Run frontend development server
cd frontend && npm run dev

# Check environment variables
python -c "import os; print(os.environ.get('SECRET_KEY'))"
```

---

## Additional Resources

- [12 Factor App - Config](https://12factor.net/config)
- [OWASP - Secrets Management](https://owasp.org/www-community/Secrets_Management)
- [Supabase Docs](https://supabase.com/docs)
- [Azure Key Vault](https://docs.microsoft.com/en-us/azure/key-vault/)
- [GitHub Secrets](https://docs.github.com/en/actions/reference/encrypted-secrets)

