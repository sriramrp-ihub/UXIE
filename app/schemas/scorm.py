from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ScormPackageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    file_path: str
    created_at: datetime


class ScormTrackCreate(BaseModel):
    course_id: UUID
    lesson_id: UUID
    completion_status: str = Field(min_length=1, max_length=50)
    score: float | None = None
    time_spent: int = Field(default=0, ge=0)


class ScormTrackingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    course_id: UUID
    lesson_id: UUID
    completion_status: str
    score: float | None
    time_spent: int
    last_accessed: datetime
