# 🔐 BEFORE EVERY GIT COMMIT - Security Checklist

**CRITICAL:** Never commit these to GitHub:

## ❌ DO NOT COMMIT:

- [ ] Database passwords or connection strings (use `.env`)
- [ ] API keys or authentication tokens
- [ ] SSH private keys (`.pem`, `.key`)
- [ ] AWS/Azure/GCP credentials
- [ ] Supabase credentials or API keys
- [ ] Personal email addresses or phone numbers
- [ ] Server IP addresses in config files
- [ ] OAuth tokens or refresh tokens
- [ ] SSL/TLS private keys
- [ ] Any file with "password", "secret", "key", "token" in name
- [ ] Your DigitalOcean SSH password
- [ ] Docker registry credentials
- [ ] Webhook URLs with tokens

## ✅ SAFE TO COMMIT:

- [ ] Deployment scripts (don't hardcode secrets - use env vars)
- [ ] Configuration templates (with placeholder values like `${DATABASE_URL}`)
- [ ] Documentation and guides
- [ ] Public API endpoints
- [ ] Code logic and business logic
- [ ] Open source libraries and dependencies
- [ ] This security checklist itself

## 🔒 Storage Rules:

**Production Credentials:**
- Store in `.env` file (add to `.gitignore` ✓)
- Store in environment variables on server
- Store in secret management service (AWS Secrets Manager, HashiCorp Vault, etc.)
- Store in `.env.production` (NOT in git)

**Development Credentials:**
- Store in `.env.local` (add to `.gitignore` ✓)
- Use dummy/test values for testing
- Never use production credentials locally

**Deployment:**
- SSH directly to server and pull from GitHub
- Use environment variables on the server (not in code)
- Keep `.env` files on the server, NOT in git

## 🚨 If You Accidentally Committed Secrets:

1. **Immediately revoke the exposed credential**
   ```bash
   # For example, rotate your DigitalOcean API token
   ```

2. **Remove from git history**
   ```bash
   # Option 1: Rewrite history (if not yet pushed to GitHub)
   git reset HEAD~1
   git checkout -- .
   
   # Option 2: Use BFG (if already pushed)
   bfg --delete-files credentials.json
   
   # Option 3: Use git filter-branch
   git filter-branch --tree-filter 'rm -f passwords.txt' HEAD
   ```

3. **Force push (only if you're the only one)**
   ```bash
   git push --force-with-lease origin main
   ```

4. **Alert your team** if working with others

## 📋 Current .gitignore Status:

These files/patterns are **protected** (won't be committed):

✅ `.env` files (all variations)
✅ `secrets.json`
✅ `credentials.json`
✅ `*.key`, `*.pem`, `*.p12`, `*.pfx`
✅ `.git-credentials`
✅ `backend/venv/` (Python virtualenv)
✅ `frontend/node_modules/` (npm packages)
✅ `*.sqlite*` (databases)
✅ Model files (`*.pth`, `*.pt`)
✅ `backend/uploads/` (user uploads)
✅ Logs (`*.log`)

## 🔍 Check Before Committing:

```bash
# See what will be committed
git status

# Preview changes
git diff --cached

# Check for common secret patterns
git diff --cached | grep -E "password|secret|token|api_key|Bearer|AWS_"

# Don't commit if you see any of these!
```

## 📝 Better Practice: Template Files

Instead of committing real secrets, create templates:

**`.env.example`** (SAFE to commit):
```
DATABASE_URL=postgresql://user:password@localhost/database
SUPABASE_KEY=your_supabase_key_here
DIGITALOCEAN_TOKEN=your_token_here
```

Copy to `.env` locally and fill in real values:
```bash
cp .env.example .env
# Edit .env with real values
# .env is in .gitignore, won't be committed
```

## 🚀 Deployment with Secrets:

**Right way:**
```bash
# On server
export DATABASE_URL="postgresql://..."
export SUPABASE_KEY="..."
cd /var/www/BuildGuard-AI
git pull origin main
npm install
npm run build
systemctl restart buildguard
```

**Wrong way:**
```bash
# DON'T do this
git add .env
git commit -m "Add production secrets"
git push  # ❌ NEVER PUSH SECRETS!
```

## 🔔 GitHub Secret Scanning:

- GitHub automatically scans for leaked credentials
- If a valid token/key is committed, GitHub will alert you
- The token will still be exposed to anyone with git access

## ✨ Your Current Status:

✅ Deployment scripts are **100% safe** - no hardcoded secrets
✅ `.gitignore` is **comprehensive** - covers .env, keys, creds
✅ Recent commits **do NOT contain** any personal data
✅ You're good to go! 🎉

---

**GOLDEN RULE:**
> If it's a credential, secret, key, password, or personal data → **DON'T COMMIT IT**
> 
> If it's needed for deployment → **store it in .env or environment variables**
> 
> If you need to share templates → **use `.env.example` instead**
