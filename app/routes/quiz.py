from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.response import api_success
from app.db.database import get_db
from app.db.models.quiz import Question
from app.db.models.user import User
from app.schemas.quiz import QuizAttemptOut, QuizOut, QuestionOut, QuizSubmitRequest
from app.services.course_service import CourseService

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/{course_id}")
def get_quiz(course_id: UUID, db: Session = Depends(get_db)):
    quiz = CourseService.get_quiz_by_course(db, course_id)
    questions = db.scalars(select(Question).where(Question.quiz_id == quiz.id)).all()
    response = QuizOut(
        id=quiz.id,
        course_id=quiz.course_id,
        questions=[QuestionOut.model_validate(q) for q in questions],
    )
    return api_success(response.model_dump())


@router.post("/submit")
def submit_quiz(
    payload: QuizSubmitRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = CourseService.submit_quiz(db, user, payload)
    return api_success(QuizAttemptOut.model_validate(attempt).model_dump())
