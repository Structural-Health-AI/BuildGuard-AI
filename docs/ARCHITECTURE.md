# BuildGuard-AI Architecture

## System Overview

BuildGuard-AI is a full-stack web application for structural health monitoring and damage detection. The system comprises three main layers:

```
┌─────────────────────────────────────────────────────────┐
│            Frontend (React + Vite)                      │
│  - Dashboard, Login, Report Views                       │
│  - Real-time data visualization                         │
│  - User authentication flows                            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS / REST API
┌────────────────────▼────────────────────────────────────┐
│           Backend (FastAPI + Python)                    │
│  - Authentication & Authorization (JWT)                │
│  - Data processing & ML inference                       │
│  - Report generation                                    │
│  - Database operations                                  │
└────────────────────┬────────────────────────────────────┘
                     │ SQL
┌────────────────────▼────────────────────────────────────┐
│         Database (PostgreSQL - Supabase)                │
│  - User data, reports, sensor readings                  │
│  - Connection pooling for performance                   │
└─────────────────────────────────────────────────────────┘
```

## Backend Architecture

### Technology Stack
- **Framework**: FastAPI (async, modern Python)
- **Database**: PostgreSQL with Supabase (connection pooling)
- **Authentication**: JWT tokens with 30-min expiration
- **ML Libraries**: PyTorch (inference), scikit-learn (preprocessing)
- **Server**: Uvicorn (production with Gunicorn)

### Core Modules

```
backend/
├── main.py                 # FastAPI app, middleware setup, CORS
├── database.py             # SQLAlchemy ORM, session management
├── core/
│   ├── config.py          # Environment config, settings validation
│   ├── security.py        # JWT, password hashing (bcrypt)
│   └── email.py           # Email notifications
├── api/
│   ├── auth_routes.py     # /auth endpoints (login, register, verify)
│   ├── image_routes.py    # /images endpoints (upload, analyze)
│   ├── sensor_routes.py   # /sensors endpoints (analysis)
│   ├── report_routes.py   # /reports endpoints (CRUD)
│   └── dependencies.py    # JWT dependency, authorization
├── models/
│   ├── image_model.py     # PyTorch damage detector inference
│   └── sensor_model.py    # Sensor data classifier
└── schemas/               # Pydantic request/response schemas
```

### API Flow Example

**Image Upload & Analysis**:
1. User uploads image via `/api/images/upload`
2. FastAPI validates file type & size
3. Image saved temporarily to backend
4. PyTorch model runs inference (GPU if available)
5. Results returned with confidence scores
6. Data stored in PostgreSQL

### Security Implementation

- **CORS**: Configured for production domains only
- **HTTPS**: Enforced in production
- **JWT**: Tokens expire after 30 minutes
- **Passwords**: Hashed with bcrypt (12 salt rounds)
- **SQL Injection**: Prevented via Pydantic + SQLAlchemy ORM
- **Rate Limiting**: Applied to auth endpoints
- **Secrets**: Stored in environment variables, never committed

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 with Vite (fast bundling)
- **Styling**: TailwindCSS (utility-first CSS)
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **Build**: Vite (ES modules, optimized output)

### Component Structure

```
src/
├── pages/
│   ├── LoginPage.jsx           # Login form
│   ├── RegisterPage.jsx        # Registration flow
│   ├── VerifyEmailPage.jsx     # Email verification
│   ├── ForgotPasswordPage.jsx  # Password recovery
│   ├── ResetPasswordPage.jsx   # Reset password
│   └── Dashboard.jsx           # Main dashboard
├── components/
│   ├── ProtectedRoute.jsx      # JWT auth guard
│   ├── ImageUpload.jsx         # Image upload form
│   ├── SensorInput.jsx         # Sensor data input
│   ├── ReportList.jsx          # Report listing
│   ├── ReportForm.jsx          # Report creation
│   └── ui/                     # Reusable UI components
│       ├── Toast.jsx
│       ├── ConfirmModal.jsx
│       └── SkeletonLoader.jsx
├── services/
│   └── authService.js          # API calls for auth
├── context/
│   └── AuthContext.jsx         # Auth state management
├── utils/
│   └── sessionManager.js       # Session & token handling
└── api/
    └── index.js                # API base client
```

