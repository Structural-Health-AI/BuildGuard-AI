# BuildGuard-AI Deployment Guide

## Overview

This guide covers deployment procedures for BuildGuard-AI on DigitalOcean using Docker and PM2.

---

## Recent Updates

### Dashboard Critical Alerts Fix (Latest)
- **Issue**: Image analyses marked as critical weren't showing in dashboard critical alerts count
- **Fix**: Dashboard now aggregates both sensor predictions and image analyses damage into critical count
- **Deployment**: Restart backend application (no database migration needed)
  ```bash
  # PM2 deployment
  pm2 restart buildguard-backend
  
  # Docker deployment
  docker-compose restart backend
  ```
- **Impact**: Backward compatible, existing data will be correctly counted

---

## Prerequisites

- DigitalOcean Droplet (2GB RAM minimum, Ubuntu 22.04)
- SSH access to your server
- Domain name (optional but recommended for HTTPS)
- Supabase PostgreSQL database configured
- GitHub repository access

---

## DigitalOcean Server Setup

### 1. Connect to Your Droplet

```bash
ssh root@your_droplet_ip
# or
ssh username@your_droplet_ip
```

### 2. System Updates

```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential
```

### 3. Install Node.js (for PM2)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs npm
npm install -g pm2
pm2 startup
```

### 4. Install Python & Dependencies

```bash
apt install -y python3 python3-pip python3-venv python3-dev
```

### 5. Install Docker (Optional - for containerized deployment)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

---

## Application Deployment

### Option A: Using PM2 (Recommended for Small Deployments)

#### 1. Clone Repository

```bash
cd ~
git clone https://github.com/Structural-Health-AI/BuildGuard-AI.git
cd BuildGuard-AI
```

#### 2. Configure Environment

```bash
cd backend
# Create .env file (use secure method - copy from secure storage)
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.supabase.co:5432/postgres

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Configuration
ALLOWED_ORIGINS=https://www.build-guard.app
ENVIRONMENT=production
FRONTEND_URL=https://www.build-guard.app

# Email (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=your-email@gmail.com
EOF
```

#### 3. Setup Backend

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python migrate_db.py

# Test database connection
python test_db.py
```

#### 4. Start Backend with PM2

```bash
pm2 start main.py \
  --name "buildguard-backend" \
  --interpreter python \
  --watch \
  --max-memory-restart 200M

pm2 save
```

#### 5. Deploy Frontend

```bash
cd ../frontend
npm install
npm run build

# Serve with nginx or static server
npm install -g http-server
pm2 start 'http-server dist -p 3000' --name "buildguard-frontend"
pm2 save
```

#### 6. Start on Boot

```bash
pm2 startup systemd -u root --hp /root
pm2 save
```

#### 7. View Logs

```bash
pm2 logs buildguard-backend
pm2 logs buildguard-frontend
pm2 monit
```

---

### Option B: Docker Deployment (Recommended for Large Deployments)

#### 1. Clone Repository

```bash
cd ~
git clone https://github.com/Structural-Health-AI/BuildGuard-AI.git
cd BuildGuard-AI
```

#### 2. Configure Environment

Create `.env` file (see Option A, Step 2)

#### 3. Build and Run Containers

```bash
docker-compose up -d
docker-compose logs -f
```

#### 4. Verify Services

```bash
docker ps
curl http://localhost:8000/api/health
curl http://localhost:3000
```

#### 5. Database Migrations

```bash
docker-compose exec backend python migrate_db.py
```

---

## Nginx Configuration

### 1. Install Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 2. Create Nginx Config

