from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.response import api_success
from app.db.database import get_db
from app.db.models.course import Course
from app.db.models.user import User
from app.schemas.course import ProgressUpdate
from app.services.course_service import CourseService

router = APIRouter(prefix="/progress", tags=["progress"])


@router.post("/update")
def update_progress(
    payload: ProgressUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = CourseService.update_progress(db, user, payload)

    details = CourseService.get_course_progress(db, user, course_id=progress.lesson.module.course_id)
    completion_percentage = CourseService.get_course_completion_percentage(
        db,
        user.id,
        progress.lesson.module.course_id,
    )
    matching = next((row for row in details if row.get("lesson_id") == str(progress.lesson_id)), None)

    return api_success(
        {
            "progress": matching
            or {
                "user_id": str(progress.user_id),
                "lesson_id": str(progress.lesson_id),
                "completed": progress.completed,
                "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
            },
            "completion_percentage": completion_percentage,
            "course_id": str(progress.lesson.module.course_id),
        }
    )


@router.get("/{course_id}")
def get_progress(
    course_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = CourseService.get_course_progress(db, user, course_id)
    completion_percentage = CourseService.get_course_completion_percentage(db, user.id, course_id)
    course_title = progress[0].get("course_title") if progress else None
    if course_title is None:
        course = db.get(Course, course_id)
        course_title = course.title if course else None
    return api_success(
        {
            "course_id": str(course_id),
            "course_title": course_title,
            "completion_percentage": completion_percentage,
            "items": progress,
        }
    )
