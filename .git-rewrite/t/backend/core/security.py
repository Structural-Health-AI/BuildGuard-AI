"""
Security utilities for password hashing and JWT token management
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt
from core.config import get_settings

settings = get_settings()


class PasswordHasher:
    """Secure password hashing using bcrypt"""

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a password using bcrypt with strong salt rounds

        Args:
            password: Plain text password to hash

        Returns:
            Hashed password (can be safely stored in database)
        """
        salt = bcrypt.gensalt(rounds=12)  # 12 rounds = ~0.3 seconds, secure against GPU attacks
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash

        Args:
            password: Plain text password to verify
            hashed_password: Hash stored in database

        Returns:
            True if password matches, False otherwise
        """
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


class TokenManager:
    """JWT token creation and verification"""

    @staticmethod
    def create_access_token(
        data: dict,
        expires_delta: Optional[timedelta] = None,
        token_type: str = "access"
    ) -> str:
        """
        Create a JWT access token with expiration

        Args:
            data: Dictionary with subject (typically user ID) and other claims
            expires_delta: Token expiration time (uses default if None)
            token_type: Type of token (access, refresh, reset, etc.)

        Returns:
            Encoded JWT token
        """
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=settings.access_token_expire_minutes
            )

        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": token_type
        })

        encoded_jwt = jwt.encode(
            to_encode,
            settings.secret_key,
            algorithm=settings.algorithm
        )
        return encoded_jwt

    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
        """
        Verify and decode a JWT token

        Args:
            token: JWT token to verify
            token_type: Expected token type (must match or verification fails)

        Returns:
            Decoded token data if valid, None if invalid or expired
        """
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.algorithm]
            )

            # Verify token type
            if payload.get("type") != token_type:
                return None

            return payload
        except jwt.ExpiredSignatureError:
            # Token has expired
            return None
        except jwt.InvalidTokenError:
            # Invalid token
            return None

    @staticmethod
    def create_password_reset_token(user_id: int) -> str:
        """
        Create a password reset token that expires after configured hours

        Args:
            user_id: User ID requesting reset

        Returns:
            JWT token that can be used to reset password
        """
        expires_delta = timedelta(hours=settings.password_reset_token_expire_hours)
        return TokenManager.create_access_token(
            data={"sub": user_id},
            expires_delta=expires_delta,
            token_type="password_reset"
        )

    @staticmethod
    def create_email_verification_token(user_id: int, email: str) -> str:
        """
        Create an email verification token that expires after configured hours

        Args:
            user_id: User ID to verify
            email: Email address to verify

        Returns:
            JWT token sent to user's email for verification
        """
        expires_delta = timedelta(
            hours=settings.email_verification_token_expire_hours
        )
        return TokenManager.create_access_token(
            data={"sub": user_id, "email": email},
            expires_delta=expires_delta,
            token_type="email_verification"
        )

    @staticmethod
    def create_refresh_token(user_id: int) -> str:
        """
        Create a long-lived refresh token

        Args:
            user_id: User ID for refresh token

        Returns:
            JWT refresh token
        """
        expires_delta = timedelta(days=settings.refresh_token_expire_days)
        return TokenManager.create_access_token(
            data={"sub": user_id},
            expires_delta=expires_delta,
            token_type="refresh"
        )
