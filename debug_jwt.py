#!/usr/bin/env python3
"""
Debug JWT token verification
"""

import jwt
import json
from datetime import datetime, timezone, timedelta

# Token from the test
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsImV4cCI6MTc3NTk0MjU3NiwiaWF0IjoxNzc1OTQwNzc2LCJ0eXBlIjoiYWNjZXNzIn0.LWGWVWH5lazK3r8fOyJiQuKPho66AvpqhZLhClJd9q0"

secret_key = "your-super-secret-key-change-in-production"
algorithm = "HS256"

print("=" * 60)
print("JWT Token Verification Debug")
print("=" * 60)
print()

# Decode without verification first
print("Decoding token WITHOUT verification:")
unverified = jwt.decode(token, options={"verify_signature": False})
print(json.dumps(unverified, indent=2))
print()

# Check timestamps
exp_timestamp = unverified.get("exp")
iat_timestamp = unverified.get("iat")
token_type = unverified.get("type")

exp_dt = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
iat_dt = datetime.fromtimestamp(iat_timestamp, tz=timezone.utc)
now = datetime.now(timezone.utc)

print(f"Token Created At: {iat_dt}")
print(f"Token Expires At: {exp_dt}")
print(f"Current Time:     {now}")
print(f"Token Type:       {token_type}")
print()

# Check if expired
if now > exp_dt:
    print("⚠ Token is EXPIRED")
else:
    print(f"✓ Token is valid (expires in {(exp_dt - now).total_seconds()} seconds)")
print()

# Try to verify
print("Verifying token with secret key:")
try:
    verified = jwt.decode(token, secret_key, algorithms=[algorithm])
    print("✓ Token verification successful")
    print(json.dumps(verified, indent=2))
except jwt.InvalidTokenError as e:
    print(f"✗ Token verification failed: {e}")
except Exception as e:
    print(f"✗ Unexpected error: {e}")

print()
print("=" * 60)
