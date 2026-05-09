from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_instructor
from app.core.response import api_success
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.course import (
    CourseCreate,
    CourseOut,
    LessonCreate,
    LessonOut,
    ModuleCreate,
    ModuleOut,
)
from app.services.course_service import CourseService

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreate,
    instructor: User = Depends(require_instructor),
    db: Session = Depends(get_db),
):
    course = CourseService.create_course(db, instructor, payload)
    return api_success(CourseOut.model_validate(course).model_dump())


@router.get("")
def list_courses(db: Session = Depends(get_db)):
    courses = CourseService.list_courses(db)
    if courses and isinstance(courses[0], dict):
        return api_success(courses)
    return api_success([CourseOut.model_validate(c).model_dump() for c in courses])


@router.get("/{course_id}")
def get_course(course_id: UUID, db: Session = Depends(get_db)):
    course = CourseService.get_course(db, course_id)
    return api_success(course)


@router.get("/{course_id}/structure")
def get_course_structure(course_id: UUID, db: Session = Depends(get_db)):
    modules = CourseService.get_course_structure(db, course_id)
    return api_success({"course_id": str(course_id), "modules": modules})


@router.post("/modules", status_code=status.HTTP_201_CREATED)
def create_module(
    payload: ModuleCreate,
    _: User = Depends(require_instructor),
    db: Session = Depends(get_db),
):
    module = CourseService.create_module(db, payload)
    return api_success(ModuleOut.model_validate(module).model_dump())


@router.post("/lessons", status_code=status.HTTP_201_CREATED)
def create_lesson(
    payload: LessonCreate,
    _: User = Depends(require_instructor),
    db: Session = Depends(get_db),
):
    lesson = CourseService.create_lesson(db, payload)
    return api_success(LessonOut.model_validate(lesson).model_dump())
