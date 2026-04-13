from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question: str
    options: list[str]


class QuizOut(BaseModel):
    id: UUID
    course_id: UUID
    questions: list[QuestionOut]


class QuizSubmitItem(BaseModel):
    question_id: UUID
    answer: str = Field(min_length=1, max_length=255)


class QuizSubmitRequest(BaseModel):
    quiz_id: UUID
    answers: list[QuizSubmitItem]


class QuizAttemptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    quiz_id: UUID
    score: float
    submitted_at: datetime
