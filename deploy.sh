#!/bin/bash

###############################################################################
# BuildGuard-AI Automated Deployment Script
# Platform: DigitalOcean Ubuntu 24.04 LTS
# Usage: sudo bash deploy.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "This script must be run as root (use: sudo bash deploy.sh)"
    exit 1
fi

###############################################################################
# Step 1: Update System
###############################################################################
print_status "Step 1/8: Updating system packages..."

apt update
apt upgrade -y

print_success "System updated"

###############################################################################
# Step 2: Install System Dependencies
###############################################################################
print_status "Step 2/8: Installing system dependencies..."

apt install -y \
    python3.12 \
    python3.12-venv \
    python3-pip \
    nodejs \
    npm \
    postgresql \
    postgresql-contrib \
    nginx \
    git \
    curl \
    wget \
    build-essential \
    libpq-dev \
    htop \
    net-tools

print_success "System dependencies installed"

###############################################################################
# Step 3: Start PostgreSQL
###############################################################################
print_status "Step 3/8: Setting up PostgreSQL..."

systemctl start postgresql
systemctl enable postgresql

# Create database and user
print_status "Creating PostgreSQL user and database..."
sudo -u postgres psql << EOF
DROP USER IF EXISTS buildguard_user;
CREATE USER buildguard_user WITH PASSWORD 'buildguard_secure_2024';
CREATE DATABASE buildguard_db OWNER buildguard_user;
GRANT ALL PRIVILEGES ON DATABASE buildguard_db TO buildguard_user;
ALTER DATABASE buildguard_db OWNER TO buildguard_user;
EOF

print_success "PostgreSQL configured"

###############################################################################
# Step 4: Setup Backend
###############################################################################
print_status "Step 4/8: Setting up Python backend..."

# Determine project directory (script must run from repo root)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "$PROJECT_DIR/backend/main.py" ]; then
    print_error "backend/main.py not found in $PROJECT_DIR"
    print_error "Please run this script from the BuildGuard-AI directory:"
    print_error "  cd /path/to/BuildGuard-AI && sudo bash deploy.sh"
    exit 1
fi

print_status "Project directory: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
pip install -r backend/requirements.txt
pip install gunicorn psycopg2-binary

print_success "Backend dependencies installed"

###############################################################################
# Step 5: Configure Environment
###############################################################################
print_status "Step 5/8: Configuring environment variables..."

# Generate secret key
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Create .env file
cat > backend/.env << EOF
# Database
DATABASE_URL=postgresql://buildguard_user:buildguard_secure_2024@localhost:5432/buildguard_db

# Server
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=8000

# Security
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=["http://localhost","http://127.0.0.1"]

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=5
RATE_LIMIT_PERIOD=900

# Application
APP_NAME=BuildGuard-AI
MAX_UPLOAD_SIZE=104857600
MODEL_PATH=./saved_models/

# Logging
LOG_LEVEL=INFO
EOF

print_success ".env file created"

###############################################################################
# Step 6: Build Frontend
###############################################################################
print_status "Step 6/8: Building React frontend..."

cd "$PROJECT_DIR/frontend"
npm install
npm run build

print_success "Frontend built successfully"

###############################################################################
# Step 7: Setup Nginx
###############################################################################
print_status "Step 7/8: Configuring Nginx..."

# Remove default config
rm -f /etc/nginx/sites-enabled/default

# Copy nginx config
cp "$PROJECT_DIR/buildguard-nginx.conf" /etc/nginx/sites-available/buildguard
ln -sf /etc/nginx/sites-available/buildguard /etc/nginx/sites-enabled/buildguard

# Test Nginx config
if nginx -t; then
    print_success "Nginx configuration valid"
    systemctl restart nginx
    systemctl enable nginx
    print_success "Nginx started and enabled"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

###############################################################################
# Step 8: Setup Backend Service
###############################################################################
print_status "Step 8/8: Setting up backend service..."

# Create log directory
mkdir -p /var/log/buildguard
chmod 755 /var/log/buildguard

# Create systemd service with correct paths
cat > /etc/systemd/system/buildguard-backend.service << SVCEOF
[Unit]
Description=BuildGuard-AI Backend (FastAPI + Gunicorn)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=notify
User=root
WorkingDirectory=$PROJECT_DIR/backend
Environment="PATH=$PROJECT_DIR/venv/bin"
EnvironmentFile=$PROJECT_DIR/backend/.env

ExecStart=$PROJECT_DIR/venv/bin/gunicorn \\
    --workers 2 \\
    --worker-class uvicorn.workers.UvicornWorker \\
    --bind 127.0.0.1:8000 \\
    --timeout 60 \\
    --access-logfile /var/log/buildguard/access.log \\
    --error-logfile /var/log/buildguard/error.log \\
    main:app

Restart=always
RestartSec=10
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
SVCEOF

# Enable and start service
systemctl daemon-reload
systemctl enable buildguard-backend.service
systemctl start buildguard-backend.service

# Check service status
sleep 2
if systemctl is-active --quiet buildguard-backend.service; then
    print_success "Backend service started successfully"
else
    print_error "Backend service failed to start"
    print_status "Checking logs:"
    journalctl -u buildguard-backend.service -n 20
    exit 1
fi

###############################################################################
# Verification
###############################################################################
print_status "Verifying deployment..."

# Check backend health
sleep 2
if curl -s http://localhost:8000/health > /dev/null; then
    print_success "Backend is responding"
else
    print_warning "Backend health check failed (service might still be starting)"
fi

# Check frontend
if [ -f "$PROJECT_DIR/frontend/dist/index.html" ]; then
    print_success "Frontend build verified"
else
    print_error "Frontend build not found"
    exit 1
fi

# Check PostgreSQL
if psql -U buildguard_user -d buildguard_db -c "SELECT 1;" 2>/dev/null; then
    print_success "PostgreSQL connection verified"
else
    print_error "PostgreSQL connection failed"
    exit 1
fi

###############################################################################
# Summary
###############################################################################
clear
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        ✓ BuildGuard-AI Deployment Complete! 🎉              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "  ✓ System packages updated"
echo "  ✓ Python 3.12 environment with pip"
echo "  ✓ Node.js and npm installed"
echo "  ✓ PostgreSQL database configured"
echo "  ✓ Backend (FastAPI) installed and running"
echo "  ✓ Frontend (React) built"
echo "  ✓ Nginx configured as reverse proxy"
echo "  ✓ Backend systemd service created"
echo ""
echo -e "${BLUE}🚀 Your application is ready!${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Update these values in backend/.env:${NC}"
echo "  • ALLOWED_ORIGINS: Add your domain/IP"
echo "  • DATABASE_URL: Update password if needed"
echo "  • EMAIL settings: For password reset functionality"
echo ""
echo -e "${BLUE}📍 Access your application:${NC}"
echo "  URL: http://$(hostname -I | awk '{print $1}')"
echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo "  tail -f /var/log/buildguard/access.log     # View backend logs"
echo "  systemctl status buildguard-backend.service # Check service status"
echo "  journalctl -u buildguard-backend.service -f # Follow service logs"
echo "  systemctl restart buildguard-backend.service # Restart backend"
echo "  curl http://localhost/health               # Check health"
echo ""
echo -e "${BLUE}🔒 Next Steps:${NC}"
echo "  1. Update .env file with your settings"
echo "  2. Set up SSL/HTTPS with Let's Encrypt"
echo "  3. Configure a domain name"
echo "  4. Test all features thoroughly"
echo ""
echo -e "${GREEN}Deployment successful!${NC} 🎊"
echo ""
