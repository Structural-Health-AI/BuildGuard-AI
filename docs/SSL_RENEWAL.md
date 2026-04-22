# SSL Certificate Auto-Renewal Guide

## Overview

BuildGuard AI uses **Let's Encrypt** SSL certificates for HTTPS security. This guide covers automatic renewal, monitoring, and troubleshooting.

**Current Certificate Status:**
- Domain: `build-guard.app`
- Issuer: Let's Encrypt
- Rating: **A+ (Excellent)**
- Expires: **July 12, 2026** (~2 months 22 days)

---

## 🔄 Automatic Renewal Setup

### Quick Setup (Recommended)

Run the auto-renewal setup script on your server:

```bash
cd /path/to/BuildGuard-AI
sudo bash scripts/deployment/setup-ssl-renewal.sh
```

**What this does:**
- ✅ Installs certbot (Let's Encrypt client)
- ✅ Tests renewal process (dry-run)
- ✅ Enables automatic renewal (systemd timer)
- ✅ Configures nginx reload on renewal

### Manual Renewal

If you prefer manual control:

```bash
# Test renewal without making changes
sudo certbot renew --dry-run

# Perform actual renewal
sudo certbot renew

# Renew specific domain
sudo certbot renew -d build-guard.app
```

---

## 📅 Automatic Renewal Schedule

Once enabled, certbot automatically:
- **Checks for renewal:** Twice daily (systemd timer)
- **Renews certificates:** ~30 days before expiration
- **Reloads nginx:** Automatically applies new certificate
- **Sends notifications:** Email alerts before expiration

### Check Timer Status

```bash
sudo systemctl list-timers certbot.timer

# Output example:
# Mon 2026-04-21 10:30:00 UTC    2h 30m left   -                       -   certbot.timer
```

---

## 🔍 Certificate Monitoring

### Check Expiration Status

```bash
bash scripts/deployment/check-ssl-expiration.sh build-guard.app
```

**Output examples:**

✅ Valid:
```
Certificate Details:
  Issuer: Let's Encrypt
  Expires: Sun Jul 12 17:22:30 2026 UTC
  Days Until Expiration: 82 days

✅ Certificate is valid and current
```

⚠️ Warning:
```
⚠️  WARNING: Certificate expires in less than 30 days
   Action: Renew soon with: sudo certbot renew
```

### Schedule Expiration Checks

Add to your cron:

```bash
# Check certificate every week
0 9 * * 0 /path/to/BuildGuard-AI/scripts/deployment/check-ssl-expiration.sh build-guard.app >> /var/log/ssl-check.log 2>&1
```

---

## 🛡️ Security Enhancements Enabled

### HSTS (HTTP Strict Transport Security)

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**What it does:**
- Forces HTTPS for 1 year
- Prevents downgrade attacks
- Preloads in browser HSTS lists

### Security Headers

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

**Benefits:**
- ✅ Prevents MIME type sniffing
- ✅ Prevents clickjacking
- ✅ Protects against XSS attacks
- ✅ Controls permissions & referrer leaks

### OCSP Stapling

Add to nginx for A+ rating:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/nginx/ssl/chain.pem;
```

---

## 🚨 Troubleshooting

### Certificate Renewal Fails

**Check certbot status:**
```bash
sudo systemctl status certbot.timer
sudo journalctl -u certbot.timer -n 50
```

**Common issues:**

1. **DNS not resolving:**
   ```bash
   dig build-guard.app
   nslookup build-guard.app
   ```

2. **Firewall blocking port 80/443:**
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. **Nginx configuration error:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Manual Renewal Troubleshooting

```bash
# Verbose renewal with debug info
sudo certbot renew --verbose --logs-dir /var/log/certbot

# Force renewal (ignore timer)
sudo certbot renew --force-renewal

# Standalone renewal (requires downtime)
sudo systemctl stop nginx
sudo certbot certonly --standalone -d build-guard.app
sudo systemctl start nginx
```

---

## 📞 Emergency Contacts

**Let's Encrypt Issues:**
- Website: https://letsencrypt.org/
- Support: https://letsencrypt.org/docs/

**SSL Labs Testing:**
- Test your certificate: https://www.ssllabs.com/ssltest/analyze.html?d=build-guard.app
- Certificate grade target: **A+ (Excellent)**

---

## ✅ Renewal Checklist

- [ ] Auto-renewal script installed (`setup-ssl-renewal.sh` ran successfully)
- [ ] Systemd timer enabled (`systemctl list-timers certbot.timer`)
- [ ] Expiration check script in place
- [ ] Email notifications configured
- [ ] HSTS headers enabled in nginx
- [ ] Security headers configured
- [ ] Backup renewal certificate stored
- [ ] Team notified of renewal schedule

---

## 📊 Certificate Timeline

```
Today (Apr 20, 2026)
    ↓
    ├─ Normal operation
    ├─ Certificate valid
    │
May 12, 2026 (22 days)
    ├─ Auto-renewal eligible
    │  (certificates can be renewed 30 days before expiration)
    │
Jun 12, 2026 (53 days)
    ├─ Email reminders begin
    │  (10 days before expiration)
    │
Jul 2, 2026 (72 days)
    ├─ Final reminder email
    │
Jul 12, 2026 (82 days) ⚠️ EXPIRATION
    ├─ Certificate expires
    ├─ CRITICAL: Must renew or service will break
```

---

## 🔐 Best Practices

1. **Monitor Proactively**
   - Run expiration checks weekly
   - Set calendar reminders
   - Monitor system logs

2. **Test Before Expiration**
   - Run `--dry-run` monthly
   - Verify nginx reload works
   - Check certificate chain

3. **Maintain Backups**
   - Backup `/etc/letsencrypt/` directory
   - Store certificate fingerprints
   - Keep DNS records updated

4. **Document Your Setup**
   - Record renewal procedures
   - Document custom configurations
   - Update team documentation

---

## Questions?

For more information on SSL/TLS security:
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [OWASP Transport Layer Protection](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)
