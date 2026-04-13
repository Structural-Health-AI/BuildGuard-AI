"""
User model with authentication fields
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone

Base = declarative_base()


class User(Base):
    """User account model with authentication"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)

    # Email verification
    is_email_verified = Column(Boolean, default=False, nullable=False)
    email_verified_at = Column(DateTime, nullable=True)

    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)

    # Login security
    failed_login_attempts = Column(Integer, default=0)
    last_failed_login_at = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    last_password_change_at = Column(DateTime, nullable=True)

    # Audit fields
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime,
                       default=lambda: datetime.now(timezone.utc),
                       onupdate=lambda: datetime.now(timezone.utc),
                       nullable=False)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"


class LoginAttempt(Base):
    """Track login attempts for rate limiting"""

    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    success = Column(Boolean, nullable=False)  # True for successful, False for failed
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<LoginAttempt(email={self.email}, success={self.success})>"


class PasswordResetToken(Base):
    """Track password reset tokens to prevent token reuse"""

    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    token_hash = Column(String(255), unique=True, nullable=False)
    used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<PasswordResetToken(user_id={self.user_id})>"


class EmailVerificationToken(Base):
    """Track email verification tokens"""

    __tablename__ = "email_verification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    email = Column(String(255), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    verified = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<EmailVerificationToken(user_id={self.user_id}, email={self.email})>"
