"""
Authentication API routes with security features
"""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
import hashlib

from models.user_model import User, LoginAttempt, PasswordResetToken, EmailVerificationToken
from schemas.auth_schemas import (
    UserRegister, UserLogin, TokenResponse, UserResponse,
    PasswordReset, PasswordResetConfirm, EmailVerifyRequest,
    ResendVerificationEmail, UserDetailResponse
)
from core.security import PasswordHasher, TokenManager
from core.config import get_settings
from core.email import EmailService
from database import get_db
from api.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer()
limiter = Limiter(key_func=get_remote_address)
settings = get_settings()


def check_login_attempts(email: str, db: Session) -> None:
    """Check if user has exceeded max login attempts"""
    thirty_min_ago = datetime.now(timezone.utc) - timedelta(
        minutes=settings.login_attempt_reset_minutes
    )

    recent_failed = db.query(LoginAttempt).filter(
        LoginAttempt.email == email,
        LoginAttempt.success == False,
        LoginAttempt.created_at > thirty_min_ago
    ).count()

    if recent_failed >= settings.max_login_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please try again in {settings.login_attempt_reset_minutes} minutes."
        )


def record_login_attempt(
    email: str, success: bool, request: Request, db: Session
) -> None:
    """Record login attempt for security tracking"""
    attempt = LoginAttempt(
        email=email,
        success=success,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:255]
    )
    db.add(attempt)
    db.commit()


def hash_token(token: str) -> str:
    """Hash token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")  # Limit registration attempts
async def register(
    request: Request,
    user_data: UserRegister,
    db: Session = Depends(get_db)
) -> User:
    """
    Register a new user account

    - Email must be unique and valid
    - Password must be 12+ characters with uppercase, lowercase, digit, and special character
    - Account created with email verification required
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = PasswordHasher.hash_password(user_data.password)

    # Create user
    user = User(
        email=user_data.email.lower(),
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        is_email_verified=False
    )

    db.add(user)
    db.flush()  # Get user ID without committing

    # Create email verification token
    verification_token = TokenManager.create_email_verification_token(user.id, user.email)
    token_hash = hash_token(verification_token)

    verification = EmailVerificationToken(
        user_id=user.id,
        email=user.email,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(
            hours=settings.email_verification_token_expire_hours
        )
    )

    db.add(verification)
    db.commit()
    db.refresh(user)

    # Send verification email
    verification_link = f"{settings.frontend_url}/verify-email?token={verification_token}"
    await EmailService.send_email_verification(
        to_email=user.email,
        verification_link=verification_link,
        user_name=user.full_name
    )

    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")  # Limit login attempts
async def login(
    request: Request,
    credentials: UserLogin,
    db: Session = Depends(get_db)
) -> TokenResponse:
    """
    Login user and return JWT tokens

    - Email and password must be correct
    - User must have verified email
    - Returns access token (30 min) and refresh token (7 days)
    """
    email = credentials.email.lower()

    # Check rate limiting
    check_login_attempts(email, db)

    # Find user
    user = db.query(User).filter(User.email == email).first()

    if not user or not PasswordHasher.verify_password(credentials.password, user.hashed_password):
        # Record failed attempt
        record_login_attempt(email, False, request, db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in"
        )

    # Record successful login
    record_login_attempt(email, True, request, db)
    user.failed_login_attempts = 0
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    # Create tokens
    access_token = TokenManager.create_access_token(data={"sub": user.id})
    refresh_token = TokenManager.create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60
    )


@router.post("/verify-email")
async def verify_email(
    request: Request,
    data: EmailVerifyRequest,
    db: Session = Depends(get_db)
) -> dict:
    """Verify user email with token sent to their inbox"""
    payload = TokenManager.verify_token(data.token, token_type="email_verification")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check token record
    token_hash = hash_token(data.token)
    verify_token = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user_id,
        EmailVerificationToken.token_hash == token_hash,
        EmailVerificationToken.verified == False
    ).first()

    if not verify_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )

    # Mark email as verified
    user.is_email_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    verify_token.verified = True
    verify_token.verified_at = datetime.now(timezone.utc)

    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/resend-verification-email")
@limiter.limit("3/hour")  # Limit resend attempts
async def resend_verification_email(
    request: Request,
    data: ResendVerificationEmail,
    db: Session = Depends(get_db)
) -> dict:
    """Resend verification email to user"""
    user = db.query(User).filter(User.email == data.email.lower()).first()

    if not user:
        # Don't reveal if email exists (security best practice)
        return {"message": "If email exists, verification email has been sent"}

    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )

    # Create new verification token
    verification_token = TokenManager.create_email_verification_token(user.id, user.email)
    token_hash = hash_token(verification_token)

    verification = EmailVerificationToken(
        user_id=user.id,
        email=user.email,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(
            hours=settings.email_verification_token_expire_hours
        )
    )

    db.add(verification)
    db.commit()

    # Send verification email
    verification_link = f"{settings.frontend_url}/verify-email?token={verification_token}"
    await EmailService.send_email_verification(
        to_email=user.email,
        verification_link=verification_link,
        user_name=user.full_name
    )

    return {"message": "Verification email sent"}


@router.post("/request-password-reset")
@limiter.limit("5/hour")  # Limit reset requests
async def request_password_reset(
    request: Request,
    data: PasswordReset,
    db: Session = Depends(get_db)
) -> dict:
    """Request password reset token (sent to email)"""
    user = db.query(User).filter(User.email == data.email.lower()).first()

    if user:
        reset_token = TokenManager.create_password_reset_token(user.id)
        token_hash = hash_token(reset_token)

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(
                hours=settings.password_reset_token_expire_hours
            )
        )

        db.add(reset_record)
        db.commit()

        # Send password reset email
        reset_link = f"{settings.frontend_url}/reset-password?token={reset_token}"
        await EmailService.send_password_reset(
            to_email=user.email,
            reset_link=reset_link,
            user_name=user.full_name
        )

    # Always return success (don't reveal if email exists)
    return {"message": "If email is registered, password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    data: PasswordResetConfirm,
    db: Session = Depends(get_db)
) -> dict:
    """Reset password with valid token"""
    payload = TokenManager.verify_token(data.token, token_type="password_reset")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if token was already used
    token_hash = hash_token(data.token)
    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id,
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False
    ).first()

    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already used reset token"
        )

    # Update password
    user.hashed_password = PasswordHasher.hash_password(data.new_password)
    user.last_password_change_at = datetime.now(timezone.utc)

    # Mark token as used
    reset_record.used = True
    reset_record.used_at = datetime.now(timezone.utc)

    db.commit()

    return {"message": "Password reset successfully"}


@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token(
    credentials = Depends(security),
    db: Session = Depends(get_db)
) -> TokenResponse:
    """Generate new access token using refresh token"""
    token = credentials.credentials

    payload = TokenManager.verify_token(token, token_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Create new access token
    access_token = TokenManager.create_access_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=token,
        expires_in=settings.access_token_expire_minutes * 60
    )


@router.get("/me", response_model=UserDetailResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current authenticated user's information"""
    return current_user
