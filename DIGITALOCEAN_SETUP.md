# DigitalOcean Droplet + Supabase Setup Guide

## Problem
Backend crashes/stops running, and there's no auto-restart.

## Solution
Use **PM2** to keep your backend running 24/7 with auto-restart.

---

## Step 1: Get Your Supabase Connection String

### From Supabase Dashboard:

1. Go to **Settings** → **Database**
2. Copy **Connection String** (URL tab)
3. Should look like:
   ```
   postgresql://postgres:password@db.supabase.co:5432/postgres
   ```

---

## Step 2: SSH into Your DigitalOcean Droplet

```bash
ssh root@your_droplet_ip
```

Or with a non-root user:
```bash
ssh username@your_droplet_ip
```

---

## Step 3: Set Up Environment Variables

### Create `.env` file in backend directory:

```bash
cd ~/BuildGuard-AI/backend
nano .env
```

### Paste This (Replace with YOUR values):

```bash
# Database - Use Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.supabase.co:5432/postgres

# Security
SECRET_KEY=your-very-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS - Your website URL
ALLOWED_ORIGINS=https://www.build-guard.app
CORS_ORIGINS=https://www.build-guard.app
ENVIRONMENT=production
FRONTEND_URL=https://www.build-guard.app

# Email (if using)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=your-email@gmail.com
```

### Save and Exit:
```
Ctrl + X
Y
Enter
```

---

## Step 4: Install Node.js (for PM2)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

---

## Step 5: Install Python Dependencies

```bash
cd ~/BuildGuard-AI/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies (now includes psycopg2 for PostgreSQL)
pip install -r requirements.txt
```

---

## Step 6: Install and Configure PM2

### Install PM2 globally:

```bash
npm install -g pm2
```

### Start Backend with PM2:

```bash
cd ~/BuildGuard-AI/backend
pm2 start main.py --name "buildguard-backend" --interpreter python

# Verify it's running
pm2 list
pm2 logs buildguard-backend
```

### Enable Auto-Start on Droplet Reboot:

```bash
pm2 startup
pm2 save

# Verify
pm2 startup systemd -u root --hp /root
```

---

## Step 7: Test Everything

### Check if backend is running:

```bash
pm2 list
curl http://localhost:8000/health
curl http://localhost:8000/api/health
```

### Check logs:

```bash
pm2 logs buildguard-backend --lines 50
```

### Monitor in real-time:

```bash
pm2 monit
```

---

## Step 8: Set Up Nginx Reverse Proxy (Optional but Recommended)

### Install Nginx:

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

### Create config:

```bash
sudo nano /etc/nginx/sites-available/buildguard
```

### Paste This:

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name www.build-guard.app build-guard.app;

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    location / {
        root /var/www/buildguard;
        try_files $uri /index.html;
    }
}
```

### Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/buildguard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 9: Set Up SSL/HTTPS (Let's Encrypt)

### Install Certbot:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### Generate Certificate:

```bash
sudo certbot certonly --nginx -d www.build-guard.app -d build-guard.app
```

### Auto-Renew:

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Common PM2 Commands

```bash
# Start backend
pm2 start main.py --name "buildguard-backend" --interpreter python

# Stop backend
pm2 stop buildguard-backend

# Restart backend
pm2 restart buildguard-backend

# View logs
pm2 logs buildguard-backend

# Monitor (live view)
pm2 monit

# List all processes
pm2 list

# Remove process
pm2 delete buildguard-backend

# Save current state
pm2 save

# Resurrect saved state
pm2 resurrect

# Stop PM2
pm2 stop all
```

---

## Troubleshooting

### Backend not starting?

```bash
# Check logs
pm2 logs buildguard-backend

# Test Python directly
cd ~/BuildGuard-AI/backend
source venv/bin/activate
python main.py
```

### Database connection error?

```bash
# Check .env file
cat .env

# Test PostgreSQL connection
pip install psycopg2-binary
python3 -c "import psycopg2; psycopg2.connect('DATABASE_URL')"
```

### Port already in use?

```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Restart PM2
pm2 restart buildguard-backend
```

### Website shows "Failed to analyze sensor data"?

```bash
# Check if backend is running
pm2 list

# Restart it
pm2 restart buildguard-backend

# Check logs
pm2 logs buildguard-backend --lines 100

# Check CORS settings in .env
cat .env | grep CORS
```

---

## Final Checklist

- [ ] SSH into Droplet
- [ ] Created `.env` file with Supabase DATABASE_URL
- [ ] Installed Node.js
- [ ] Installed Python dependencies (pip install -r requirements.txt)
- [ ] Installed PM2
- [ ] Started backend with PM2
- [ ] Ran `pm2 startup` and `pm2 save`
- [ ] Tested `/api/health` endpoint
- [ ] Backend auto-starts on Droplet reboot
- [ ] Tested with website - no more errors!

---

## What Happens Now?

✅ Backend **automatically starts** on Droplet reboot  
✅ Backend **auto-restarts** if it crashes  
✅ Backend **stays running 24/7**  
✅ Users **never see** "Failed to analyze sensor data"  

---

## Quick Deploy (When you push code updates)

```bash
cd ~/BuildGuard-AI
git pull
cd backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart buildguard-backend
pm2 logs buildguard-backend
```

That's it! Your backend is now production-ready. 🚀
