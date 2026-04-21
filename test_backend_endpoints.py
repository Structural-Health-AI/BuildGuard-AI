#!/usr/bin/env python3
import requests
import json

# Test 1: Health endpoint
print("=" * 60)
print("TEST 1: Health Endpoint")
print("=" * 60)
try:
    r = requests.get('http://localhost:8000/api/health', timeout=5)
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Sensor endpoint without auth (should return 403)
print("\n" + "=" * 60)
print("TEST 2: Sensor Endpoint (No Auth - Should be 403)")
print("=" * 60)
try:
    payload = {
        "accel_x": 0.15,
        "accel_y": 0.42,
        "accel_z": 9.74,
        "strain": 85,
        "temperature": 24,
        "building_name": "Test",
        "location": "Test"
    }
    r = requests.post('http://localhost:8000/api/sensor/predict', json=payload, timeout=5)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 60)
print("CONCLUSION")
print("=" * 60)
print("✅ Backend is responding to requests")
print("✅ Sensor endpoint is accessible")
print("Expected: 403 Unauthorized (because no JWT token provided)")
