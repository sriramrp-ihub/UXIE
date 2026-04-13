from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.response import api_success
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.course import CourseOut, EnrollmentOut
from app.services.course_service import CourseService

router = APIRouter(tags=["enrollments"])


@router.post("/enroll/{course_id}", status_code=status.HTTP_201_CREATED)
def enroll_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enrollment = CourseService.enroll_user(db, current_user, course_id)
    return api_success(EnrollmentOut.model_validate(enrollment).model_dump())


@router.get("/my-courses")
def my_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    courses = CourseService.get_my_courses(db, current_user)
    return api_success([CourseOut.model_validate(c).model_dump() for c in courses])
