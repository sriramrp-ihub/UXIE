from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.constants.roles import UserRole
from app.core.security import decode_token
from app.db.database import get_db
from app.db.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    try:
        payload = decode_token(token)
        user_id = payload.get("user_id")
        if not user_id:
            raise ValueError("Token payload missing user_id")
        user = db.get(User, UUID(user_id))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        ) from exc

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def require_roles(*roles: UserRole) -> Callable:
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in [r.value for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker


def require_student(user: User = Depends(require_roles(UserRole.STUDENT))) -> User:
    return user


def require_instructor(
    user: User = Depends(require_roles(UserRole.INSTRUCTOR, UserRole.ADMIN)),
) -> User:
    return user


def require_admin(user: User = Depends(require_roles(UserRole.ADMIN))) -> User:
    return user
