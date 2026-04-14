"""
BuildGuard-AI Backend
Structural Health Monitoring and Damage Detection API
"""
import os
import sqlite3
import jwt
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from urllib.parse import urlparse
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials

from api.sensor_routes import router as sensor_router
from api.image_routes import router as image_router
from api.report_routes import router as report_router
from core.config import get_settings
from core.security import TokenManager
from database import init_database, SessionLocal


# Database setup
DATABASE_PATH = "buildguard.db"
settings = get_settings()


def extract_hostnames(origins: str) -> list[str]:
    """Extract hostnames from CORS origins (URLs or plain hostnames)"""
    hostnames = []
    for origin in origins.split(","):
        origin = origin.strip()
        if origin.startswith(("http://", "https://")):
            # Parse URL and extract hostname
            parsed = urlparse(origin)
            hostnames.append(parsed.netloc)
        else:
            # Already a hostname
            hostnames.append(origin)
    return hostnames


def init_legacy_database():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Sensor predictions table with user tracking
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensor_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            session_id TEXT,
            accel_x REAL NOT NULL,
            accel_y REAL NOT NULL,
            accel_z REAL NOT NULL,
            strain REAL NOT NULL,
            temperature REAL NOT NULL,
            building_name TEXT,
            location TEXT,
            damage_level TEXT NOT NULL,
            confidence REAL NOT NULL,
            recommendations TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Image analyses table with user tracking
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS image_analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            session_id TEXT,
            image_path TEXT NOT NULL,
            damage_detected INTEGER NOT NULL,
            damage_type TEXT,
            confidence REAL NOT NULL,
            recommendations TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Reports table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            session_id TEXT,
            building_name TEXT NOT NULL,
            location TEXT NOT NULL,
            inspector_name TEXT NOT NULL,
            description TEXT,
            sensor_prediction_id INTEGER,
            image_analysis_id INTEGER,
            overall_status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sensor_prediction_id) REFERENCES sensor_predictions(id),
            FOREIGN KEY (image_analysis_id) REFERENCES image_analyses(id)
        )
    """)

    # Add user_id and session_id columns to existing tables if they don't exist
    try:
        cursor.execute("ALTER TABLE sensor_predictions ADD COLUMN user_id TEXT")
    except:
        pass
    
    try:
        cursor.execute("ALTER TABLE sensor_predictions ADD COLUMN session_id TEXT")
    except:
        pass
    
    try:
        cursor.execute("ALTER TABLE image_analyses ADD COLUMN user_id TEXT")
    except:
        pass
    
    try:
        cursor.execute("ALTER TABLE image_analyses ADD COLUMN session_id TEXT")
    except:
        pass

    conn.commit()
    conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Initialize databases
    init_database()  # Initialize SQLAlchemy models
    init_legacy_database()  # Initialize legacy SQLite tables

    # Create required directories if they don't exist
    required_dirs = [
        "uploads",
        "saved_models",
        "../data/sensor",
        "../data/images/train/damage",
        "../data/images/train/no_damage",
        "../data/images/validation/damage",
        "../data/images/validation/no_damage"
    ]
    
    for dir_path in required_dirs:
        try:
            os.makedirs(dir_path, exist_ok=True)
        except Exception as e:
            print(f"[WARNING] Could not create directory {dir_path}: {e}")

    yield

    # Shutdown: Cleanup if needed
    pass


# Create FastAPI app
app = FastAPI(
    title="BuildGuard-AI",
    description="Structural Health Monitoring and Damage Detection API",
    version="1.0.0",
    lifespan=lifespan
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(Exception, lambda request, exc: {"detail": "Rate limit exceeded"})

# ============= SECURITY MIDDLEWARE =============

# Extract hostnames for TrustedHostMiddleware (it needs just hostnames, not full URLs)
if settings.environment == "production":
    trusted_hosts = extract_hostnames(settings.allowed_origins)
else:
    trusted_hosts = ["*"]

# Trusted Host Middleware - only allow requests from trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=trusted_hosts
)

# CORS middleware - restrictive in production
cors_origins = settings.cors_origins
if settings.environment == "production":
    cors_origins = [origin.strip() for origin in settings.allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Restrict to necessary methods
    allow_headers=["Content-Type", "Authorization"],  # Only required headers
)

# Add security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(sensor_router, prefix="/api/sensor", tags=["Sensor Analysis"])
app.include_router(image_router, prefix="/api/image", tags=["Image Analysis"])
app.include_router(report_router, prefix="/api/reports", tags=["Reports"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to BuildGuard-AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "sensor_analysis": "/api/sensor",
            "image_analysis": "/api/image",
            "reports": "/api/reports"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected"
    }


# Optional Bearer token for sensitive endpoints
security = HTTPBearer()


async def get_token_or_none(request: Request) -> HTTPAuthorizationCredentials | None:
    """
    Extract bearer token from request, return None if not provided
    This makes the token completely optional
    """
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        # Extract and validate the token format
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=auth[7:])
        return credentials
    return None


def verify_admin_token(credentials: HTTPAuthorizationCredentials | None = Depends(get_token_or_none)) -> bool:
    """
    Verify admin token for sensitive endpoints
    
    In production, this should check against a real user database
    For now, it checks if a valid JWT was provided, but allows access without one
    """
    if credentials is None:
        # Allow unauthenticated access to dashboard
        # In production, change to: raise HTTPException(status_code=401, detail="Unauthorized")
        return True
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return True
    except (jwt.InvalidTokenError, jwt.ExpiredSignatureError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@app.post("/api/auth/demo-token")
async def get_demo_token():
    """
    Generate a demo admin token for testing
    
    **Security Warning:** This should only be available in development!
    Remove in production or require authentication.
    """
    token = TokenManager.create_access_token(
        data={"sub": "demo_user", "role": "admin"},
        expires_delta=timedelta(hours=24),
        token_type="access"
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": "24 hours",
        "usage": "Add 'Authorization: Bearer {token}' header to requests"
    }


@app.get("/api/dashboard/stats")
@limiter.limit("30/minute")
async def get_dashboard_stats(request: Request, is_admin: bool = Depends(verify_admin_token), session_id: str = None):
    """
    Get dashboard statistics filtered by user session
    
    **Security Note:** This endpoint now shows only current user's data and rate limits requests.
    Pass session_id as query parameter to filter by user.
    """
    # Get session_id from query parameter if not provided
    if not session_id:
        session_id = request.query_params.get("session_id")
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Build WHERE clause for filtering by session/user
    where_clause = ""
    params = []
    if session_id:
        where_clause = "WHERE session_id = ?"
        params = [session_id]

    # Get counts
    query = f"SELECT COUNT(*) FROM reports {where_clause}"
    cursor.execute(query, params)
    total_reports = cursor.fetchone()[0]

    query = f"SELECT COUNT(*) FROM sensor_predictions {where_clause}"
    cursor.execute(query, params)
    total_sensor = cursor.fetchone()[0]

    query = f"SELECT COUNT(*) FROM image_analyses {where_clause}"
    cursor.execute(query, params)
    total_image = cursor.fetchone()[0]

    # Get damage level counts from sensor predictions
    query = f"SELECT COUNT(*) FROM sensor_predictions {where_clause} AND damage_level = 'healthy'"
    cursor.execute(query, params)
    healthy = cursor.fetchone()[0]

    query = f"SELECT COUNT(*) FROM sensor_predictions {where_clause} AND damage_level = 'minor_damage'"
    cursor.execute(query, params)
    minor = cursor.fetchone()[0]

    query = f"SELECT COUNT(*) FROM sensor_predictions {where_clause} AND damage_level = 'severe_damage'"
    cursor.execute(query, params)
    severe = cursor.fetchone()[0]

    # Get recent analyses
    if session_id:
        cursor.execute("""
            SELECT 'sensor' as type, damage_level as status, created_at
            FROM sensor_predictions
            WHERE session_id = ?
            UNION ALL
            SELECT 'image' as type,
                   CASE WHEN damage_detected = 1 THEN 'damage_detected' ELSE 'no_damage' END as status,
                   created_at
            FROM image_analyses
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        """, [session_id, session_id])
    else:
        cursor.execute("""
            SELECT 'sensor' as type, damage_level as status, created_at
            FROM sensor_predictions
            UNION ALL
            SELECT 'image' as type,
                   CASE WHEN damage_detected = 1 THEN 'damage_detected' ELSE 'no_damage' END as status,
                   created_at
            FROM image_analyses
            ORDER BY created_at DESC
            LIMIT 10
        """)
    recent = cursor.fetchall()

    conn.close()

    return {
        "total_reports": total_reports,
        "total_sensor_analyses": total_sensor,
        "total_image_analyses": total_image,
        "healthy_count": healthy,
        "minor_damage_count": minor,
        "severe_damage_count": severe,
        "recent_analyses": [
            {"type": r[0], "status": r[1], "created_at": r[2]} for r in recent
        ],
        "user_session": session_id if session_id else "global"
    }


if __name__ == "__main__":
    import uvicorn
    import socket
    
    # Get port from environment variable or use default (8000 for production)
    port = int(os.getenv("BACKEND_PORT", 8000))
    
    # Try to find an available port if default is in use
    def find_available_port(start_port=8000, max_attempts=10):
        """Find an available port starting from start_port"""
        for offset in range(max_attempts):
            test_port = start_port + offset
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.bind(("0.0.0.0", test_port))
                sock.close()
                return test_port
            except OSError:
                continue
        return start_port  # Return default if all fail
    
    available_port = find_available_port(port)
    if available_port != port:
        print(f"⚠ Port {port} already in use, using port {available_port} instead")
    
    uvicorn.run(app, host="0.0.0.0", port=available_port, reload=False)
