"""
Authentication Pydantic schemas
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str = Field(..., min_length=12, description="Minimum 12 characters required")
    full_name: Optional[str] = Field(None, max_length=255)

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        """Validate password meets complexity requirements"""
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v)

        if not (has_upper and has_lower and has_digit and has_special):
            raise ValueError(
                "Password must contain: uppercase, lowercase, number, and special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
            )
        return v


class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str = Field(..., min_length=1)


class PasswordReset(BaseModel):
    """Password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation with token"""
    token: str
    new_password: str = Field(..., min_length=12)

    @field_validator('new_password')
    @classmethod
    def validate_new_password_strength(cls, v):
        """Validate new password meets complexity requirements"""
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v)

        if not (has_upper and has_lower and has_digit and has_special):
            raise ValueError(
                "Password must contain: uppercase, lowercase, number, and special character"
            )
        return v


class EmailVerifyRequest(BaseModel):
    """Email verification request"""
    token: str


class ResendVerificationEmail(BaseModel):
    """Resend verification email request"""
    email: EmailStr


class TokenResponse(BaseModel):
    """Token response after login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class UserResponse(BaseModel):
    """User data response (safe - no password)"""
    id: int
    email: str
    full_name: Optional[str]
    is_email_verified: bool
    is_active: bool
    last_login_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class UserDetailResponse(UserResponse):
    """User detail response with additional info"""
    is_admin: bool
    email_verified_at: Optional[datetime]
    last_password_change_at: Optional[datetime]
    updated_at: datetime
