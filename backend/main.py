"""
BuildGuard-AI Backend
Structural Health Monitoring and Damage Detection API
"""
import os
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.sensor_routes import router as sensor_router
from api.image_routes import router as image_router
from api.report_routes import router as report_router
from api.auth_routes import router as auth_router, limiter
from api.dependencies import get_current_user
from core.config import get_settings
from database import init_database, SessionLocal


# Database setup
DATABASE_PATH = "buildguard.db"
settings = get_settings()


def init_legacy_database():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Sensor predictions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensor_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    # Image analyses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS image_analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    conn.commit()
    conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Initialize databases
    init_database()  # Initialize SQLAlchemy models
    init_legacy_database()  # Initialize legacy SQLite tables

    # Create uploads directory if not exists
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("saved_models", exist_ok=True)

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

# ============= SECURITY MIDDLEWARE =============

# Trusted Host Middleware - only allow requests from trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.cors_origins if settings.environment == "production" else ["*"]
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

# Add rate limiting error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth_router, tags=["Authentication"])
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


@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user = Depends(get_current_user)):
    """Get dashboard statistics"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Get counts
    cursor.execute("SELECT COUNT(*) FROM reports")
    total_reports = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM sensor_predictions")
    total_sensor = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM image_analyses")
    total_image = cursor.fetchone()[0]

    # Get damage level counts from sensor predictions
    cursor.execute("SELECT COUNT(*) FROM sensor_predictions WHERE damage_level = 'healthy'")
    healthy = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM sensor_predictions WHERE damage_level = 'minor_damage'")
    minor = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM sensor_predictions WHERE damage_level = 'severe_damage'")
    severe = cursor.fetchone()[0]

    # Get recent analyses
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
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
