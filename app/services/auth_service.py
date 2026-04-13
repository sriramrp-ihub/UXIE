from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_verification_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.db.models.user import User
from app.schemas.user import UserLogin, UserRegister
from app.utils.email import send_verification_email


class AuthService:
    @staticmethod
    def register_user(db: Session, payload: UserRegister) -> User:
        existing = db.scalar(select(User).where(User.email == payload.email))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )

        user = User(
            name=payload.name,
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            role=payload.role.value,
            is_verified=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_verification_token(str(user.id), user.email)
        send_verification_email(user.email, token)
        return user

    @staticmethod
    def login_user(db: Session, payload: UserLogin) -> str:
        user = db.scalar(select(User).where(User.email == payload.email))
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email is not verified",
            )

        return create_access_token(str(user.id), user.role)

    @staticmethod
    def verify_email(db: Session, token: str) -> User:
        try:
            payload = decode_token(token)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token",
            ) from exc

        if payload.get("type") != "verify":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token",
            )

        user_id = payload.get("user_id")
        try:
            user_uuid = UUID(user_id)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token",
            ) from exc

        user = db.get(User, user_uuid)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if not user.is_verified:
            user.is_verified = True
            db.add(user)
            db.commit()
            db.refresh(user)

        return user
