# 🚀 BuildGuard-AI DigitalOcean Deployment - Quick Reference

## Overview
| Component | Status |
|-----------|--------|
| **Deployment Method** | Manual Setup (Python venv + Nginx) |
| **Database** | PostgreSQL 16+ |
| **OS** | Ubuntu 24.04 LTS |
| **Server** | Gunicorn + Uvicorn |
| **Reverse Proxy** | Nginx |
| **Total Setup Time** | ~15 minutes (automatic script) or ~30 minutes (manual) |

---

## 🎯 Two Ways to Deploy

### Method 1️⃣: Automated (RECOMMENDED) ⚡ [5 min]

```bash
# SSH into droplet
ssh root@your_droplet_ip

# Clone repo (if not done)
cd /home && git clone https://github.com/YOUR_USERNAME/BuildGuard-AI.git

# Run deployment script
cd BuildGuard-AI
sudo bash deploy.sh
```

**That's it!** ✨ The script handles everything automatically.

---

### Method 2️⃣: Manual Setup [30 min]

Follow the step-by-step guide in `DEPLOYMENT.md`

---

## 📝 Critical Files Created

| File | Purpose |
|------|---------|
| `backend/.env` | Environment variables (auto-created by script) |
| `buildguard-nginx.conf` | Nginx reverse proxy configuration |
| `buildguard-backend.service` | Systemd service for backend |
| `deploy.sh` | Automated deployment script |
| `DEPLOYMENT.md` | Detailed manual deployment guide |

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] DigitalOcean droplet running Ubuntu 24.04
- [ ] SSH access to droplet
- [ ] Git cloned to `/home/BuildGuard-AI`
- [ ] Sufficient storage (~2GB recommended)

### During Deployment
- [ ] Run `sudo bash deploy.sh`
- [ ] Wait for completion (no interaction needed)
- [ ] Script creates PostgreSQL database
- [ ] Backend installed and running
- [ ] Frontend built
- [ ] Nginx configured

### Post-Deployment
- [ ] Open browser: `http://your_droplet_ip`
- [ ] Should see BuildGuard-AI login page
- [ ] Test login functionality
- [ ] Test image upload
- [ ] Test sensor data input

---

## 🔧 Post-Deployment Configuration

### Step 1: Update .env File

```bash
# SSH to droplet
ssh root@your_droplet_ip

# Edit .env
nano /home/BuildGuard-AI/backend/.env
```

**Update these values:**

```env
# CORS - Add your domain/IP
ALLOWED_ORIGINS=["http://your_droplet_ip","https://yourdomain.com"]

# Email - For password reset functionality
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SENDER_EMAIL=noreply@buildguard.com

# Security - Already generated, but you can regenerate if needed
SECRET_KEY=your_secret_key_here
```

**Save:** Ctrl+O → Enter → Ctrl+X

### Step 2: Restart Backend Service

```bash
systemctl restart buildguard-backend.service

# Verify it started
systemctl status buildguard-backend.service
```

---

## 📊 What Gets Installed

### System Packages
- Python 3.12 + venv
- Node.js 18+ + npm
- PostgreSQL 16
- Nginx
- Git, curl, wget, build-essential

### Python Packages (Backend)
- FastAPI 0.104.1
- Uvicorn 0.24.0
- SQLAlchemy 2.0.48
- PyTorch 2.0+
- Scikit-learn, Pandas, NumPy
- Gunicorn (for production)
- And all others from `requirements.txt`

### Node Packages (Frontend)
- React 18.2
- Vite 7.0
- React Router, Axios
- TailwindCSS, Framer Motion
- And all others from `package.json`

---

## 🌐 Network Configuration

```
                     Droplet (2 CPU, 2GB RAM)
                     ┌────────────────────────┐
                     │  Ubuntu 24.04 LTS      │
                     └────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              ┌─────▼─────┐       ┌─────▼──────┐
              │   Nginx    │       │ PostgreSQL │
              │ Port 80    │       │ Port 5432  │
              └─────┬─────┘       └────────────┘
                    │
        ┌───────────┴─────────────┐
        │                         │
    ┌───▼───┐            ┌────────▼────────┐
    │Frontend│            │Backend (Gunicorn)
    │(React)│            │Port 8000        │
    │Dist   │            │uvicorn workers  │
    └───────┘            └─────────────────┘
```

**Traffic Flow:**
```
User → Nginx (Port 80) → 
  ├─ React (frontend) /
  ├─ API calls → Gunicorn (8000) → FastAPI → PostgreSQL
  └─ Static assets (cached)
```

---

## 📈 Expected Performance

| Metric | Value |
|--------|-------|
| **Image Analysis Time** | 1-2 seconds |
| **Sensor Analysis Time** | <50ms |
| **Concurrent Users** | 3-5 comfortable |
| **Uptime** | 99.9% (auto-restart) |
| **Response Time (avg)** | <500ms |

