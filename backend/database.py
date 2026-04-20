"""
Database configuration and session management
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os

from core.config import get_settings
from models.user_model import Base

settings = get_settings()

# Determine connection arguments based on database type
connect_args = {}
if "sqlite" in settings.database_url:
    # SQLite settings
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        settings.database_url,
        connect_args=connect_args,
        poolclass=StaticPool,
    )
else:
    # PostgreSQL (Supabase) settings
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,  # Verify connections before using
        echo=False,
        pool_size=10,
        max_overflow=20,
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
    """Initialize database tables and create test user if needed"""
    Base.metadata.create_all(bind=engine)
    
    # Create test user for development if it doesn't exist
    db = SessionLocal()
    try:
        from models.user_model import User
        from core.security import PasswordHasher
        
        test_email = "demo@buildguard.local"
        existing_user = db.query(User).filter(User.email == test_email).first()
        
        if not existing_user:
            hasher = PasswordHasher()
            test_user = User(
                email=test_email,
                full_name="Demo User",
                hashed_password=hasher.hash_password("Demo@123456"),
                is_email_verified=True,
                is_active=True,
                is_admin=True
            )
            db.add(test_user)
            db.commit()
            print(f"✅ Created test user: {test_email} / Demo@123456")
    except Exception as e:
        print(f"⚠️  Could not create test user: {e}")
    finally:
        db.close()


# Enable foreign keys for SQLite only
def _set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


if "sqlite" in settings.database_url:
    event.listen(engine, "connect", _set_sqlite_pragma)
