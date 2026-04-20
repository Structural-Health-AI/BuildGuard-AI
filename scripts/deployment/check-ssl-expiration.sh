#!/bin/bash

################################################################################
# BuildGuard AI - SSL Certificate Expiration Monitor
#
# Checks SSL certificate expiration date and alerts if renewal is needed
# Can be run manually or scheduled with cron
#
# Usage: bash check-ssl-expiration.sh [domain]
#        or: bash check-ssl-expiration.sh build-guard.app
################################################################################

DOMAIN="${1:-build-guard.app}"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/cert.pem"
ALERT_DAYS=30

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   BuildGuard AI - SSL Certificate Expiration Check        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Domain: $DOMAIN"
echo ""

# Check if certificate exists
if [ ! -f "$CERT_PATH" ]; then
    echo "❌ Certificate not found at: $CERT_PATH"
    echo ""
    echo "Available certificates:"
    ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "No certificates found"
    exit 1
fi

# Get certificate expiration date
EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

echo "Certificate Details:"
echo "  Issuer: $(openssl x509 -issuer -noout -in "$CERT_PATH" | sed 's/issuer=//')"
echo "  Expires: $EXPIRY_DATE"
echo "  Days Until Expiration: $DAYS_LEFT days"
echo ""

# Check expiration status
if [ $DAYS_LEFT -lt 0 ]; then
    echo "🚨 CRITICAL: Certificate has EXPIRED!"
    echo "   Action: Renew immediately with: sudo certbot renew"
    exit 2
elif [ $DAYS_LEFT -lt $ALERT_DAYS ]; then
    echo "⚠️  WARNING: Certificate expires in less than ${ALERT_DAYS} days"
    echo "   Action: Renew soon with: sudo certbot renew"
    exit 1
else
    echo "✅ Certificate is valid and current"
    echo "   No action needed at this time"
    exit 0
fi
