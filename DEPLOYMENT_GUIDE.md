# BuildGuard-AI Production Deployment

## Docker Deployment

### Local Testing

```bash
docker-compose up -d
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose down
```

### Production Server

1. SSH into your server:
```bash
ssh user@your-server-ip
```

2. Install Docker:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

3. Clone the project:
```bash
git clone https://github.com/Structural-Health-AI/BuildGuard-AI.git
cd BuildGuard-AI
```

4. Set environment variables:
```bash
cat > .env << EOF
ENVIRONMENT=production
ALLOWED_ORIGINS=https://www.build-guard.app
DATABASE_URL=sqlite:///./buildguard.db
EOF
```

5. Start services:
```bash
docker-compose up -d
systemctl enable docker
```

6. Monitor:
```bash
docker ps
docker logs -f buildguard-backend
docker logs -f buildguard-frontend
```

## PM2 Deployment

### Install PM2
```bash
npm install -g pm2
```

### Start Backend
```bash
cd backend
pm2 start main.py --name "buildguard-backend" --interpreter python
pm2 startup
pm2 save
```

### Monitor
```bash
pm2 list
pm2 logs buildguard-backend
pm2 restart buildguard-backend
```

## Systemd Service

Create `/etc/systemd/system/buildguard-backend.service`:

```ini
[Unit]
Description=BuildGuard-AI Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/BuildGuard-AI/backend
Environment="PATH=/home/ubuntu/.local/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable buildguard-backend
sudo systemctl start buildguard-backend
```
# Monitor logs
sudo journalctl -u buildguard-backend -f
```

---

## Health Checks & Monitoring

### API Health Check Endpoint

Add this to `backend/main.py` (inside the app routes):

```python
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0"
    }
```

### Monitor Backend Health
```bash
# Docker
docker health inspect buildguard-backend

# Manual check
curl http://localhost:8000/health

# PM2
pm2 monit
```

### Uptime Monitoring

Use services like:
- **Uptime Robot** (free) - monitors your API every 5 minutes
- **Better Uptime** - alerts if backend goes down
- **New Relic** - full application monitoring

---

## Production Checklist

- [ ] Backend running as service (Docker/PM2/Systemd)
- [ ] Auto-restart enabled on crashes
- [ ] Auto-start on server reboot
- [ ] Logs being captured for debugging
- [ ] Health check endpoint configured
- [ ] Uptime monitoring setup
- [ ] Database backup strategy
- [ ] Environment variables secured (.env not in git)
- [ ] CORS properly configured for https://www.build-guard.app
- [ ] SSL certificate installed (Let's Encrypt)

---

## Common Issues

### "Backend is down"
```bash
# Restart immediately
docker-compose restart backend
# OR
pm2 restart buildguard-backend
# OR
sudo systemctl restart buildguard-backend

# Check logs
docker-compose logs backend
pm2 logs buildguard-backend
journalctl -u buildguard-backend -f
```

### "Database locked"
```bash
# SQLite conflict - ensure only one process accesses it
ps aux | grep main.py
# Kill any duplicate processes
pkill -f "python main.py"
# Restart
pm2 start main.py --name "buildguard-backend"
```

### "Port already in use"
```bash
# Find process using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
# Restart backend
pm2 restart buildguard-backend
```

---

## Deployment on Major Platforms

### **AWS EC2**
1. Launch Ubuntu instance
2. Install Docker
3. Clone repo and `docker-compose up -d`
4. Attach Elastic IP
5. Point domain to IP

### **DigitalOcean App Platform**
1. Connect GitHub repo
2. Set build command: `docker-compose build`
3. Set run command: `docker-compose up`
4. Configure environment variables

### **Railway.app**
1. Connect GitHub
2. Deploy with one click
3. Auto-starts and auto-restarts

### **Heroku** (Free tier deprecated)
Use Docker with Railway or Render instead

---

## Quick Deploy Commands

### Docker (Recommended)
```bash
git pull
docker-compose down
docker-compose build
docker-compose up -d
docker-compose logs -f
```

### PM2
```bash
git pull
pm2 restart buildguard-backend
pm2 logs buildguard-backend
```

### Systemd
```bash
git pull
sudo systemctl restart buildguard-backend
sudo journalctl -u buildguard-backend -f
```

---

## Next Steps

1. **Choose your deployment method** (Docker recommended)
2. **Implement auto-restart** on your server
3. **Set up monitoring** (Uptime Robot)
4. **Configure SSL/HTTPS**
5. **Test with real users**

Your users will never see "Failed to analyze sensor data" again! ✅
