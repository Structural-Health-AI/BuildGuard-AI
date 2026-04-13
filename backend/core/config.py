"""
Security and application settings loaded from environment variables
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application configuration from environment variables"""

    # Security
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    password_reset_token_expire_hours: int = 24
    email_verification_token_expire_hours: int = 48

    # Database
    database_url: str = "sqlite:///./buildguard.db"

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
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string"""
        if self.environment == "development":
            return ["*"]  # Allow all in dev
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    def validate_production(self) -> None:
        """Validate settings for production deployment"""
        if self.environment == "production":
            if self.secret_key == "your-super-secret-key-change-in-production":
                raise ValueError("SECRET_KEY must be changed in production!")
            if self.database_url.startswith("sqlite"):
                raise ValueError("SQLite is not recommended for production. Use PostgreSQL.")


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Create a default settings instance for direct import
settings = get_settings()
