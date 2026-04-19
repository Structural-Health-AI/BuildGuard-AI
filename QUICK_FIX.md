# Backend Recovery Guide

If the backend service has stopped, follow these steps to restore it.

## Quick Recovery

```bash
# SSH into your server
ssh root@your_droplet_ip

# Check if backend is running
ps aux | grep python

# Verify port 8000 is listening
lsof -i :8000

# Restart the service
pm2 restart buildguard-backend

# Verify it's running
pm2 logs buildguard-backend --lines 20
```

## Verify Health

```bash
# Test local endpoint
curl http://127.0.0.1:8000/api/health

# Test through Nginx
curl https://www.build-guard.app/api/health
```

## Troubleshooting

### Backend won't start
```bash
# Check PM2 logs
pm2 logs buildguard-backend --lines 100

# Verify .env file exists
cat ~/BuildGuard-AI/backend/.env

# Check for port conflicts
lsof -i :8000
```

### Database connection issues
```bash
# Verify database URL is correct
grep DATABASE_URL ~/BuildGuard-AI/backend/.env

# Test database connectivity
# (Add debug statement to main.py if needed)
```

For complete setup instructions, see [DIGITALOCEAN_SETUP.md](./DIGITALOCEAN_SETUP.md).
