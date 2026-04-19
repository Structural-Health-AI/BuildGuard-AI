# BuildGuard-AI API Documentation

## Base URL

- **Development**: `http://localhost:8000/api`
- **Production**: `https://www.build-guard.app/api`

## Authentication

All endpoints except `/health`, `/auth/register`, and `/auth/login` require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens expire after **30 minutes** and must be refreshed or re-login.

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Create a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_verified": false,
  "created_at": "2026-04-19T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Email already exists
- `422 Unprocessable Entity`: Invalid email format or weak password

---

### Login

**POST** `/auth/login`

Authenticate and receive a JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "inspector"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid email or password
- `403 Forbidden`: Email not verified

---

### Verify Email

**POST** `/auth/verify-email`

Verify email address with verification code.

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "message": "Email verified successfully",
  "user": { /* user object */ }
}
```

---

### Forgot Password

**POST** `/auth/forgot-password`

Request password reset via email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset email sent"
}
```

---

### Reset Password

**POST** `/auth/reset-password`

Reset password with reset token.

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "new_password": "NewSecurePassword456!"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset successfully"
}
```

---

## System Endpoints

### Health Check

**GET** `/health`

Check API health status (no authentication required).

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2026-04-19T10:30:00Z",
  "version": "1.0.0"
}
```

---

## Image Analysis Endpoints

### Upload & Analyze Image

**POST** `/images/upload`

Upload an image for damage detection analysis.

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**Form Data**:
- `file`: Image file (JPG, PNG; max 5MB)
- `report_id`: (optional) Associated report ID

**Response** (200 OK):
```json
{
  "id": "uuid",
  "filename": "damage_photo_001.jpg",
  "damage_detected": true,
  "confidence": 0.92,
  "class": "damaged",
  "analyzed_at": "2026-04-19T10:35:00Z",
  "details": {
    "crack_severity": "moderate",
    "affected_area_percentage": 15.3
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid file format or size too large
- `401 Unauthorized`: Invalid or expired token
- `500 Internal Server Error`: Model inference failed

---

### Get Image Analysis History

**GET** `/images/history`

Retrieve previous image analysis results.

**Query Parameters**:
- `limit`: Number of results (default: 10, max: 100)
- `offset`: Pagination offset (default: 0)
- `report_id`: Filter by report (optional)

**Response** (200 OK):
```json
{
  "total": 42,
  "limit": 10,
  "offset": 0,
  "results": [
    {
      "id": "uuid",
      "filename": "damage_photo_001.jpg",
      "damage_detected": true,
      "confidence": 0.92,
      "analyzed_at": "2026-04-19T10:35:00Z"
    }
  ]
}
```

---

## Sensor Data Endpoints

### Analyze Sensor Data

**POST** `/sensors/analyze`

Analyze structural sensor readings.

**Request Body**:
```json
{
  "sensor_type": "accelerometer",
  "readings": [
    {
      "value": 0.45,
      "unit": "g",
      "timestamp": "2026-04-19T10:30:00Z"
    },
    {
      "value": 0.48,
      "unit": "g",
      "timestamp": "2026-04-19T10:31:00Z"
    }
  ],
  "report_id": "uuid"
}
```

**Response** (200 OK):
```json
{
  "report_id": "uuid",
  "sensor_type": "accelerometer",
  "status": "normal",
  "analysis": {
    "mean": 0.46,
    "std_dev": 0.015,
    "peak_value": 0.52,
    "anomaly_detected": false
  },
  "recommendations": [
    "Continue routine monitoring"
  ]
}
```

---

## Report Endpoints

### Create Report

**POST** `/reports`

Create a new inspection report.

**Request Body**:
```json
{
  "title": "Building A - Quarterly Inspection",
  "description": "Regular health monitoring inspection",
  "location": "123 Main St, City, State",
  "building_type": "residential"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Building A - Quarterly Inspection",
  "description": "Regular health monitoring inspection",
  "location": "123 Main St, City, State",
  "status": "draft",
  "created_at": "2026-04-19T10:30:00Z",
  "updated_at": "2026-04-19T10:30:00Z"
}
```

---

### Get All Reports

**GET** `/reports`

Retrieve user's inspection reports.

**Query Parameters**:
- `status`: Filter by status (draft, submitted, reviewed)
- `limit`: Results per page (default: 20, max: 100)
- `offset`: Pagination offset

**Response** (200 OK):
```json
{
  "total": 15,
  "results": [
    {
      "id": "uuid",
      "title": "Building A - Quarterly Inspection",
      "status": "submitted",
      "created_at": "2026-04-19T10:30:00Z",
      "image_count": 5,
      "sensor_reading_count": 12
    }
  ]
}
```

---

### Get Report Details

**GET** `/reports/{id}`

Get full report with all analyses.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "title": "Building A - Quarterly Inspection",
  "description": "...",
  "location": "...",
  "status": "submitted",
  "created_at": "2026-04-19T10:30:00Z",
  "images": [
    {
      "id": "uuid",
      "filename": "...",
      "damage_detected": true,
      "confidence": 0.92
    }
  ],
  "sensors": [
    {
      "id": "uuid",
      "sensor_type": "accelerometer",
      "status": "normal"
    }
  ]
}
```

---

### Update Report

**PUT** `/reports/{id}`

Update report details.

**Request Body**:
```json
{
  "title": "Updated Title",
  "status": "submitted"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "status": "submitted",
  "updated_at": "2026-04-19T10:40:00Z"
}
```

---

### Delete Report

**DELETE** `/reports/{id}`

Delete a report (draft status only).

**Response** (204 No Content)

**Error Responses**:
- `403 Forbidden`: Can only delete draft reports
- `404 Not Found`: Report not found

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error description",
  "status_code": 400,
  "error_code": "VALIDATION_ERROR"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_CREDENTIALS | 401 | Email/password incorrect |
| TOKEN_EXPIRED | 401 | JWT token expired |
| UNAUTHORIZED | 403 | Missing or invalid authorization |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 422 | Invalid request data |
| RATE_LIMIT | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting

- **Auth endpoints**: 5 requests per minute per IP
- **Upload endpoints**: 10 requests per minute per user
- **Other endpoints**: 100 requests per minute per user

---

## Pagination

List endpoints support pagination with:
- `limit`: Items per page (default: 20)
- `offset`: Starting position (default: 0)

Example: `/reports?limit=10&offset=20`

---

## Timestamps

All timestamps are in ISO 8601 format with UTC timezone:
```
2026-04-19T10:30:00Z
```

---

**API Version**: 1.0.0  
**Last Updated**: April 2026  
**Status**: Production Ready
