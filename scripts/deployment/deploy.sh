#!/bin/bash

################################################################################
# BuildGuard AI - Automated Deployment Script
# For DigitalOcean + Supabase Setup
#
# Usage: bash deploy.sh
# Or SSH: ssh root@167.71.228.217 'bash deploy.sh'
################################################################################

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="167.71.228.217"
PROJECT_PATH="/root/BuildGuard-AI"  # Change this if different
BACKEND_PORT="8006"
FRONTEND_PORT="5177"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   BuildGuard AI - Automated Deployment              ║${NC}"
echo -e "${BLUE}║   DigitalOcean + Supabase                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Pull latest code
echo -e "${YELLOW}Step 1: Pulling latest code from GitHub...${NC}"
cd "$PROJECT_PATH"
git pull origin main
echo -e "${GREEN}✓ Code pulled successfully${NC}"
echo ""

# Step 2: Update backend
echo -e "${YELLOW}Step 2: Updating backend...${NC}"
cd "$PROJECT_PATH/backend"

echo "  Installing dependencies..."
pip install -r requirements.txt -q

echo "  Running database migration..."
python migrate_user_id_to_string.py

echo -e "${GREEN}✓ Backend updated${NC}"
echo ""

# Step 3: Update frontend
echo -e "${YELLOW}Step 3: Building frontend...${NC}"
cd "$PROJECT_PATH/frontend"

echo "  Installing npm dependencies..."
npm install -q

echo "  Building for production..."
npm run build

echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 4: Check deployment method and restart services
echo -e "${YELLOW}Step 4: Restarting services...${NC}"

# Check if Docker is being used
if [ -f "$PROJECT_PATH/docker-compose.yml" ]; then
    echo "  Using Docker Compose..."
    cd "$PROJECT_PATH"
    docker-compose down
    docker-compose up -d
    echo -e "${GREEN}✓ Docker services restarted${NC}"
    
    # Wait for services to be ready
    sleep 5
    
    echo "  Checking if services are running..."
    docker-compose ps
    
elif systemctl list-units --all | grep -q buildguard; then
    echo "  Using systemd services..."
    
    # Restart backend
    if systemctl is-active --quiet buildguard-backend; then
        sudo systemctl restart buildguard-backend
        echo "  ✓ Backend restarted"
    fi
    
    # Restart frontend
    if systemctl is-active --quiet buildguard-frontend; then
        sudo systemctl restart buildguard-frontend
        echo "  ✓ Frontend restarted"
    fi
    
    # Restart nginx
    sudo systemctl restart nginx
    echo "  ✓ Nginx restarted"
    echo -e "${GREEN}✓ All services restarted${NC}"
    
else
    echo -e "${YELLOW}  Could not detect service manager${NC}"
    echo "  Manual steps required:"
    echo "    1. SSH into server: ssh root@$SERVER_IP"
    echo "    2. cd $PROJECT_PATH"
    echo "    3. Restart your services (Docker or systemd)"
fi

echo ""

# Step 5: Verify deployment
echo -e "${YELLOW}Step 5: Verifying deployment...${NC}"

# Wait for services to be ready
sleep 3

# Check backend
echo "  Checking backend health..."
if curl -s -f http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Backend is running${NC}"
else
    echo -e "  ${RED}✗ Backend health check failed${NC}"
    echo "    Check logs: docker logs buildguard-backend"
fi

# Check database connection
echo "  Checking database..."
RESPONSE=$(curl -s "http://localhost:$BACKEND_PORT/api/dashboard/stats?user_id=test" || echo "failed")
if echo "$RESPONSE" | grep -q "user_id"; then
    echo -e "  ${GREEN}✓ Database connected${NC}"
else
    echo -e "  ${RED}✗ Database connection failed${NC}"
    echo "    Check database connection string in your environment"
fi

# Check frontend
echo "  Checking frontend..."
if [ -d "$PROJECT_PATH/frontend/dist" ]; then
    echo -e "  ${GREEN}✓ Frontend built${NC}"
else
    echo -e "  ${RED}✗ Frontend build not found${NC}"
fi

echo ""

# Step 6: Summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Deployment Complete!                             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Summary:"
echo "  Server: $SERVER_IP"
echo "  Project: $PROJECT_PATH"
echo "  Backend: http://localhost:$BACKEND_PORT"
echo "  Frontend: Deployed via nginx"
echo "  Database: Supabase"
echo ""

echo "Next steps:"
echo "  1. Check website: https://build-guard.app"
echo "  2. Verify user isolation works (test with 2 browsers)"
echo "  3. Monitor logs: docker logs -f buildguard-backend"
echo "  4. Check SSL: https://www.ssllabs.com/ssltest/analyze.html?d=build-guard.app"
echo ""

echo -e "${BLUE}For help or issues, check the DEPLOYMENT_CHECKLIST.md${NC}"
