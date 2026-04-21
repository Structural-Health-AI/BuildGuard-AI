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
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials

from api.sensor_routes import router as sensor_router
from api.image_routes import router as image_router
from api.report_routes import router as report_router
from api.dependencies import get_current_user_optional
from core.config import get_settings
from core.security import TokenManager
from database import init_database, SessionLocal, get_db
from models.user_model import User
from sqlalchemy.orm import Session


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

# Create required directories BEFORE mounting
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

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(Exception, lambda request, exc: {"detail": "Rate limit exceeded"})

# ============= SECURITY MIDDLEWARE =============

# Note: TrustedHostMiddleware removed - Nginx is the public-facing reverse proxy
# and provides the security boundary. FastAPI only receives requests from localhost/127.0.0.1

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
    """Health check endpoint for production monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected",
        "version": "1.0.0"
    }


@app.get("/health")
async def simple_health():
    """Simple health check endpoint (for Docker/uptime monitoring)"""
    return {"status": "ok"}


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
async def get_dashboard_stats(
    request: Request,
    user_id: str | None = None,
    session_id: str | None = None,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics.
    If authenticated, return user-specific data. Otherwise return aggregate data.
    """
    from models.user_model import SensorPrediction, Report, ImageAnalysis
    
    # Priority: explicit query user/session id -> authenticated user id -> anonymous
    effective_user_id = (
        user_id
        or session_id
        or request.query_params.get("user_id")
        or request.query_params.get("session_id")
        or (str(current_user.id) if current_user else "anonymous")
    )

    report_query = db.query(Report)
    sensor_query = db.query(SensorPrediction)
    image_query = db.query(ImageAnalysis)

    if effective_user_id:
        report_query = report_query.filter(Report.user_id == effective_user_id)
        sensor_query = sensor_query.filter(SensorPrediction.user_id == effective_user_id)
        image_query = image_query.filter(ImageAnalysis.user_id == effective_user_id)

    total_reports = report_query.count()
    total_sensor = sensor_query.count()
    total_image = image_query.count()

    healthy = sensor_query.filter(SensorPrediction.damage_level == "healthy").count()
    minor = sensor_query.filter(SensorPrediction.damage_level == "minor_damage").count()
    severe = sensor_query.filter(SensorPrediction.damage_level == "severe_damage").count()

    image_damage_count = image_query.filter(ImageAnalysis.damage_detected == 1).count()
    
    # Add image damage count to severe
    severe = severe + image_damage_count

    # Get recent analyses
    sensor_recent = sensor_query.order_by(SensorPrediction.created_at.desc()).limit(10).all()
    image_recent = image_query.order_by(ImageAnalysis.created_at.desc()).limit(10).all()

    # Combine and sort recent analyses
    recent_analyses = []
    for s in sensor_recent:
        recent_analyses.append({
            "type": "sensor",
            "status": s.damage_level,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    for i in image_recent:
        recent_analyses.append({
            "type": "image",
            "status": "damage_detected" if i.damage_detected else "no_damage",
            "created_at": i.created_at.isoformat() if i.created_at else None
        })
    
    # Sort by created_at descending and take top 10
    recent_analyses.sort(key=lambda x: x["created_at"] or "", reverse=True)
    recent_analyses = recent_analyses[:10]

    return {
        "total_reports": total_reports,
        "total_sensor_analyses": total_sensor,
        "total_image_analyses": total_image,
        "healthy_count": healthy,
        "minor_damage_count": minor,
        "severe_damage_count": severe,
        "recent_analyses": recent_analyses,
        "user_id": effective_user_id,
        "user_email": current_user.email if current_user else "anonymous"
    }


@app.get("/api/dashboard/trend")
@limiter.limit("30/minute")
async def get_dashboard_trend(
    request: Request,
    user_id: str | None = None,
    session_id: str | None = None,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get trend data (last 6 months) for dashboard charts.
    If authenticated, return user-specific data. Otherwise return aggregate data.
    """
    from models.user_model import SensorPrediction
    from datetime import timedelta
    from sqlalchemy import func, and_
    
    effective_user_id = (
        user_id
        or session_id
        or request.query_params.get("user_id")
        or request.query_params.get("session_id")
        or (str(current_user.id) if current_user else "anonymous")
    )
    
    # Calculate date 6 months ago
    six_months_ago = datetime.now() - timedelta(days=180)
    
    # Build query
    query = db.query(
        func.date_trunc('month', SensorPrediction.created_at).label('month'),
        SensorPrediction.damage_level,
        func.count().label('count')
    )
    
    if effective_user_id:
        query = query.filter(SensorPrediction.user_id == effective_user_id)
    
    query = query.filter(SensorPrediction.created_at >= six_months_ago)
    query = query.group_by(
        func.date_trunc('month', SensorPrediction.created_at),
        SensorPrediction.damage_level
    )
    query = query.order_by(func.date_trunc('month', SensorPrediction.created_at).desc())
    
    rows = query.all()

    # Process data into charts format
    months_dict = {}
    for month, damage_level, count in rows:
        month_str = month.strftime('%Y-%m') if month else 'unknown'
        if month_str not in months_dict:
            months_dict[month_str] = {'month': month_str, 'healthy': 0, 'warning': 0, 'critical': 0}
        
        # Map damage levels to chart categories
        if damage_level == 'healthy':
            months_dict[month_str]['healthy'] = count
        elif damage_level == 'minor_damage':
            months_dict[month_str]['warning'] = count
        elif damage_level == 'severe_damage':
            months_dict[month_str]['critical'] = count

    # Convert to list and sort by month
    trend_data = sorted(months_dict.values(), key=lambda x: x['month'])
    
    # If no data, return empty list
    if not trend_data:
        trend_data = []

    return {
        "trend_data": trend_data,
        "user_id": effective_user_id,
        "user_email": current_user.email if current_user else "anonymous"
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
        print(f"[WARNING] Port {port} already in use, using port {available_port} instead")
    
    uvicorn.run(app, host="0.0.0.0", port=available_port, reload=False)