---

## 🔍 Monitoring & Troubleshooting

### Check Service Status
```bash
systemctl status buildguard-backend.service
```

### View Real-Time Logs
```bash
journalctl -u buildguard-backend.service -f
```

### View Last 50 Log Lines
```bash
journalctl -u buildguard-backend.service -n 50
```

### Test Backend Health
```bash
curl http://localhost:8000/health
```

### Test Frontend
```bash
curl http://localhost/
```

### Check Resource Usage
```bash
top
# Or
htop
```

### View PostgreSQL Status
```bash
psql -U buildguard_user -d buildguard_db -c "SELECT NOW();"
```

### Restart Backend
```bash
systemctl restart buildguard-backend.service
```

### Restart Nginx
```bash
systemctl restart nginx
```

---

## 🔒 SSL/HTTPS Setup (Optional but Recommended)

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate (replace domain.com)
certbot certonly --standalone -d domain.com

# Update Nginx config
nano /etc/nginx/sites-available/buildguard
# Uncomment SSL section and update domain

# Restart Nginx
systemctl restart nginx

# Auto-renewal
certbot renew --dry-run  # Test
```

---

## 📊 Database Management

### Connect to Database
```bash
psql -U buildguard_user -d buildguard_db
```

### Basic Commands
```sql
\dt                          -- List all tables
SELECT COUNT(*) FROM users;  -- Count users
SELECT * FROM users LIMIT 5; -- View users
\du                          -- List users
\q                           -- Quit
```

### Backup Database
```bash
pg_dump -U buildguard_user buildguard_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql -U buildguard_user buildguard_db < backup_20240413.sql
```

---

## 🚀 Next Steps

1. **✅ Run deployment script**
   ```bash
   sudo bash deploy.sh
   ```

2. **✅ Update .env file** with your configuration

3. **✅ Test the application**
   - Open http://your_droplet_ip
   - Create a test account
   - Upload an image
   - Enter sensor data

4. **✅ Set up domain** (optional)
   - Point domain DNS to droplet IP
   - Enable SSL with Let's Encrypt

5. **✅ Monitor logs regularly**
   ```bash
   journalctl -u buildguard-backend.service -f
   ```

6. **✅ Set up backups**
   ```bash
   # Daily backup
   0 3 * * * pg_dump -U buildguard_user buildguard_db > /backups/db_$(date +\%Y\%m\%d).sql
   ```

---

## ❌ Common Issues & Solutions

### Backend not starting?
```bash
# Check logs
journalctl -u buildguard-backend.service -n 30

# Common causes:
# - Port 8000 already in use
# - .env file missing
# - PostgreSQL not running
# - Insufficient permissions
```

### Nginx showing 502 Bad Gateway?
```bash
# Backend is down, restart it
systemctl restart buildguard-backend.service

# Check if it's running
curl http://localhost:8000/health
```

### Can't connect to database?
```bash
# Test connection
psql -U buildguard_user -d buildguard_db -c "SELECT NOW();"

# Check PostgreSQL status
systemctl status postgresql

# Check DATABASE_URL in .env is correct
cat /home/BuildGuard-AI/backend/.env | grep DATABASE_URL
```

### Models not loading?
```bash
# Verify model files exist
ls -la /home/BuildGuard-AI/backend/saved_models/

# Check if PyTorch installed
python3 -c "import torch; print(torch.__version__)"

# Check backend logs
journalctl -u buildguard-backend.service -f
```

### Upload size limit exceeded?
```bash
# Update in nginx config
nano /etc/nginx/sites-available/buildguard
# Change: client_max_body_size 100M;
# (Already set to 100M by default)

systemctl reload nginx
```

---

## 📞 Support Files

- **DEPLOYMENT.md** - Full manual step-by-step guide
- **buildguard-nginx.conf** - Nginx configuration reference
- **buildguard-backend.service** - Systemd service configuration
- **backend/.env.example** - Environment variables template

---

## 🎉 Success Indicators

You'll know deployment is successful when:

✅ `http://your_droplet_ip` shows BuildGuard-AI login  
✅ You can register and login  
✅ Image upload works (returns damage analysis)  
✅ Sensor input works (returns health classification)  
✅ Reports are saved to database  
✅ No errors in `journalctl -u buildguard-backend.service`  

---

## 📌 Important Notes

- **First deployment** takes ~15 min (script installs everything)
- **Subsequent deployments** (updates) are much faster
- **Auto-restart** enabled - backend starts if it crashes
- **Logs persist** - view anytime with `journalctl`
- **Database** persists - data survives restarts
- **Free tier** credit: ~$100 lasts 4-5 months at $18-20/mo

---

**Happy Deploying!** 🚀 Let me know if you hit any issues!
