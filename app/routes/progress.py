from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.response import api_success
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.course import ProgressOut, ProgressUpdate
from app.services.course_service import CourseService

router = APIRouter(prefix="/progress", tags=["progress"])


@router.post("/update")
def update_progress(
    payload: ProgressUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = CourseService.update_progress(db, user, payload)
    return api_success(ProgressOut.model_validate(progress).model_dump())


@router.get("/{course_id}")
def get_progress(
    course_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = CourseService.get_course_progress(db, user, course_id)
    return api_success([ProgressOut.model_validate(p).model_dump() for p in progress])
