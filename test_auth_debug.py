#!/usr/bin/env python3
"""
Debug authentication system
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8001/api/auth"

print("=" * 60)
print("BuildGuard AI - Authentication Debug Test")
print("=" * 60)
print()

# Generate unique email
timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
test_email = f"test_user_{timestamp}@example.com"
test_password = "SecurePassword123!"

print(f"Test Email: {test_email}")
print(f"Test Password: {test_password}")
print()

# Step 1: Register
print("Step 1: REGISTRATION")
print("-" * 40)
reg_data = {
    "email": test_email,
    "password": test_password,
    "full_name": "Debug Test User"
}

try:
    reg_resp = requests.post(f"{BASE_URL}/register", json=reg_data, timeout=5)
    print(f"Status: {reg_resp.status_code}")
    reg_content = reg_resp.json()
    print(f"Response: {json.dumps(reg_content, indent=2)}")
    print("✓ Registration successful")
except Exception as e:
    print(f"✗ Registration failed: {e}")
    exit(1)

print()

# Step 2: Login
print("Step 2: LOGIN")
print("-" * 40)
login_data = {
    "email": test_email,
    "password": test_password
}

try:
    login_resp = requests.post(f"{BASE_URL}/login", json=login_data, timeout=5)
    print(f"Status: {login_resp.status_code}")
    login_content = login_resp.json()
    print(f"Full Response:")
    print(json.dumps(login_content, indent=2))
    
    token = login_content.get("access_token")
    if token:
        print(f"✓ Token received (length: {len(token)})")
        print(f"Token preview: {token[:50]}...")
    else:
        print("✗ No token in response")
        exit(1)
except Exception as e:
    print(f"✗ Login failed: {e}")
    exit(1)

print()

# Step 3: Test Protected Endpoint
print("Step 3: PROTECTED ENDPOINT (GET /me)")
print("-" * 40)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

print(f"Headers: {headers}")
print()

try:
    me_resp = requests.get(f"{BASE_URL}/me", headers=headers, timeout=5)
    print(f"Status: {me_resp.status_code}")
    print(f"Response: {json.dumps(me_resp.json(), indent=2)}")
    
    if me_resp.status_code == 200:
        print("✓ Protected endpoint accessible")
    else:
        print(f"✗ Protected endpoint returned {me_resp.status_code}")
        print("Debug Info:")
        print(f"  Response text: {me_resp.text}")
        
except Exception as e:
    print(f"✗ Request failed: {e}")

print()
print("=" * 60)
print("Test Complete")
print("=" * 60)