```bash
sudo tee /etc/nginx/sites-available/buildguard > /dev/null << 'EOF'
upstream backend {
    server 127.0.0.1:8000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name www.build-guard.app build-guard.app;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.build-guard.app build-guard.app;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/www.build-guard.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.build-guard.app/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### 3. Enable Nginx Config

```bash
sudo ln -s /etc/nginx/sites-available/buildguard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL/TLS Setup (Let's Encrypt)

### 1. Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 2. Generate Certificate

```bash
certbot certonly --nginx -d www.build-guard.app -d build-guard.app
```

### 3. Auto-Renewal

```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## Monitoring & Maintenance

### Check Service Status

```bash
# PM2 services
pm2 status
pm2 logs buildguard-backend --lines 50

# Docker services
docker ps
docker logs buildguard-backend

# System resources
top
df -h
free -h
```

### Restart Services

```bash
# PM2
pm2 restart all
pm2 restart buildguard-backend

# Docker
docker-compose restart
docker-compose restart backend
```

### View Nginx Logs

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check PM2 logs
pm2 logs buildguard-backend --lines 100

# Verify .env file
cat ~/BuildGuard-AI/backend/.env

# Check port 8000
lsof -i :8000
netstat -tlnp | grep 8000

# Check Python errors
cd ~/BuildGuard-AI/backend
source venv/bin/activate
python main.py
```

### Database Connection Issues

```bash
# Verify DATABASE_URL
grep DATABASE_URL backend/.env

# Test connection
cd backend
python -c "from core.config import settings; print(settings.database_url)"
python test_db.py
```

### Frontend Not Loading

```bash
# Check frontend service
pm2 logs buildguard-frontend

# Check port 3000
curl http://localhost:3000
lsof -i :3000
```

### API Health Check

```bash
# Test backend endpoint
curl http://127.0.0.1:8000/api/health

# Test through Nginx
curl https://www.build-guard.app/api/health
```

---

## Backup & Recovery

### Database Backup (Supabase)

```bash
# Automated backups available in Supabase Dashboard
# Manual backup:
pg_dump postgresql://user:password@host:5432/postgres > backup.sql
```

### Application Backup

```bash
cd ~
tar -czf buildguard-backup-$(date +%Y%m%d).tar.gz BuildGuard-AI/
```

### Restore from Backup

```bash
tar -xzf buildguard-backup-20260419.tar.gz
cd BuildGuard-AI
pm2 restart all
```

---

## Production Secrets Management

**Important:** Do NOT use `.env` files in production. Use DigitalOcean App Platform or Doppler.

### Using Doppler (Recommended)

```bash
# Install Doppler CLI
curl -Ls https://cli.doppler.com/install.sh | sh

# Configure
doppler login
doppler setup

# Run application
doppler run -- pm2 start main.py --name "buildguard-backend" --interpreter python
```

---

## Performance Optimization

### 1. Enable Gzip Compression

Add to `/etc/nginx/nginx.conf`:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### 2. Increase File Descriptors

```bash
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

### 3. Monitor Resource Usage

```bash
# Setup monitoring
pm2 plus

# Or use htop
apt install -y htop
htop
```

---

## Rollback Procedure

### Quick Rollback (PM2)

```bash
cd ~/BuildGuard-AI
git log --oneline  # Find previous commit
git checkout <commit-hash>
cd backend && pip install -r requirements.txt
pm2 restart all
```

### Full Rollback (Docker)

```bash
docker-compose down
cd ~/BuildGuard-AI
git checkout <commit-hash>
docker-compose up -d
```

---

**Last Updated:** 2026-04-19

For more information, see [SECURITY.md](./SECURITY.md) and the main [README.md](../README.md)

### Install PM2 (Process Manager)

```bash
npm install -g pm2
pm2 startup
pm2 save
```

### Install Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

---

## Step 2: Clone Repository

```bash
cd /root
git clone https://github.com/Structural-Health-AI/BuildGuard-AI.git
cd BuildGuard-AI
```

---

## Step 3: Configure Environment

### Create Backend .env File

```bash
cat > backend/.env << 'EOF'
# Database (Supabase Shared Pooler)
DATABASE_URL=postgresql://postgres.XXXX:PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

# Security
SECRET_KEY=generate-a-random-32-character-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
ALLOWED_ORIGINS=https://www.build-guard.app,https://build-guard.app
ENVIRONMENT=production

# Email (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=noreply@build-guard.app
SENDER_PASSWORD=your-app-password

# Logging
LOG_LEVEL=INFO
EOF
```

### Create Frontend .env File

```bash
cat > frontend/.env << 'EOF'
VITE_API_URL=https://www.build-guard.app/api
VITE_ENV=production
EOF
```

---

## Step 4: Install Dependencies

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python migrate_db.py  # Run database migrations
deactivate
cd ..
```

### Frontend

```bash
cd frontend
npm install
npm run build  # Build for production
cd ..
```

---

## Step 5: Configure PM2

### Create PM2 Ecosystem Config

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'buildguard-backend',
      script: './backend/main.py',
      interpreter: './backend/venv/bin/python',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/root/.pm2/logs/buildguard-backend-error.log',
      out_file: '/root/.pm2/logs/buildguard-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
EOF
```

### Start Backend with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 logs buildguard-backend  # View logs
```

---

## Step 6: Configure Nginx

### Create Nginx Configuration

```bash
cat > /etc/nginx/sites-available/build-guard.app << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name www.build-guard.app build-guard.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.build-guard.app build-guard.app;

    # SSL certificates (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/www.build-guard.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.build-guard.app/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Frontend static files
    location / {
        root /root/BuildGuard-AI/frontend/dist;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000/api/health;
        access_log off;
    }
}
EOF
```

### Enable Nginx Site

```bash
ln -s /etc/nginx/sites-available/build-guard.app /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t  # Test configuration
systemctl restart nginx
```

---

## Step 7: Setup SSL with Let's Encrypt

### Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Generate SSL Certificate

```bash
certbot certonly --standalone -d www.build-guard.app -d build-guard.app
```

### Auto-Renewal

```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## Step 8: Start Backend Service

### Using PM2

```bash
cd /root/BuildGuard-AI/backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 &
```

Or use the PM2 config from Step 5.

---

## Step 9: Verify Deployment

### Check Services

```bash
# Check Nginx
systemctl status nginx

# Check PM2
pm2 status

# Check backend
curl -s http://127.0.0.1:8000/api/health
```

### Test HTTPS

```bash
curl -s https://www.build-guard.app/api/health | jq .
```

---

## Monitoring & Maintenance

### View Logs

```bash
# Backend logs
pm2 logs buildguard-backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -xe
```

### Monitor Resources

```bash
# CPU, Memory, Processes
htop

# Or check specific service
ps aux | grep python
ps aux | grep nginx
```

### Update Code

```bash
cd /root/BuildGuard-AI
git pull origin main
npm --prefix frontend run build
pm2 restart buildguard-backend
nginx -s reload
```

---

## Troubleshooting

### Backend not starting?

```bash
# Check if port 8000 is in use
lsof -i :8000

# Check error logs
pm2 logs buildguard-backend --err
```

### CORS errors?

```bash
# Verify ALLOWED_ORIGINS in backend/.env
cat backend/.env | grep ALLOWED_ORIGINS

# Should include: https://www.build-guard.app
```

### SSL certificate errors?

```bash
# Check certificate status
certbot certificates

# Renew manually
certbot renew --dry-run
```

### Database connection issues?

```bash
# Test connection string
python3 -c "import psycopg2; psycopg2.connect('YOUR_DATABASE_URL')"

# Check if pooler endpoint is correct
# (should end with .pooler.supabase.com not .supabase.co)
```

---

## Performance Optimization

### Enable Connection Pooling

The DATABASE_URL should use the **Pooler endpoint**:
```
postgresql://postgres.XXXX:PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Configure PM2 Clustering (Optional)

For multi-core utilization:
```bash
pm2 start ecosystem.config.js -i max
```

### Cache Static Assets

Nginx already configured with gzip compression. Add caching:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

---

## Backup Strategy

### Database Backups (Supabase)

Supabase handles automated daily backups. Access in Supabase dashboard.

### File Backups

```bash
# Backup config files weekly
tar -czf /backups/buildguard-$(date +%Y%m%d).tar.gz \
  /root/BuildGuard-AI/backend/.env \
  /root/BuildGuard-AI/frontend/.env \
  /etc/nginx/sites-available/build-guard.app
```

---

## Rollback Procedure

```bash
# Revert to previous commit
cd /root/BuildGuard-AI
git revert HEAD
git pull origin main

# Rebuild frontend
npm --prefix frontend run build

# Restart services
pm2 restart buildguard-backend
systemctl restart nginx
```

---

## Production Checklist

- [ ] Environment variables set correctly
- [ ] SSL certificate installed and auto-renewing
- [ ] Database connection pooling enabled
- [ ] CORS origins configured
- [ ] Nginx gzip compression enabled
- [ ] PM2 configured to restart on reboot
- [ ] Logs monitored regularly
- [ ] Backups configured
- [ ] Health checks passing
- [ ] Performance acceptable (< 500ms response time)

---

**Last Updated**: April 2026  
**Status**: Production Ready
