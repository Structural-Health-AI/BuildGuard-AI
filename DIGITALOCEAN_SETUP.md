# Server Setup Guide

## Prerequisites

- DigitalOcean Droplet (or similar Linux server)
- SSH access to your server
- PostgreSQL or SQLite database configured
- Domain name (optional but recommended)

## Initial Setup

### 1. SSH into Server

```bash
ssh root@your_droplet_ip
# or
ssh username@your_droplet_ip
```

### 2. Environment Configuration

Create `.env` file in the backend directory:

```bash
cd ~/BuildGuard-AI/backend
nano .env
```

Add the following configuration (update values as needed):

```bash
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.supabase.co:5432/postgres
# or for SQLite:
# DATABASE_URL=sqlite:///./buildguard.db

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
```

Save and exit: `Ctrl + X`, `Y`, `Enter`

### 3. Install Dependencies

```bash
# Install Node.js (for PM2)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python and virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Process Management with PM2

### 4. Install and Configure PM2

```bash
npm install -g pm2

# Start backend
cd ~/BuildGuard-AI/backend
pm2 start main.py --name "buildguard-backend" --interpreter python

# Enable auto-start on reboot
pm2 startup
pm2 save
```

### 5. Verify Backend

```bash
# List processes
pm2 list

# Check logs
pm2 logs buildguard-backend --lines 50

# Test health endpoint
curl http://localhost:8000/api/health
```

## Nginx Reverse Proxy Setup (Optional)

### 6. Install and Configure Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx

# Create configuration
sudo nano /etc/nginx/sites-available/buildguard
```

Add the following configuration:

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
    }

    location / {
        root /var/www/buildguard;
        try_files $uri /index.html;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/buildguard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d www.build-guard.app -d build-guard.app

# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## PM2 Command Reference

```bash
# Basic commands
pm2 start main.py --name "buildguard-backend" --interpreter python
pm2 stop buildguard-backend
pm2 restart buildguard-backend
pm2 delete buildguard-backend

# Monitoring
pm2 list
pm2 logs buildguard-backend
pm2 monit

# State management
pm2 save
pm2 resurrect
```

## Troubleshooting

### Backend fails to start

```bash
pm2 logs buildguard-backend
source venv/bin/activate
python main.py  # Test directly
```

### Database connection error

```bash
cat .env | grep DATABASE_URL
python3 -c "import psycopg2; psycopg2.connect('your_connection_string')"
```

### Port 8000 in use

```bash
lsof -i :8000
kill -9 <PID>
pm2 restart buildguard-backend
```

### Health check fails

```bash
pm2 logs buildguard-backend --lines 100
curl -v http://127.0.0.1:8000/api/health
```

## Verification Checklist

- [ ] SSH access to server working
- [ ] .env file configured with database URL
- [ ] Python dependencies installed
- [ ] PM2 installed and backend started
- [ ] pm2 startup and pm2 save executed
- [ ] Health endpoint responding
- [ ] Backend auto-starts on reboot
- [ ] Nginx configured (if using reverse proxy)
- [ ] SSL certificate installed (if using HTTPS)

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