### Authentication Flow

```
1. User enters credentials
   ↓
2. POST /api/auth/login
   ↓
3. Backend returns JWT token + refresh token
   ↓
4. Frontend stores in localStorage / sessionStorage
   ↓
5. All subsequent requests include: Authorization: Bearer <token>
   ↓
6. Backend validates JWT middleware
   ↓
7. Token expires → User redirected to login
```

## Database Schema

### Core Tables

**users**
- id (Primary Key)
- email (Unique)
- password_hash
- is_verified
- created_at
- role (admin, inspector, viewer)

**inspection_reports**
- id (Primary Key)
- user_id (Foreign Key → users)
- title
- description
- created_at
- status (draft, submitted, reviewed)

**sensor_readings**
- id (Primary Key)
- report_id (Foreign Key → inspection_reports)
- sensor_type (accelerometer, strain gauge, etc.)
- value
- unit
- timestamp

**image_analyses**
- id (Primary Key)
- report_id (Foreign Key → inspection_reports)
- image_path
- damage_detected (boolean)
- confidence_score
- analyzed_at

## Deployment Architecture

### Production Stack (DigitalOcean VPS)

```
┌──────────────────────────────────┐
│   User → www.build-guard.app     │
└──────────────┬───────────────────┘
               │ HTTPS
┌──────────────▼───────────────────┐
│      Nginx Reverse Proxy          │
│  - SSL/TLS termination            │
│  - Load balancing                 │
│  - Static file serving            │
└──────────────┬───────────────────┘
               │
┌──────────────┴──────────────────┐
│  PM2 Process Manager             │
│  ├── Backend (uvicorn)           │
│  └── Frontend (serve)            │
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│  PostgreSQL (Supabase)            │
│  - Connection Pooler              │
│  - Automated backups              │
│  - Row-level security             │
└──────────────────────────────────┘
```

### Environment Variables (Production)

```env
DATABASE_URL=postgresql://...@pooler.supabase.com:6543/postgres
SECRET_KEY=<32+ character secret>
ENVIRONMENT=production
ALLOWED_ORIGINS=https://www.build-guard.app
DEBUG=false
```

## ML Model Architecture

### Image Classification Pipeline

```
Input Image (JPG/PNG)
    ↓
[Preprocessing]
- Resize to 224x224
- Normalize pixel values
- Convert to tensor
    ↓
[PyTorch Model]
- ResNet50 backbone
- Fine-tuned on damage dataset
- 2 output classes: damaged/undamaged
    ↓
[Post-processing]
- Apply confidence threshold (>0.7)
- Calculate metrics (precision, recall)
    ↓
Output: {damage_detected, confidence, class_label}
```

### Model Performance
- Accuracy: ~92% on test set
- Inference Time: 2-3 seconds per image
- Model Size: 94MB (downloaded on demand)

## Monitoring & Observability

### Key Metrics
- API response times (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- User authentication success rate
- ML model inference latency

### Logging
- Structured JSON logs to PM2
- Error tracking for critical operations
- Audit logs for user actions

## Scalability Considerations

### Current Architecture
- Vertical scaling on single VPS
- Database connection pooling (Supabase Shared Pooler)
- Frontend served as static files via Nginx

### Future Improvements
- Horizontal scaling with multiple API instances
- Redis caching layer for frequently accessed data
- Asynchronous task queue (Celery) for heavy processing
- CDN for static assets and images
- Message queue for notifications (RabbitMQ/Kafka)

## Technology Decisions & Trade-offs

| Choice | Rationale | Trade-off |
|--------|-----------|-----------|
| FastAPI | Modern, async, fast | Python-specific |
| React | Component reusability, large ecosystem | Client-side complexity |
| PostgreSQL | Reliability, ACID compliance | Overkill for small datasets |
| Supabase | Managed, auth included, affordable | Vendor lock-in |
| PyTorch | Industry standard, good documentation | Large memory footprint |
| JWT | Stateless, scalable | No immediate revocation |

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: Production
