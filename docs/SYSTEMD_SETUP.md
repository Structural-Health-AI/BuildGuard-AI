# Deploy to DigitalOcean - Systemd Setup

**Your Current Setup:**
- Project: `/var/www/BuildGuard-AI`
- Backend: systemd service `buildguard.service` on port 8000
- Frontend: nginx
- Database: Supabase
- SSL: Already configured

---

## 🚀 Deploy in 30 Seconds

```bash
# Copy the script to your server
scp C:\Users\dipen\OneDrive\Desktop\BuildGuard-AI\deploy-systemd.sh root@167.71.228.217:/root/

# Run it
ssh root@167.71.228.217 'bash /root/deploy-systemd.sh'
```

That's it! The script will:
- ✅ Pull latest code from GitHub
- ✅ Install backend dependencies
- ✅ Run database migration
- ✅ Build frontend
- ✅ Restart systemd service
- ✅ Reload nginx
- ✅ Verify everything works

---

## 🔍 Manual Deployment (If Script Fails)

### 1. SSH to Server
```bash
ssh root@167.71.228.217
```

### 2. Pull Latest Code
```bash
cd /var/www/BuildGuard-AI
git pull origin main
```

### 3. Update Backend
```bash
cd backend

# Activate virtualenv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migration (CRITICAL - changes user_id type)
python migrate_user_id_to_string.py

# Deactivate
deactivate
```

### 4. Build Frontend
```bash
cd ../frontend
npm install
npm run build
```

### 5. Restart Backend Service
```bash
# Stop
systemctl stop buildguard.service

# Start
systemctl start buildguard.service

# Verify
systemctl status buildguard.service
journalctl -u buildguard.service -n 20
```

### 6. Reload Nginx
```bash
nginx -t
systemctl reload nginx
```

### 7. Verify API Works
```bash
curl "http://localhost:8000/api/dashboard/stats?user_id=test"
# Should return JSON with user_id field
```

---

## ✅ Deployment Checklist

After deployment, verify:

- [ ] Backend service is running
  ```bash
  systemctl status buildguard.service
  ```

- [ ] Backend responds to requests
  ```bash
  curl http://localhost:8000/api/health
  ```

- [ ] API works with user isolation
  ```bash
  curl "http://localhost:8000/api/dashboard/stats?user_id=test_user_1"
  ```

- [ ] Frontend build exists
  ```bash
  ls -la /var/www/BuildGuard-AI/frontend/dist
  ```

- [ ] Website loads
  ```bash
  https://build-guard.app
  ```

- [ ] User isolation works (test with 2 browsers)
  - Browser 1: Upload image
  - Browser 2: Should NOT see the image (different user_id)

- [ ] SSL certificate is valid
  ```bash
  curl -I https://build-guard.app
  ```

---

## 🐛 Troubleshooting

### Backend Service Won't Start
```bash
# Check logs
journalctl -u buildguard.service -n 50

# Check if port is in use
lsof -i :8000

# Check virtualenv
ls -la /var/www/BuildGuard-AI/backend/venv/bin/python3

# Try starting manually
cd /var/www/BuildGuard-AI/backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Database Migration Failed
```bash
cd /var/www/BuildGuard-AI/backend
source venv/bin/activate
python migrate_user_id_to_string.py

# Check if columns were updated
python -c "from database import engine, Base; Base.metadata.reflect(bind=engine); print(engine.table_names())"
```

### Frontend Not Loading
```bash
# Rebuild
cd /var/www/BuildGuard-AI/frontend
npm run build

# Check nginx
nginx -t
systemctl reload nginx

# Check if files exist
ls -la /var/www/BuildGuard-AI/frontend/dist/
```

### API Returns Errors
```bash
# Check backend logs
journalctl -u buildguard.service -f

# Check database connection
curl "http://localhost:8000/api/dashboard/stats?user_id=test" -v

# Check if migration ran
python3 -c "
import os; os.chdir('/var/www/BuildGuard-AI/backend')
from database import Base, engine
Base.metadata.reflect(bind=engine)
for table in engine.table_names():
    print(f'Table: {table}')
    cols = engine.execute(f'PRAGMA table_info({table})').fetchall()
    for col in cols:
        if 'user_id' in col[1]:
            print(f'  {col[1]}: {col[2]}')
"
```

### SSL Certificate Issues
```bash
# Check certificate
curl -I https://build-guard.app

# View certificate details
openssl s_client -connect build-guard.app:443 -showcerts

# Nginx config
cat /etc/nginx/sites-enabled/buildguard
```

---

## 📊 Check Deployment Status

```bash
# Service status
systemctl status buildguard.service

# Recent logs
journalctl -u buildguard.service -n 100

# Continuous logs (follow)
journalctl -u buildguard.service -f

# Backend process
ps aux | grep "python3.*main.py"

# Port listening
netstat -tlnp | grep 8000

# Database connection
curl -s http://localhost:8000/api/dashboard/stats?user_id=test | python -m json.tool

# Disk usage
du -sh /var/www/BuildGuard-AI/

# Memory usage
free -m
```

---

## 🔄 Rollback (If Issues)

```bash
# View recent commits
cd /var/www/BuildGuard-AI
git log --oneline -10

# Rollback to previous version
git reset --hard HEAD~1

# Restart service
systemctl restart buildguard.service

# Verify
curl http://localhost:8000/api/health
```

---

## 📞 Service Management Commands

```bash
# Start service
systemctl start buildguard.service

# Stop service
systemctl stop buildguard.service

# Restart service
systemctl restart buildguard.service

# Check if enabled on boot
systemctl is-enabled buildguard.service

# Enable on boot
systemctl enable buildguard.service

# Disable on boot
systemctl disable buildguard.service

# View service file
cat /etc/systemd/system/buildguard.service

# View full service logs
journalctl -u buildguard.service --all

# View last 50 lines
journalctl -u buildguard.service -n 50

# View since last boot
journalctl -u buildguard.service -b

# View real-time logs
journalctl -u buildguard.service -f
```

---

## 🎯 Quick Start After Deployment

1. **Verify backend running:**
   ```bash
   ssh root@167.71.228.217
   systemctl status buildguard.service
   curl http://localhost:8000/api/health
   ```

2. **Check database:**
   ```bash
   curl "http://localhost:8000/api/dashboard/stats?user_id=test"
   ```

3. **Visit website:**
   - Go to https://build-guard.app
   - Test upload functionality
   - Verify user isolation (2 browsers)

4. **Monitor logs:**
   ```bash
   journalctl -u buildguard.service -f
   ```

---

## 📝 Important Notes

- **Database migration** must be run once after deployment
- **User IDs** are stored in localStorage (persistent across sessions)
- **Each user** sees only their own data (filtered by user_id)
- **SSL certificate** auto-renewal is configured
- **Nginx** handles static frontend + proxies API to backend

---

## 🆘 Still Having Issues?

1. **Check logs first:**
   ```bash
   journalctl -u buildguard.service -f
   ```

2. **Restart service:**
   ```bash
   systemctl restart buildguard.service
   ```

3. **Verify API:**
   ```bash
   curl "http://localhost:8000/api/dashboard/stats?user_id=test" -v
   ```

4. **Check disk/memory:**
   ```bash
   df -h
   free -m
   ```

If you're still stuck, SSH into the server and share:
```bash
systemctl status buildguard.service
journalctl -u buildguard.service -n 50
ps aux | grep python
```
