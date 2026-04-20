#!/bin/bash
# Backend startup script with environment variable loading
# This script loads environment variables and starts the backend

set -e

cd /var/www/BuildGuard-AI/backend

# Load environment variables from .env file
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Display environment for debugging (safely - no passwords)
echo "Backend starting with environment:"
echo "  DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "  SECRET_KEY: ${SECRET_KEY:0:20}..."
echo ""

# Start the uvicorn server
exec /var/www/BuildGuard-AI/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
