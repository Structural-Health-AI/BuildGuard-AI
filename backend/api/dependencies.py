"""
Shared authentication dependencies for all routes
"""
from fastapi.security import HTTPBearer
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from models.user_model import User
from core.security import TokenManager
from database import get_db

security = HTTPBearer()


def get_current_user(
    credentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Extract and validate current user from JWT token

    Used as a dependency in protected endpoints:

    @router.get("/protected")
    async def protected_endpoint(current_user: User = Depends(get_current_user)):
        # User is automatically authenticated
        return {"user": current_user.email}
    """
    token = credentials.credentials

    payload = TokenManager.verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to verify current user is admin

    Used for admin-only endpoints:

    @router.delete("/admin/users/{user_id}")
    async def delete_user(user_id: int, admin: User = Depends(get_current_admin)):
        # Only admins can execute this
        ...
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
