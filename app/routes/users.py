from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.roles import UserRole
from app.core.dependencies import get_current_user, require_admin
from app.core.response import api_success
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return api_success(UserOut.model_validate(current_user).model_dump())


@router.get("")
def list_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return api_success([UserOut.model_validate(u).model_dump() for u in users])
