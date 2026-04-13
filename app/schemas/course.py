from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CourseCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=5000)


class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None
    instructor_id: UUID
    created_at: datetime


class ModuleCreate(BaseModel):
    course_id: UUID
    title: str = Field(min_length=2, max_length=255)
    order_index: int = Field(default=0, ge=0)


class ModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    title: str
    order_index: int


class LessonCreate(BaseModel):
    module_id: UUID
    title: str = Field(min_length=2, max_length=255)
    content_type: str = Field(pattern="^(video|text|scorm)$")
    content_url: str = Field(min_length=1, max_length=1024)


class LessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    module_id: UUID
    title: str
    content_type: str
    content_url: str


class EnrollmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    course_id: UUID
    enrolled_at: datetime


class ProgressUpdate(BaseModel):
    lesson_id: UUID
    completed: bool


class ProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    lesson_id: UUID
    completed: bool
    completed_at: datetime | None
