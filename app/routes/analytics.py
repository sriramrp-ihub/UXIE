from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin, require_instructor
from app.core.response import api_success
from app.db.database import get_db
from app.db.models.user import User
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/course/{course_id}")
def course_analytics(
    course_id: UUID,
    _: User = Depends(require_instructor),
    db: Session = Depends(get_db),
):
    data = AnalyticsService.course_analytics(db, course_id)
    return api_success(data)


@router.get("/course/{course_id}/detailed")
def course_detailed_analytics(
    course_id: UUID,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    data = AnalyticsService.course_detailed_analytics(db, course_id)
    return api_success(data)


@router.get("/user/{user_id}/performance")
def user_performance_analytics(
    user_id: UUID,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    data = AnalyticsService.user_performance(db, user_id)
    return api_success(data)


@router.get("/questions/{course_id}")
def course_question_analytics(
    course_id: UUID,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    data = AnalyticsService.question_analytics(db, course_id)
    return api_success(data)


@router.get("/dashboard/me")
def my_dashboard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = AnalyticsService.user_dashboard(db, user.id)
    return api_success(data)


@router.get("/dashboard/global")
def global_dashboard(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    data = AnalyticsService.global_dashboard(db)
    return api_success(data)


@router.get("/active-users")
def active_users(_: User = Depends(require_admin)):
    return api_success({"active_users": AnalyticsService.get_active_users_count()})


@router.get("/time-spent/{user_id}")
def time_spent(
    user_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role == "student" and user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    data = AnalyticsService.time_spent_by_user(db, user_id)
    return api_success(data)
