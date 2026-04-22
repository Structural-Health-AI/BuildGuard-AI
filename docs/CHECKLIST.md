# Deployment Checklist for BuildGuard AI

## Pre-Deployment Setup

### Local Development Verification
- [ ] Backend starts without errors: `cd backend && python main.py`
- [ ] Frontend starts without errors: `cd frontend && npm run dev`
- [ ] Dashboard displays user-specific data
- [ ] Sensor predictions save and display correctly
- [ ] Image analysis uploads and displays correctly
- [ ] Different users see different data (test with incognito window)

### Database Pre-Check
- [ ] PostgreSQL/Supabase is running
- [ ] Migration `migrate_user_id_to_string.py` already executed
- [ ] `user_id` columns are VARCHAR(255) in: `sensor_predictions`, `image_analyses`

---

## Production Deployment Steps

### 1. **Backend Deployment**

```bash
# SSH into your server
ssh your_user@your_server.com

# Navigate to project
cd /path/to/BuildGuard-AI/backend

# Pull latest code
git pull origin main

# Install any new dependencies
pip install -r requirements.txt

# Run migration if not done yet
python migrate_user_id_to_string.py

# Restart backend service
sudo systemctl restart buildguard-backend

# Or if using Docker:
docker-compose down
docker-compose up -d
```

**Verify Backend Running:**
```bash
curl http://localhost:8006/api/health
# Should return: 200 OK
```

### 2. **Frontend Deployment**

```bash
# Navigate to frontend directory
cd /path/to/BuildGuard-AI/frontend

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build for production
npm run build

# Deploy built files (copy to nginx)
sudo cp -r dist/* /usr/share/nginx/html/

# Or if using Docker:
docker-compose build buildguard-frontend
docker-compose up -d buildguard-frontend
```

**Verify Frontend Accessible:**
```bash
curl https://build-guard.app/
# Should return HTML content
```

### 3. **Nginx Configuration Update**

```bash
# Update nginx config with security headers
sudo cp scripts/deployment/nginx.conf /etc/nginx/nginx.conf

# Test nginx config
sudo nginx -t
# Output should be: "successful"

# Reload nginx
sudo systemctl reload nginx

# Or restart if major changes
sudo systemctl restart nginx
```

### 4. **SSL Certificate Setup** (if first time)

```bash
# Run SSL auto-renewal setup (ONE TIME ONLY)
sudo bash scripts/deployment/setup-ssl-renewal.sh

# Verify timer
sudo systemctl list-timers certbot.timer

# Check certificate status
bash scripts/deployment/check-ssl-expiration.sh build-guard.app
```

### 5. **Database Backup** (Before going live)

```bash
# Backup PostgreSQL
pg_dump -U your_db_user your_db_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Or with Supabase CLI
supabase db pull
```

---

## Testing After Deployment

### User Isolation Tests

1. **Test User 1:**
   - Go to https://build-guard.app
   - Check localStorage for user_id (F12 → Application → Local Storage)
   - Upload an image
   - Add sensor data
   - Verify both appear in dashboard

2. **Test User 2 (Incognito Window):**
   - Open incognito/private window
   - Go to https://build-guard.app
   - Verify different user_id generated (localStorage)
   - Upload different image
   - Add different sensor data
   - **Verify User 1's data is NOT visible**
   - **Verify only User 2's data appears**

3. **Verify Cross-User Access Denied:**
   - Try accessing another user's data via API
   - Example: `GET /api/image/123?user_id=user_other_id`
   - Should return: **403 Forbidden**

### SSL/Security Tests

- [ ] Site loads on HTTPS: https://build-guard.app
- [ ] Certificate shows as valid (no SSL warnings)
- [ ] SSL Labs test shows **A+ rating**: https://www.ssllabs.com/ssltest/analyze.html?d=build-guard.app
- [ ] Security headers present (check in browser DevTools → Network → Response Headers):
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
  
- [ ] SSL badges visible in footer (SSL Labs + HTTPS + TLS 1.3)

### Performance Tests

- [ ] Dashboard loads within 2 seconds
- [ ] Image upload completes without timeout
- [ ] Sensor analysis responds within 1 second
- [ ] No console errors (F12 → Console)
- [ ] No network errors (F12 → Network)

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check backend is running
curl https://build-guard.app/api/dashboard/stats?user_id=test

# Check frontend loads
curl https://build-guard.app | head -20

# Check logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Weekly Tasks

```bash
# Check SSL certificate expiration
bash scripts/deployment/check-ssl-expiration.sh build-guard.app

# Monitor database size
# psql -U user -d dbname -c "SELECT pg_size_pretty(pg_database_size('buildguard_db'));"
```

### Monthly Tasks

- [ ] Test SSL renewal dry-run: `sudo certbot renew --dry-run`
- [ ] Review nginx access logs for suspicious activity
- [ ] Backup database
- [ ] Check for code updates to dependencies

---

## Rollback Plan (If Issues)

### Quick Rollback to Previous Version

```bash
# Show recent commits
git log --oneline -5

# Revert to previous commit
git revert HEAD
git push origin main

# Or hard reset (CAREFUL!)
git reset --hard <commit_hash>
git push --force origin main
```

### Restart Services After Rollback

```bash
# Backend
sudo systemctl restart buildguard-backend

# Frontend
sudo systemctl restart buildguard-frontend

# Nginx
sudo systemctl restart nginx
```

---

## Common Issues & Fixes

### Issue: User data not isolated (seeing other users' data)

**Fix:**
```bash
# Verify user_id parameter is being passed
grep -r "user_id" backend/api/

# Check database schema
psql -U user -d buildguard_db -c "\d sensor_predictions"
# Column 'user_id' should be VARCHAR(255), not INTEGER

# Re-run migration if needed
python backend/migrate_user_id_to_string.py
```

### Issue: SSL certificate expired

**Fix:**
```bash
# Manually renew
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Check status
sudo certbot certificates
```

### Issue: Nginx not loading security headers

**Fix:**
```bash
# Verify nginx config
sudo nginx -t

# Check if headers are in config
grep "add_header" /etc/nginx/nginx.conf

# Reload nginx
sudo systemctl reload nginx

# Verify headers in response
curl -I https://build-guard.app | grep "Strict-Transport"
```

### Issue: Database connection errors

**Fix:**
```bash
# Check database is running
psql -U your_user -h localhost -d buildguard_db -c "SELECT 1"

# Check backend logs
docker logs buildguard-backend  # if using Docker
# or check systemd logs
sudo journalctl -u buildguard-backend -n 50
```

---

## Deployment Summary

**What Changed:**
- ✅ User-based data isolation (per-user dashboards)
- ✅ Persistent user IDs (localStorage)
- ✅ Database schema updated (user_id: Integer → String)
- ✅ SSL security enhanced (HSTS, security headers)
- ✅ SSL auto-renewal scripts added
- ✅ Security.txt compliance added

**Files Affected:**
- Backend: `main.py`, `api/*`, `models/*`
- Frontend: `src/`, `public/.well-known/`
- Deployment: `nginx.conf`, new shell scripts
- Database: Migration required

**Estimated Deployment Time:** 15-30 minutes

---

**Questions?** Check the following docs:
- [SSL_RENEWAL_GUIDE.md](SSL_RENEWAL_GUIDE.md) - Complete SSL management
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - General deployment info
- [README.md](README.md) - Project overview
