# Email Service Setup Guide

This guide explains how to configure the BuildGuard-AI email service for sending verification and password reset emails.

## Quick Start

### 1. Gmail (Recommended for Development)

**Step 1: Enable 2-Factor Authentication**
1. Go to https://myaccount.google.com/
2. Select "Security" from the left menu
3. Enable "2-Step Verification"

**Step 2: Create an App Password**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Generate the app password (you'll get a 16-character password)

**Step 3: Update .env file**
```ini
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SENDER_EMAIL=your-email@gmail.com
SENDER_NAME=BuildGuard-AI
FRONTEND_URL=http://localhost:5173
```

**Step 4: Test the configuration**
```bash
cd backend
python -c "
from core.email import EmailService
import asyncio
asyncio.run(EmailService.send_email(
    'test@example.com',
    'Test Email',
    '<h1>Test</h1>',
    'Test'
))
"
```

---

### 2. SendGrid (Recommended for Production)

**Step 1: Create SendGrid Account**
1. Sign up at https://sendgrid.com/
2. Create an account and verify your email

**Step 2: Create API Key**
1. Go to "Settings" → "API Keys"
2. Click "Create API Key"
3. Choose "Full Access" and create the key

**Step 3: Update .env file**

For SendGrid, we need to modify the email service. Use an SMTP relay:

```ini
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SENDER_EMAIL=noreply@yourdomain.com
SENDER_NAME=BuildGuard-AI
FRONTEND_URL=https://yourdomain.com
```

**Note:** SendGrid requires a verified sender address. Verify your domain or use `noreply@sendgrid.net` for testing.

---

### 3. AWS SES (Recommended for High Volume)

**Step 1: Set Up AWS SES**
1. Go to AWS Console → Simple Email Service
2. Request production access (moved out of sandbox)
3. Verify sender email address

**Step 2: Create SMTP Credentials**
1. In SES console, select "SMTP Settings"
2. Click "Create SMTP credentials"
3. Download the credentials

**Step 3: Update .env file**
```ini
SMTP_SERVER=email-smtp.{your-region}.amazonaws.com
SMTP_PORT=587
SMTP_USER=Your-SMTP-Username
SMTP_PASSWORD=Your-SMTP-Password
SENDER_EMAIL=verified-address@yourdomain.com
SENDER_NAME=BuildGuard-AI
FRONTEND_URL=https://yourdomain.com
```

---

## Email Endpoints

### Register User (Sends Verification Email)
```bash
curl -X POST "http://localhost:8001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "full_name": "John Doe",
    "password": "SecurePassword123!@#"
  }'
```

The user will receive an email with a verification link.

### Verify Email
```bash
curl -X POST "http://localhost:8001/api/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

### Request Password Reset (Sends Reset Email)
```bash
curl -X POST "http://localhost:8001/api/auth/request-password-reset" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### Resend Verification Email
```bash
curl -X POST "http://localhost:8001/api/auth/resend-verification-email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

## Email Templates

The system sends three types of emails:

### 1. Email Verification
- **When:** User registers
- **Link expiration:** 48 hours (configurable)
- **Content:** Verification link with call-to-action button

### 2. Password Reset
- **When:** User requests password reset
- **Link expiration:** 24 hours (configurable)
- **Content:** Reset link with security notice

### 3. Password Changed Notification
- **When:** Password is successfully changed
- **Content:** Confirmation notice with security reminder

---

## Troubleshooting

### Emails Not Sending

**Check logs:**
```logs
# Look for email service errors
ERROR: Failed to send email to user@example.com: ...
```

**Common issues:**

1. **"SMTP_SERVER not configured"**
   - Solution: Set SMTP_SERVER in .env
   - `SMTP_SERVER must start with "smtp."`

2. **"Authentication failed (535)"**
   - Gmail: App password is incorrect or not generated
   - SendGrid: API key is invalid
   - AWS SES: Credentials are wrong

3. **"Connection refused (111)"**
   - SMTP server is not reachable
   - Check firewall/network access to SMTP address
   - Verify SMTP_PORT (usually 587 or 25)

4. **"Sender not authorized (550)"**
   - SENDER_EMAIL not verified in email service
   - Gmail/SendGrid/SES requires sender verification

### Testing Email Service

Create a test script:

```python
import asyncio
from core.email import EmailService

async def test_email():
    success = await EmailService.send_email(
        to_email="your-email@example.com",
        subject="Test Email",
        html_content="<h1>Test</h1><p>This is a test email</p>",
        plain_text="This is a test email"
    )
    print(f"Email sent: {success}")

asyncio.run(test_email())
```

---

## Environment Variables Reference

```ini
# SMTP Server Configuration
SMTP_SERVER=smtp.gmail.com              # SMTP hostname
SMTP_PORT=587                           # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@gmail.com          # Email account or API key user
SMTP_PASSWORD=app-password              # App password or API key

# Sender Information
SENDER_EMAIL=noreply@yourdomain.com    # From email address (must be verified)
SENDER_NAME=BuildGuard-AI               # From name in emails

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173      # Where users click email links

# Token Expiration (optional - defaults shown)
EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS=48
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=24
```

---

## Security Best Practices

1. **Never commit secrets**: Keep passwords in .env (not in code)
2. **Use app-specific passwords**: Don't use main account passwords
3. **Verify sender domain**: Required for production
4. **HTTPS only**: Links in emails must be HTTPS in production
5. **Rate limiting**: Email endpoints have rate limits:
   - Register: 5/minute
   - Resend verification: 3/hour
   - Password reset: 5/hour
6. **Token expiration**: Tokens expire for security:
   - Email verification: 48 hours
   - Password reset: 24 hours

---

## Production Checklist

- [ ] Generate new SECRET_KEY
- [ ] Set ENVIRONMENT=production
- [ ] Configure SMTP (SendGrid/SES recommended)
- [ ] Verify sender email domain
- [ ] Update FRONTEND_URL to production domain
- [ ] Enable HTTPS
- [ ] Test email sending
- [ ] Monitor email bounces
- [ ] Set up email logging
- [ ] Configure backups for email logs

---

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review email service logs
3. Test with a simple email first
4. Verify all SMTP settings are correct
