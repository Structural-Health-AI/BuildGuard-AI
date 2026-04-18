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
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


# Enable foreign keys for SQLite only
def _set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


if "sqlite" in settings.database_url:
    event.listen(engine, "connect", _set_sqlite_pragma)
