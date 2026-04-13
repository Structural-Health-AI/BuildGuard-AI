# 📋 Deployment Commands - Copy & Paste

## Step-by-Step Commands for Your Droplet

### 1️⃣ SSH into Droplet (from your laptop)
```bash
ssh root@your_droplet_ip
# Password: (enter your droplet password)
```

### 2️⃣ Navigate to Project (if not already there)
```bash
cd /home

# If you haven't cloned yet:
git clone https://github.com/YOUR_USERNAME/BuildGuard-AI.git

cd BuildGuard-AI
```

### 3️⃣ RUN THE AUTOMATED DEPLOYMENT SCRIPT ⚡
```bash
sudo bash deploy.sh
```

**Wait for completion (5-10 minutes)**

---

## ✅ After Script Completes

### 1. Get Your Droplet IP
```bash
hostname -I
# Output: 192.168.1.100 (your IP)
```

### 2. Test in Browser
```
Open: http://your_droplet_ip
```
Example: `http://192.168.1.100`

**You should see BuildGuard-AI login page** ✨

### 3. Test with curl
```bash
# Test backend
curl http://localhost:8000/health

# Test frontend
curl http://localhost/

# Expected response for health: {"status":"healthy"}
```

---

## 🔧 Update .env File (Important!)

```bash
# Edit environment variables
nano /home/BuildGuard-AI/backend/.env
```

**Find and update these lines:**

```env
# Replace this line:
ALLOWED_ORIGINS=["http://localhost","http://127.0.0.1"]

# With your droplet IP or domain:
ALLOWED_ORIGINS=["http://192.168.1.100"]  # Use your actual IP
```

**Save:** `Ctrl + O` → `Enter` → `Ctrl + X`

### Then Restart Backend:
```bash
systemctl restart buildguard-backend.service
```

---

## 📊 Verify Everything Works

```bash
# 1. Check backend service status
systemctl status buildguard-backend.service

# 2. Check PostgreSQL is running
psql -U buildguard_user -d buildguard_db -c "SELECT NOW();"

# 3. Check Nginx is running
systemctl status nginx

# 4. View backend logs (last 20 lines)
journalctl -u buildguard-backend.service -n 20

# 5. Follow logs in real-time
journalctl -u buildguard-backend.service -f
# (Press Ctrl+C to exit)
```

---

## 🧪 Manual Testing

### Test Image Upload (via curl)
```bash
# Create a test image first (any image file)
# Then upload it:
curl -X POST http://localhost/api/images/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_image.jpg"
```

### Test Sensor Data
```bash
curl -X POST http://localhost/api/sensor/predict \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accel_x": 0.1,
    "accel_y": 0.2,
    "accel_z": 0.3,
    "strain": 50.0,
    "temperature": 25.0
  }'
```

---

## 🚨 If Something Goes Wrong

### Backend Won't Start?
```bash
# Check what's wrong
journalctl -u buildguard-backend.service -n 50

# Try restarting
systemctl restart buildguard-backend.service

# Manual test
cd /home/BuildGuard-AI/backend
source ../venv/bin/activate
python3 -c "from main import app; print('Success!')"
```

### PostgreSQL Connection Error?
```bash
# Verify database exists
psql -U buildguard_user -d buildguard_db -c "\d"

# Check connection string in .env
cat /home/BuildGuard-AI/backend/.env | grep DATABASE_URL

# Manually test connection
psql -U buildguard_user -d buildguard_db -c "SELECT NOW();"
```

### Nginx Showing 502?
```bash
# Check Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx

# Check if backend is running on port 8000
netstat -tlnp | grep 8000
# or
ss -tlnp | grep 8000
```

### Can't Access from Browser?
```bash
# Check firewall (if enabled)
sudo ufw status

# Allow port 80 (if needed)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# Reload firewall
sudo ufw reload
```

---

## 📈 Monitor Your Application

### Real-Time Logs
```bash
# Follow backend logs
journalctl -u buildguard-backend.service -f

# View access logs
tail -f /var/log/buildguard/access.log

# View error logs
tail -f /var/log/buildguard/error.log
```

### System Resources
```bash
# View CPU, RAM, Disk usage
top
# (Press Q to quit)

# Or use htop (nicer interface)
htop

# Check disk space
df -h

# Check memory usage
free -h
```

### Service Health
```bash
# Check all services
systemctl status buildguard-backend.service
systemctl status postgresql
systemctl status nginx

# Quick status check
systemctl is-active buildguard-backend.service
echo $?  # 0 = running, 1 = not running
```

---

## 🔄 Updating Your Code

If you make changes and want to redeploy:

```bash
# 1. Pull latest code from GitHub
cd /home/BuildGuard-AI
git pull origin main

# 2. If you changed Python requirements:
source venv/bin/activate
pip install -r backend/requirements.txt

# 3. If you changed frontend:
cd frontend
npm install
npm run build
cd ..

# 4. Restart backend
systemctl restart buildguard-backend.service

# 5. Reload Nginx
systemctl reload nginx

# 6. Check logs
journalctl -u buildguard-backend.service -n 20
```

---

## 🗑️ Clean Up / Full Reset (if needed)

```bash
# Stop services
systemctl stop buildguard-backend.service
systemctl stop nginx

# Backup database (IMPORTANT!)
pg_dump -U buildguard_user buildguard_db > backup.sql

# Remove old app (CAREFUL!)
rm -rf /home/BuildGuard-AI

# Re-clone and deploy
cd /home
git clone https://github.com/YOUR_USERNAME/BuildGuard-AI.git
cd BuildGuard-AI
sudo bash deploy.sh
```

---

## 🎯 Success Checklist

- [ ] Connected to droplet via SSH
- [ ] Repository cloned to `/home/BuildGuard-AI`
- [ ] Ran `sudo bash deploy.sh` successfully
- [ ] Script output shows "✓ BuildGuard-AI Deployment Complete!"
- [ ] Can access http://your_droplet_ip in browser
- [ ] See login page of BuildGuard-AI
- [ ] Can register a new account
- [ ] Can upload images and get predictions
- [ ] Can enter sensor data and get health status
- [ ] Backend logs show no errors: `journalctl -u buildguard-backend.service -n 20`

---

## 📝 Useful File Locations

| Item | Path |
|------|------|
| **Application** | `/home/BuildGuard-AI/` |
| **Backend** | `/home/BuildGuard-AI/backend/` |
| **Frontend** | `/home/BuildGuard-AI/frontend/dist/` |
| **Environment** | `/home/BuildGuard-AI/backend/.env` |
| **Nginx Config** | `/etc/nginx/sites-available/buildguard` |
| **Backend Service** | `/etc/systemd/system/buildguard-backend.service` |
| **Backend Logs** | `/var/log/buildguard/` |
| **Nginx Logs** | `/var/log/nginx/` |
| **Database** | PostgreSQL (local via psql) |

---

## 🆘 Get Help

If something isn't working:

1. Check logs: `journalctl -u buildguard-backend.service -f`
2. Check services: `systemctl status buildguard-backend.service`
3. Test connectivity: `curl http://localhost:8000/health`
4. Check database: `psql -U buildguard_user -d buildguard_db -c "SELECT NOW();"`

---

**You're ready to go!** 🚀

Run `sudo bash deploy.sh` and watch the magic happen ✨
