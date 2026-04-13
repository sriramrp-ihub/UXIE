from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.response import api_success
from app.db.database import get_db
from app.schemas.user import TokenResponse, UserLogin, UserOut, UserRegister
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    user = AuthService.register_user(db, payload)
    return api_success(UserOut.model_validate(user).model_dump())


@router.post("/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    token = AuthService.login_user(db, payload)
    return api_success(TokenResponse(access_token=token).model_dump())


@router.get("/verify")
def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    user = AuthService.verify_email(db, token)
    return api_success({"message": "Email verified", "user_id": str(user.id)})
