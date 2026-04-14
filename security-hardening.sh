#!/bin/bash
# BuildGuard-AI Server Security Hardening Script
# This script enables firewall, sets up security headers, and hardens the server

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║  BuildGuard-AI Security Hardening Script          ║"
echo "║  Run this on your Ubuntu server as root           ║"
echo "╚════════════════════════════════════════════════════╝"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

echo -e "\n${YELLOW}Step 1: Enabling UFW Firewall${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp       # SSH
ufw allow 80/tcp       # HTTP
ufw allow 443/tcp      # HTTPS
ufw status
echo -e "${GREEN}✓ Firewall enabled${NC}"

echo -e "\n${YELLOW}Step 2: Setting up fail2ban for brute force protection${NC}"
apt-get update -qq
apt-get install -y fail2ban > /dev/null 2>&1

# Configure fail2ban for SSH
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s

[recidive]
enabled = true
EOF

systemctl restart fail2ban
echo -e "${GREEN}✓ fail2ban configured${NC}"

echo -e "\n${YELLOW}Step 3: Disabling unnecessary services${NC}"
# List of services to disable
services_to_disable=(
    "bluetooth"
    "avahi-daemon"
)

for service in "${services_to_disable[@]}"; do
    if systemctl is-enabled $service &>/dev/null; then
        systemctl disable $service
        systemctl stop $service
        echo -e "${GREEN}✓ Disabled $service${NC}"
    fi
done

echo -e "\n${YELLOW}Step 4: Setting up automatic security updates${NC}"
apt-get install -y unattended-upgrades apt-listchanges > /dev/null 2>&1

cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
EOF

echo -e "${GREEN}✓ Automatic updates configured${NC}"

echo -e "\n${YELLOW}Step 5: Hardening SSH${NC}"
# Backup original sshd_config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Update SSH configuration
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Verify SSH config
sshd -t && systemctl restart ssh
echo -e "${GREEN}✓ SSH hardened${NC}"

echo -e "\n${YELLOW}Step 6: Enabling kernel hardening${NC}"
cat >> /etc/sysctl.conf << 'EOF'

# IP forwarding - disable
net.ipv4.ip_forward = 0

# Ignore ICMP ping requests
net.ipv4.icmp_echo_ignore_all = 0

# Ignore directed pings
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Accept source routing
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Log Martians
net.ipv4.conf.all.log_martians = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Enable SYN cookies for SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5
EOF

sysctl -p > /dev/null
echo -e "${GREEN}✓ Kernel hardened${NC}"

echo -e "\n${YELLOW}Step 7: Setting file permissions${NC}"
# Restrict access to sensitive files
chmod 700 /root
chmod 600 /etc/ssh/sshd_config
chmod 644 /etc/passwd
chmod 000 /etc/shadow
echo -e "${GREEN}✓ File permissions hardened${NC}"

echo -e "\n${YELLOW}Step 8: Setting up log rotation${NC}"
cat > /etc/logrotate.d/buildguard << 'EOF'
/var/www/BuildGuard-AI/backend/logs/*.log {
    daily
    rotate 7
    missingok
    notifempty
    compress
    delaycompress
    copytruncate
}
EOF
echo -e "${GREEN}✓ Log rotation configured${NC}"

echo -e "\n${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Security Hardening Complete!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}Summary:${NC}"
echo "✓ UFW Firewall enabled and configured"
echo "✓ fail2ban installed for SSH brute force protection"
echo "✓ Unnecessary services disabled"
echo "✓ Automatic security updates enabled"
echo "✓ SSH hardened (root login disabled, key-only auth)"
echo "✓ Kernel parameters hardened"
echo "✓ File permissions restricted"
echo "✓ Log rotation configured"

echo -e "\n${YELLOW}Recommended Next Steps:${NC}"
echo "1. Verify firewall: sudo ufw status"
echo "2. Check fail2ban: sudo fail2ban-client status"
echo "3. Monitor logs: sudo journalctl -u buildguard -f"
echo "4. Review SSH access: sudo ss -tulpn | grep :22"

echo -e "\n${YELLOW}Security Notes:${NC}"
echo "• Keep SSH private key in a secure location"
echo "• Regularly backup your SSL certificates"
echo "• Monitor system logs for suspicious activity"
echo "• Update dependencies regularly: pip install --upgrade -r requirements.txt"
echo "• Review and rotate the SECRET_KEY periodically"
