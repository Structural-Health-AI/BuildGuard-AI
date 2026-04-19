# Deployment Guide

## Overview

This guide covers deploying BuildGuard-AI to production on DigitalOcean VPS with SSL/TLS, Nginx, and PM2.

## Prerequisites

- DigitalOcean account with a VPS (Ubuntu 22.04+, 4GB+ RAM)
- Domain name (e.g., www.build-guard.app)
- SSH access to VPS
- GitHub repository with code

## Step 1: Initial VPS Setup

### SSH into VPS

```bash
ssh root@your_server_ip
```

### Update System

```bash
apt update && apt upgrade -y
apt install -y curl wget git htop net-tools
```

### Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Install Node.js & npm

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node --version && npm --version
```

### Install Python 3.10+

```bash
apt install -y python3.10 python3-pip python3.10-venv
python3 --version
```

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
