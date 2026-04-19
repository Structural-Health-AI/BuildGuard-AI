# 🚨 EMERGENCY SECURITY REMEDIATION PLAN
**Status:** CRITICAL - Real credentials exposed in public git history  
**Date:** April 19, 2026  
**Action Required:** IMMEDIATE

---

## INCIDENT SUMMARY

### What Happened
During post-cleanup repository audit, discovered real credentials in public git history (origin/main):
- **Supabase Database Password:** `Dipendra@159357`
- **Django/FastAPI SECRET_KEY:** `e9EJMSt9OiwiNE-JgB7hvgrtabxWuvmymohdHn39zUs`
- **Supabase Project ID:** `msoahnrvdwyclxkcbiin`

### Where They Are
- Location: Deleted documentation files in old commits (SECURITY_AUDIT_SUMMARY.md, etc.)
- Visibility: ✅ PUBLICLY VISIBLE on GitHub (origin/main branch)
- Access: Anyone can clone repository and see credentials in history

### Why This Happened
Old documentation files contained hardcoded examples with real credentials instead of placeholders. Files were deleted in recent cleanup, but git history retains them.

---

## IMMEDIATE ACTIONS (Priority Order)

### 🔴 STEP 1: Rotate Supabase Database Password (URGENT - Do First)

**Why:** This is the most critical - someone could have accessed your production database.

**How:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Project: `msoahnrvdwyclxkcbiin`
3. Navigate to: Settings → Database → Password
4. Click "Reset Password"
5. **SAVE** the new password
6. Update connection string in:
   - `backend/.env` (local development)
   - `backend/.env.example` (as example with placeholders)
   - DigitalOcean environment variables
   - Any deployed instances

**Verification:**
```bash
# Test new connection
psql "postgresql://postgres:NEW_PASSWORD@db.msoahnrvdwyclxkcbiin.supabase.co:5432/postgres" -c "SELECT version();"
```

### 🔴 STEP 2: Rotate Django/FastAPI SECRET_KEY (URGENT - Do Second)

**Why:** Session tokens, JWT tokens, and CSRF protection depend on this key. Old tokens could be forged.

**How:**
```bash
# Generate new SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Update in:**
- `backend/.env` (local development)
- `backend/.env.example` (placeholder only, NOT real value)
- DigitalOcean environment variables
- Deployed instances

**Invalidate existing sessions:**
- Optional: Restart application to invalidate old sessions
- Optional: Notify users to re-login if using session-based auth

### 🟡 STEP 3: Remove Credentials from Git History

**Option A: For Local Repository Only (Fastest)**
```bash
# If NOT yet pushed to GitHub, use:
git filter-branch --tree-filter 'rm -f SECURITY_AUDIT_SUMMARY.md SECURITY_REMEDIATION_PLAN.md' -- --all
git reflog expire --expire=now --all
git gc --aggressive --prune=now
```

**Option B: For Public Repository (Required)**
Since credentials are on origin/main (already pushed):
1. Use GitHub's remove-sensitive-data tool:
   ```bash
   git clone https://github.com/Structural-Health-AI/BuildGuard-AI.git --mirror
   bfg --replace-all 'Dipendra@159357' backup.txt BuildGuard-AI.git
   bfg --replace-all 'e9EJMSt9OiwiNE' backup.txt BuildGuard-AI.git
   ```
   
2. Or use BFG Repo-Cleaner (simpler):
   - Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
   - Run: `bfg --replace-all 'Dipendra@159357' my-repo.git`
   
3. Force-push cleaned history to GitHub:
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

**⚠️ WARNING:** Force-pushing will affect all collaborators. They'll need to re-clone.

### 🟡 STEP 4: Verify Credentials Removed from Git

```bash
# Verify credentials no longer in history
git log --all -p | grep -i "Dipendra@159357" | wc -l  # Should return 0
git log --all -p | grep "e9EJMSt9" | wc -l  # Should return 0

# Check if any remaining .bat or .db files tracked
git ls-files | grep -E '\.(bat|db)$'  # Should return nothing
```

---

## FOLLOW-UP ACTIONS (Next 24 Hours)

- [ ] Notify team members about password rotation
- [ ] Update deployment documentation with new credentials
- [ ] Review `.gitignore` to ensure .env files are never tracked
- [ ] Set up git hooks to prevent future credential commits
- [ ] Enable branch protection on GitHub (require reviews before merge)
- [ ] Add Git Secret Scanner to CI/CD pipeline
- [ ] Review GitHub access logs for unauthorized clones

---

## REMEDIATION VERIFICATION CHECKLIST

- [ ] Supabase password rotated
- [ ] SECRET_KEY rotated
- [ ] New credentials deployed to DigitalOcean
- [ ] Old credentials removed from git history (force-pushed)
- [ ] All team members notified
- [ ] Local repositories updated with cleaned history
- [ ] Credentials verified not in git log anymore
- [ ] Pre-commit hooks installed to prevent future leaks

---

## PREVENTION FOR FUTURE

### 1. Use .env.example with PLACEHOLDERS ONLY
```bash
# ❌ WRONG - Real values
DATABASE_URL=postgresql://postgres:Dipendra@159357@db.msoahnrvdwyclxkcbiin.supabase.co:5432/postgres

# ✅ CORRECT - Placeholders
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
```

### 2. Install Git Hooks
See `/scripts/pre-commit-hook.sh` for automated secret scanning.

### 3. Use GitHub Secret Scanning
- Enable in repository settings: https://github.com/Structural-Health-AI/BuildGuard-AI/settings/security_analysis
- Configure "push protection" to block commits with detected secrets

### 4. Use Secrets Management Tools
- **DigitalOcean App Platform:** Environment variables (built-in)
- **Alternative:** Doppler (https://www.doppler.com/) for secret rotation

---

## RELATED DOCUMENTATION

See:
- `/scripts/` - Security hardening and verification scripts
- `/docs/SECURITY.md` - Security best practices
- `/docs/DEPLOYMENT.md` - Safe deployment procedures

---

## REFERENCE

**Previously Exposed Credentials (ROTATE/REMOVE):**
- Supabase Password: `Dipendra@159357` ← Supabase must rotate this
- SECRET_KEY: `e9EJMSt9OiwiNE-JgB7hvgrtabxWuvmymohdHn39zUs` ← Must generate new
- Database URL: `postgresql://postgres:Dipendra@159357@db.msoahnrvdwyclxkcbiin.supabase.co:5432/postgres`
- Project ID: `msoahnrvdwyclxkcbiin`

**Files Containing Credentials (in git history):**
- SECURITY_AUDIT_SUMMARY.md (deleted)
- SECURITY_REMEDIATION_PLAN.md (deleted)
- SECRETS_MANAGEMENT_GUIDE.md (deleted)

---

**Created:** April 19, 2026  
**Severity:** CRITICAL  
**Timeline:** Immediate action required within 1 hour
