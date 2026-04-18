# 🚨 EMERGENCY: Website Not Working - Quick Fix

**Your backend crashed. Follow these steps RIGHT NOW:**

## Immediate Fix (30 seconds)

```bash
# 1. SSH into your Droplet
ssh root@your_droplet_ip

# 2. Check if backend is running
ps aux | grep main.py

# 3. If nothing shows - restart it
cd ~/BuildGuard-AI/backend
python main.py &

# 4. Test if it works
curl http://localhost:8000/health

# 5. Visit your website - should work now!
```

---

## Temporary Solution Works But...

⚠️ **This will only keep it running for THIS SESSION**

If the Droplet reboots or the process crashes again → Website will break again

---

## Permanent Solution (5 minutes to prevent this again)

### Follow the COMPLETE setup in: [DIGITALOCEAN_SETUP.md](./DIGITALOCEAN_SETUP.md)

This will:
- ✅ Auto-start backend on Droplet reboot
- ✅ Auto-restart if backend crashes
- ✅ Keep website running 24/7
- ✅ No more manual fixes needed

**Do this RIGHT AFTER the emergency restart!**

---

## TL;DR - Just Do This:

```bash
ssh root@your_droplet_ip

# Kill any old processes
pkill -f "python main.py"

# Install PM2 (one time)
npm install -g pm2

# Start backend with PM2
cd ~/BuildGuard-AI/backend
pm2 start main.py --name "buildguard-backend" --interpreter python

# Make it auto-start on reboot (one time)
pm2 startup
pm2 save

# Done! Check if it's working
pm2 logs buildguard-backend
```

Done! Now even if the Droplet reboots, your backend automatically starts again. 🎉

---

## Still Not Working?

```bash
# Check backend logs
pm2 logs buildguard-backend --lines 100

# Check if port 8000 is listening
lsof -i :8000

# Restart it
pm2 restart buildguard-backend

# Make sure .env file exists and is correct
cat ~/BuildGuard-AI/backend/.env
```

**Need more help?** See [DIGITALOCEAN_SETUP.md](./DIGITALOCEAN_SETUP.md) for detailed instructions.
