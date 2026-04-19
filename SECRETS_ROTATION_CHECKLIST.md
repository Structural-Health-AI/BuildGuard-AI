# 🔄 Secrets Rotation Checklist

Use this checklist when rotating credentials (quarterly recommended, or after suspected compromise).

---

## Pre-Rotation Planning

- [ ] Schedule maintenance window (off-peak hours)
- [ ] Notify team members of upcoming credential rotation
- [ ] Backup current credentials (stored securely)
- [ ] Plan for user re-authentication if needed
- [ ] Prepare rollback plan in case of issues

---

## 1. Database Credentials (Supabase)

**Timeline: 15 minutes**

### Generate New Credentials
- [ ] Log in to [Supabase Dashboard](https://app.supabase.com)
- [ ] Navigate to Project Settings → Database
- [ ] Click "Change password"
- [ ] Generate new password (save in secure location)

### Update Application
- [ ] Update `DATABASE_URL` in `backend/.env`
- [ ] Test database connection: `python backend/test_db.py`
- [ ] Run migrations if needed: `python backend/migrate_db.py`
- [ ] Check application logs for connection errors

### Verify
- [ ] Application starts without database errors
- [ ] Queries execute successfully
- [ ] No stale connection errors

### Cleanup
- [ ] Delete old password from temporary notes
- [ ] Document rotation timestamp in team notes

---

## 2. JWT SECRET_KEY (Authentication)

**Timeline: 30 minutes**

### Generate New Key
```bash
# Generate new secret (save output)
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

- [ ] Copy generated key
- [ ] Update `SECRET_KEY` in `backend/.env`

### Update Application
- [ ] Restart backend service: `python backend/main.py`
- [ ] All existing JWT tokens will be invalid
- [ ] Users will need to re-login

### Verify
- [ ] Application starts successfully
- [ ] Test login flow works
- [ ] New JWT tokens are generated correctly
- [ ] Token validation succeeds

### Communicate
- [ ] Notify users they may be logged out
- [ ] Send communication before rotation if possible
- [ ] Monitor for support requests

### Cleanup
- [ ] Delete old SECRET_KEY from all notes
- [ ] Update team password manager

---

## 3. SMTP Credentials (Email)

**Timeline: 10 minutes** (only if using email features)

### Generate New Credentials
- [ ] Log in to email provider (e.g., Gmail)
- [ ] For Gmail: Generate new App Password
  - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
  - Select "Mail" and your device
  - Copy generated 16-character password

### Update Application
- [ ] Update `SMTP_PASSWORD` in `backend/.env`
- [ ] Delete old app password from Gmail

### Verify
- [ ] Test email sending: trigger password reset flow
- [ ] Check email inbox for test message
- [ ] Verify email content is correct

### Cleanup
- [ ] Delete old password from all notes
- [ ] Update team password manager

---

## 4. Environment-Specific Credentials

### Development Environment
- [ ] Rotate database password
- [ ] Rotate JWT SECRET_KEY
- [ ] Rotate SMTP password (if used)
- [ ] All developers sync new `.env` file

### Staging Environment
- [ ] Repeat all steps in isolated staging environment
- [ ] Test full feature set with new credentials
- [ ] Verify no hardcoded references exist
- [ ] Check deployment automation works

### Production Environment
- [ ] Use Azure Key Vault or GitHub Secrets
- [ ] No local `.env` files should contain production secrets
- [ ] Verify deployment process updates secrets
- [ ] Monitor application for any errors

---

## Post-Rotation Verification

### Application Health
- [ ] Application starts without errors
- [ ] No connection timeouts in logs
- [ ] API endpoints respond correctly
- [ ] Database queries execute successfully
- [ ] Email features work (if applicable)

### Monitoring
- [ ] Check application error logs
- [ ] Monitor database connection pool
- [ ] Review authentication failure rates
- [ ] Check for suspicious access patterns

### User Impact
- [ ] Users can log in successfully
- [ ] No unexpected logouts
- [ ] Session management works correctly
- [ ] No permission issues reported

### Documentation
- [ ] Update rotation timestamp in this file
- [ ] Document any issues encountered
- [ ] Update team documentation if needed
- [ ] Add notes about any special handling required

---

## Rollback Plan

If rotation causes critical issues:

1. **Immediate Rollback** (within 1 minute)
   - [ ] Restore old `backend/.env` file from backup
   - [ ] Restart application
   - [ ] Verify application comes online

2. **Communication**
   - [ ] Notify team of rollback
   - [ ] Investigate root cause
   - [ ] Plan retry with more testing

3. **Investigation**
   - [ ] Check application logs for errors
   - [ ] Verify old credentials are still valid
   - [ ] Identify what caused the issue

4. **Retry**
   - [ ] Fix identified issues
   - [ ] Test changes in development first
   - [ ] Retry rotation with more caution

---

## Rotation History Log

| Date | Credentials Rotated | By | Notes |
|------|-------------------|----|----|
| | [ ] Database [ ] JWT [ ] SMTP | | |
| | [ ] Database [ ] JWT [ ] SMTP | | |
| | [ ] Database [ ] JWT [ ] SMTP | | |
| | [ ] Database [ ] JWT [ ] SMTP | | |

---

## Quarterly Reminder

**Frequency:** Every 3 months (automatic)

Set a calendar reminder for the last Friday of every quarter:
- [ ] January 26, 2024
- [ ] April 26, 2024
- [ ] July 26, 2024
- [ ] October 26, 2024

---

## Security Checklist

Before marking rotation as complete:

- [ ] New credentials are unique (not reused)
- [ ] Old credentials are permanently deleted
- [ ] No old credentials in version control
- [ ] No old credentials in logs or backups
- [ ] All environments updated (dev, staging, prod)
- [ ] Team members notified of changes
- [ ] Documentation updated
- [ ] Application tested in all environments
- [ ] Monitoring confirms normal operation
- [ ] No unauthorized access detected

---

## Related Documents

- [SECRETS_MANAGEMENT_GUIDE.md](SECRETS_MANAGEMENT_GUIDE.md) - Complete setup guide
- [SECURITY_REMEDIATION_PLAN.md](SECURITY_REMEDIATION_PLAN.md) - Initial remediation
- [SECURITY_AUDIT_SUMMARY.md](SECURITY_AUDIT_SUMMARY.md) - Audit findings

---

## Questions or Issues?

1. Check [SECRETS_MANAGEMENT_GUIDE.md](SECRETS_MANAGEMENT_GUIDE.md) for common problems
2. Review application logs for specific error messages
3. Test changes in development environment first
4. Consult with DevOps team before production changes

