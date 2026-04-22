#!/bin/bash

################################################################################
# BuildGuard AI - Deployment Script for DigitalOcean (Systemd + Nginx)
# Project path: /var/www/BuildGuard-AI
# Backend: systemd service on port 8000
# Frontend: nginx
################################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_PATH="/var/www/BuildGuard-AI"
VENV_PATH="$PROJECT_PATH/backend/venv"
BACKEND_PORT="8000"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   BuildGuard AI - Systemd Deployment                  ║${NC}"
echo -e "${BLUE}║   DigitalOcean + Nginx + Supabase                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Install systemd service file
echo -e "${YELLOW}Step 1: Installing systemd service file...${NC}"
if [ -f "$PROJECT_PATH/scripts/deployment/buildguard.service" ]; then
    cp "$PROJECT_PATH/scripts/deployment/buildguard.service" /etc/systemd/system/buildguard.service
    systemctl daemon-reload
    systemctl enable buildguard.service
    echo -e "${GREEN}✓ Service file installed${NC}"
else
    echo -e "${RED}✗ Service file not found at $PROJECT_PATH/scripts/deployment/buildguard.service${NC}"
    exit 1
fi
echo ""

# Step 2: Pull latest code
echo -e "${YELLOW}Step 2: Pulling latest code from GitHub...${NC}"
cd "$PROJECT_PATH"
git pull origin main
echo -e "${GREEN}✓ Code pulled successfully${NC}"
echo ""

# Step 3: Activate virtualenv and update backend
echo -e "${YELLOW}Step 2: Updating backend...${NC}"
cd "$PROJECT_PATH/backend"

# Activate virtualenv
source "$VENV_PATH/bin/activate"

echo "  Installing dependencies..."
pip install -r requirements.txt -q

echo "  Running database migration..."
python migrate_user_id_to_string.py

# Deactivate virtualenv
deactivate

echo -e "${GREEN}✓ Backend updated${NC}"
echo ""

# Step 4: Update frontend
echo -e "${YELLOW}Step 4: Building frontend...${NC}"
cd "$PROJECT_PATH/frontend"

echo "  Installing npm dependencies..."
npm install -q

echo "  Building for production..."
npm run build

echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 5: Stop backend service
echo -e "${YELLOW}Step 5: Stopping backend service...${NC}"
systemctl stop buildguard.service || true
sleep 2
echo -e "${GREEN}✓ Backend stopped${NC}"
echo ""

# Step 6: Start backend service
echo -e "${YELLOW}Step 6: Starting backend service...${NC}"
systemctl start buildguard.service
sleep 3

# Check if service is active
if systemctl is-active --quiet buildguard.service; then
    echo -e "${GREEN}✓ Backend service started${NC}"
else
    echo -e "${RED}✗ Backend service failed to start${NC}"
    echo "  Check logs: journalctl -u buildguard.service -n 50"
    exit 1
fi
echo ""

# Step 7: Reload nginx
echo -e "${YELLOW}Step 7: Reloading nginx...${NC}"
nginx -t
systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

# Step 8: Verify deployment
echo -e "${YELLOW}Step 8: Verifying deployment...${NC}"

sleep 2

# Check backend health
echo "  Checking backend health..."
if curl -s -f http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Backend is running on port $BACKEND_PORT${NC}"
else
    echo -e "  ${RED}✗ Backend health check failed${NC}"
    echo "  Checking service status..."
    systemctl status buildguard.service
    exit 1
fi

# Check database connection
echo "  Checking database connection..."
RESPONSE=$(curl -s "http://localhost:$BACKEND_PORT/api/dashboard/stats?user_id=test" || echo "failed")
if echo "$RESPONSE" | grep -q "user_id"; then
    echo -e "  ${GREEN}✓ Database connected and API working${NC}"
else
    echo -e "  ${RED}✗ API test failed${NC}"
    echo "  Response: $RESPONSE"
    exit 1
fi

# Check frontend
echo "  Checking frontend..."
if [ -d "$PROJECT_PATH/frontend/dist" ]; then
    echo -e "  ${GREEN}✓ Frontend build exists${NC}"
else
    echo -e "  ${RED}✗ Frontend build not found${NC}"
    exit 1
fi

echo ""

# Step 9: Summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Deployment Complete!                             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Summary:"
echo "  Project path: $PROJECT_PATH"
echo "  Backend service: buildguard.service (port $BACKEND_PORT)"
echo "  Frontend: nginx"
echo "  Database: Supabase"
echo ""

echo "Service commands:"
echo "  Check status:     systemctl status buildguard.service"
echo "  View logs:        journalctl -u buildguard.service -f"
echo "  Stop service:     systemctl stop buildguard.service"
echo "  Start service:    systemctl start buildguard.service"
echo "  Restart service:  systemctl restart buildguard.service"
echo ""

echo "Next steps:"
echo "  1. Visit: https://build-guard.app"
echo "  2. Test user isolation (2 browsers with different data)"
echo "  3. Monitor: journalctl -u buildguard.service -f"
echo "  4. Check SSL: https://www.ssllabs.com/ssltest/analyze.html?d=build-guard.app"
echo ""

echo -e "${BLUE}Deployment completed successfully!${NC}"
