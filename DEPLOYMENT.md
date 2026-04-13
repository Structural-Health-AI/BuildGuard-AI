# BuildGuard-AI Deployment on DigitalOcean

## 🚀 Quick Start (Ubuntu 24.04)

### Prerequisites
- Droplet: DigitalOcean Ubuntu 24.04 LTS (2 CPU, 2GB RAM)
- SSH access to droplet
- DNS configured (optional, can use droplet IP)

---

## ✅ Step 1: Connect to Droplet & Update System

```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Update system packages
apt update && apt upgrade -y
```

---

## ✅ Step 2: Install System Dependencies

```bash
# Install Python, Node.js, PostgreSQL, and other tools
apt install -y \
    python3.12 \
    python3.12-venv \
    python3-pip \
    nodejs \
    npm \
    postgresql \
    postgresql-contrib \
    nginx \
    git \
    curl \
    wget \
    build-essential \
    libpq-dev

# Verify installations
python3 --version
node --version
npm --version
psql --version
```

---

## ✅ Step 3: Set Up PostgreSQL Database

```bash
# Start PostgreSQL service
systemctl start postgresql
systemctl enable postgresql

# Connect to PostgreSQL
sudo -u postgres psql

# In PostgreSQL terminal, run:
CREATE USER buildguard_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE buildguard_db OWNER buildguard_user;
GRANT ALL PRIVILEGES ON DATABASE buildguard_db TO buildguard_user;

# Connect to the new database and set schema
\c buildguard_db

# Create tables (run the migration script below)
# Then exit with: \q
```

---

## ✅ Step 4: Clone & Setup Backend

```bash
# Navigate to home directory
cd /home

# Clone the repository (if not already done)
git clone https://github.com/yourusername/BuildGuard-AI.git
cd BuildGuard-AI

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r backend/requirements.txt

# Install additional deployment dependencies
pip install gunicorn psycopg2-binary python-dotenv
```

---

## ✅ Step 5: Configure Environment Variables

```bash
# Create .env file in backend directory
nano backend/.env
```

**Paste this content and update values:**

```env
# Database
DATABASE_URL=postgresql://buildguard_user:your_secure_password@localhost:5432/buildguard_db

# Server
ENVIRONMENT=production
DEBUG=false

# Security
SECRET_KEY=your_very_secret_random_key_here_use_python_secrets
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=["https://yourdomain.com","http://your_droplet_ip"]

# Email (for password reset)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SENDER_EMAIL=noreply@buildguard.com

# Application
APP_NAME=BuildGuard-AI
MAX_UPLOAD_SIZE=104857600

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=5
RATE_LIMIT_PERIOD=900
```

**Save: Ctrl+O, Enter, Ctrl+X**

---

## ✅ Step 6: Initialize Database Tables

```bash
# Navigate to backend
cd backend

# Create database tables using Python script
python3 << 'EOF'
import sqlite3
import os
from sqlalchemy import create_engine
from models.user_model import Base

# Use PostgreSQL instead
DATABASE_URL = "postgresql://buildguard_user:your_password@localhost:5432/buildguard_db"
engine = create_engine(DATABASE_URL)

# Create all tables
Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully!")
EOF

cd ..
```

---

## ✅ Step 7: Build Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# This creates 'dist' folder with optimized files
cd ..
```

---

## ✅ Step 8: Configure Nginx as Reverse Proxy

```bash
# Remove default Nginx config
rm /etc/nginx/sites-enabled/default

# Create new Nginx config
nano /etc/nginx/sites-available/buildguard
```

**Paste this configuration:**

```nginx
upstream backend {
    server localhost:8000;
}

server {
    listen 80;
    server_name _;
    client_max_body_size 100M;

    # Frontend
    location / {
        root /home/BuildGuard-AI/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache settings
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for ML inference (3 seconds for image processing)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend;
    }
}
```

**Save: Ctrl+O, Enter, Ctrl+X**

```bash
# Enable the configuration
ln -s /etc/nginx/sites-available/buildguard /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Start and enable Nginx
systemctl restart nginx
systemctl enable nginx
```

---

## ✅ Step 9: Create Systemd Service for Backend

```bash
# Create systemd service file
nano /etc/systemd/system/buildguard-backend.service
```

**Paste this content:**

```ini
[Unit]
Description=BuildGuard-AI Backend (FastAPI + Gunicorn)
After=network.target postgresql.service

