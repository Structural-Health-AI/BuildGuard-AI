"""
Security and application settings loaded from environment variables
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from pathlib import Path
import os
import sys


class Settings(BaseSettings):
    """Application configuration from environment variables
    
    CRITICAL SECURITY REQUIREMENTS:
    - SECRET_KEY must be changed from default in production
    - DATABASE_URL must point to secure database
    - Email credentials must be provided for email features
    """

    # Security
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    password_reset_token_expire_hours: int = 24
    email_verification_token_expire_hours: int = 48

    # Database
    # For development: sqlite:///./buildguard.db
    # For production with Supabase: postgresql://user:password@host:5432/database
    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./buildguard.db"
    )

    # Email (optional, for password reset and verification)
    smtp_server: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    sender_email: str = ""
    sender_name: str = "BuildGuard-AI"

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"
    environment: str = "development"
    frontend_url: str = "http://localhost:5174"  # For email links

    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 3600

    # Login Security
    max_login_attempts: int = 5
    login_attempt_reset_minutes: int = 15

    class Config:
        env_file = str(Path(__file__).parent.parent / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False

    @field_validator('secret_key')
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        """Validate that SECRET_KEY is not using default placeholder"""
        if v == "your-super-secret-key-change-in-production":
            if info.data.get('environment') == 'production':
                raise ValueError(
                    "❌ CRITICAL: SECRET_KEY must be changed from default for production!\n"
                    "   Generate a new key: python -c \"import secrets; print(secrets.token_urlsafe(32))\"\n"
                    "   Then update SECRET_KEY in your .env file."
                )
            else:
                # Warn in development but allow
                print("⚠️  WARNING: Using default SECRET_KEY. This is only safe in development!")
        return v

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string"""
        if self.environment == "development":
            return ["*"]  # Allow all in dev
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    def validate_startup(self) -> None:
        """Validate critical settings at application startup"""
        errors = []

        # Check SECRET_KEY
        if self.secret_key == "your-super-secret-key-change-in-production":
            errors.append(
                "⚠️  SECRET_KEY is using default placeholder.\n"
                "   Generate with: openssl rand -base64 32"
            )

        # Check DATABASE_URL
        if not self.database_url:
            errors.append("❌ DATABASE_URL is not configured")
        elif self.environment == "production" and self.database_url.startswith("sqlite"):
            errors.append(
                "❌ SQLite is NOT recommended for production.\n"
                "   Use PostgreSQL: postgresql://user:password@host:5432/database"
            )

        # Check email config if SMTP is needed
        if self.smtp_server and not all([self.smtp_user, self.smtp_password]):
            errors.append(
                "⚠️  Email configuration incomplete.\n"
                "   SMTP_USER and SMTP_PASSWORD must be set if SMTP_SERVER is configured"
            )

        # Log warnings
        if errors:
            print("\n" + "="*70)
            print("⚙️  CONFIGURATION WARNINGS:")
            print("="*70)
            for error in errors:
                print(f"\n{error}")
            print("\n" + "="*70 + "\n")

        # In production, fail on critical errors
        if self.environment == "production":
            critical_errors = [
                e for e in errors
                if any(prefix in e for prefix in ["❌", "Must"])
            ]
            if critical_errors:
                print("\n" + "="*70)
                print("❌ CRITICAL CONFIGURATION ERRORS - Cannot start in production:")
                print("="*70)
                for error in critical_errors:
                    print(f"\n{error}")
                print("\n" + "="*70)
                sys.exit(1)

    def validate_production(self) -> None:
        """Validate settings for production deployment"""
        if self.environment == "production":
            if self.secret_key == "your-super-secret-key-change-in-production":
                raise ValueError(
                    "SECRET_KEY must be changed in production!\n"
                    "Generate a new key: openssl rand -base64 32"
                )
            if self.database_url.startswith("sqlite"):
                raise ValueError(
                    "SQLite is not recommended for production. Use PostgreSQL."
                )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance with validation"""
    settings_instance = Settings()
    settings_instance.validate_startup()
    return settings_instance


# Create a default settings instance for direct import
settings = get_settings()

