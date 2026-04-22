#!/bin/bash

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:8000/api/health
echo ""
echo "---"

# Test sensor endpoint without auth (should fail with 403)
echo "Testing sensor endpoint (expecting 403 Unauthorized)..."
curl -s -X POST http://localhost:8000/api/sensor/predict \
  -H "Content-Type: application/json" \
  -d '{"accel_x":0.15,"accel_y":0.42,"accel_z":9.74,"strain":85,"temperature":24,"building_name":"Test","location":"Test"}' \
  -w "\nHTTP Status: %{http_code}\n"
echo ""
echo "---"

# Check if process is running
echo "Checking uvicorn process..."
ps aux | grep uvicorn | grep -v grep | head -1

# Check port usage
echo "Checking port 8000..."
lsof -i :8000 | grep -v COMMAND