[Service]
Type=notify
User=root
WorkingDirectory=/home/BuildGuard-AI/backend
Environment="PATH=/home/BuildGuard-AI/venv/bin"
EnvironmentFile=/home/BuildGuard-AI/backend/.env
ExecStart=/home/BuildGuard-AI/venv/bin/gunicorn \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile - \
    main:app

# Auto restart on failure
Restart=always
RestartSec=10

# Security
PrivateTmp=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

**Save: Ctrl+O, Enter, Ctrl+X**

---

## ✅ Step 10: Start and Enable Services

```bash
# Enable and start backend service
systemctl daemon-reload
systemctl enable buildguard-backend.service
systemctl start buildguard-backend.service

# Check backend status
systemctl status buildguard-backend.service

# View logs
journalctl -u buildguard-backend.service -f
```

---

## ✅ Step 11: Verify Everything

```bash
# Check if backend is running
curl http://localhost:8000/health

# Check if Nginx is running
curl http://localhost/health

# Check database connection
psql -U buildguard_user -d buildguard_db -c "SELECT 1;"

# View backend logs
journalctl -u buildguard-backend.service -n 50
```

---

## ✅ Step 12: Access Your Application

Open browser:
```
http://your_droplet_ip
```

You should see the BuildGuard-AI frontend!

---

## 🔒 Optional: Set Up SSL/HTTPS with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Generate certificate (replace domain.com with your domain)
certbot certonly --standalone -d domain.com

# Update Nginx config to use SSL
nano /etc/nginx/sites-available/buildguard

# Add these lines before the server block:
# server {
#     listen 443 ssl http2;
#     ssl_certificate /etc/letsencrypt/live/domain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/domain.com/privkey.pem;

# Test and restart Nginx
nginx -t
systemctl restart nginx
```

---

## 📋 Troubleshooting

### Backend not starting?
```bash
# Check logs
journalctl -u buildguard-backend.service -f

# Test backend manually
cd /home/BuildGuard-AI/backend
source ../venv/bin/activate
python3 -c "from main import app; print('FastAPI imported successfully')"
```

### Database connection error?
```bash
# Test PostgreSQL connection
psql -U buildguard_user -d buildguard_db -c "SELECT NOW();"

# Check DATABASE_URL in .env
cat backend/.env | grep DATABASE_URL
```

### Nginx not showing frontend?
```bash
# Check if dist folder exists
ls -la frontend/dist/

# Check Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### ML model not loading?
```bash
# Ensure model files exist
ls -la backend/saved_models/

# Check if torch installed correctly
python3 -c "import torch; print(torch.__version__)"
```

---

## 🎯 Summary

✅ System updated  
✅ PostgreSQL installed & configured  
✅ Backend running on port 8000 (via Gunicorn)  
✅ Frontend built and served via Nginx  
✅ SSL/HTTPS ready  
✅ Auto-restart on failure  
✅ Logs accessible via journalctl  

**Your app is live at:** `http://your_droplet_ip` 🎉

---

## 📊 Monitoring & Maintenance

```bash
# Check service status
systemctl status buildguard-backend

# Restart backend
systemctl restart buildguard-backend.service

# View real-time logs
journalctl -u buildguard-backend.service -f

# Check resource usage
top
# or
htop  # (install if not available: apt install htop)

# Check disk space
df -h

# Database backup
pg_dump -U buildguard_user buildguard_db > backup.sql
```

---

## 🚀 Next Steps

1. **Set up domain**: Point your domain to droplet IP
2. **Enable SSL**: Use Let's Encrypt for HTTPS
3. **Email configuration**: Set up SendGrid or similar for password resets
4. **Monitoring**: Set up DigitalOcean monitoring dashboard
5. **Backups**: Enable automatic DigitalOcean backups

---

**Deployment Complete!** 🎊
