# Quick Deployment Guide - DigitalOcean + Supabase

**Your Setup:**
- Server IP: `167.71.228.217`
- SSH: `ssh root@167.71.228.217`
- Database: Supabase (PostgreSQL hosted)
- SSL: Already configured

---

## 🚀 **Fastest Deployment (5 minutes)**

### Option 1: Automated Deployment Script (RECOMMENDED)

```bash
# From your local machine
scp deploy.sh root@167.71.228.217:/root/
ssh root@167.71.228.217 'bash /root/deploy.sh'
```

**That's it!** The script handles:
- ✅ Pull latest code
- ✅ Install dependencies
- ✅ Run database migration
- ✅ Build frontend
- ✅ Restart services
- ✅ Verify everything works

---

### Option 2: Manual SSH Steps (If script doesn't work)

```bash
# 1. Connect to server
ssh root@167.71.228.217

# 2. Navigate to project
cd /root/BuildGuard-AI  # or wherever it's installed

# 3. Pull latest code
git pull origin main

# 4. Update backend
cd backend
pip install -r requirements.txt
python migrate_user_id_to_string.py

# 5. Build frontend
cd ../frontend
npm install
npm run build

# 6. Restart services (choose one based on your setup)

# If using Docker:
docker-compose down
docker-compose up -d

# OR if using systemd:
systemctl restart buildguard-backend
systemctl restart buildguard-frontend
systemctl restart nginx

# 7. Verify
curl http://localhost:8006/api/dashboard/stats?user_id=test
# Should return JSON with user_id field
```

---

## 🔍 **Verify Deployment Success**

```bash
# Check if backend is running
curl http://localhost:8006/api/health

# Check if API works
curl "http://localhost:8006/api/dashboard/stats?user_id=test_user"

# Check logs (if Docker)
docker-compose logs -f backend
docker-compose logs -f frontend

# Check logs (if systemd)
journalctl -u buildguard-backend -f
journalctl -u buildguard-frontend -f
```

---

## ✅ **Post-Deployment Checklist**

- [ ] Website loads: https://build-guard.app
- [ ] Dashboard shows data (not 404 or blank)
- [ ] Can upload images
- [ ] Can add sensor data
- [ ] User isolation works (test 2 browsers with different data)
- [ ] SSL certificate valid: https://www.ssllabs.com/ssltest/analyze.html?d=build-guard.app
- [ ] No errors in logs

---

## 🐛 **Common Issues**

### Database Migration Failed
```bash
cd /root/BuildGuard-AI/backend
python migrate_user_id_to_string.py
```

### Backend not starting
```bash
# Check logs
docker logs buildguard-backend
# or
journalctl -u buildguard-backend -n 50

# Check if port is free
lsof -i :8006
```

### Frontend not loading
```bash
# Rebuild
cd /root/BuildGuard-AI/frontend
npm run build

# Check if nginx is serving files
ls -la /usr/share/nginx/html/
```

### Database connection error
```bash
# Verify Supabase URL in environment variables
echo $DATABASE_URL
# or check docker-compose.yml for environment variables
```

---

## 📊 **Check Current Deployment Status**

```bash
# See what's running
docker ps
# or
systemctl list-units --all | grep buildguard

# Check disk space
df -h

# Check memory usage
free -m

# View recent git commits
git log --oneline -5
```

---

## 🔄 **Rollback (If Issues)**

```bash
# See previous commits
git log --oneline -10

# Rollback to previous version
git reset --hard HEAD~1
git push --force origin main

# Or checkout specific commit
git checkout <commit_hash>

# Restart services
docker-compose restart
# or
systemctl restart buildguard-backend buildguard-frontend
```

---

## 💡 **Environment Variables to Check**

Make sure these are set on your server:

```bash
# Supabase connection
DATABASE_URL=postgresql://user:password@host:port/database

# Backend settings
ENVIRONMENT=production
DEBUG=false

# Frontend (usually just runs in browser)
VITE_API_URL=http://localhost:8006
```

Check in your setup:
```bash
# Docker
cat docker-compose.yml | grep -A 5 "environment:"

# Systemd
cat /etc/systemd/system/buildguard-backend.service | grep "Environment="

# Direct environment
env | grep DATABASE_URL
```

---

## 📞 **Need Help?**

1. **Check logs first:**
   ```bash
   docker logs -f buildguard-backend
   ```

2. **Run the verify script:**
   ```bash
   curl "http://localhost:8006/api/dashboard/stats?user_id=test"
   ```

3. **Compare with checklist:**
   See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for full verification steps
