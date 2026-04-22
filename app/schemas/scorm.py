from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ScormPackageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    lesson_id: UUID | None
    title: str
    version: str
    launch_file: str
    extracted_path: str
    file_path: str
    created_at: datetime


class ScormUploadResultOut(ScormPackageOut):
    activity_count: int
    is_single_sco: bool
    health_warning: str | None = None


class ScormActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    package_id: UUID
    identifier: str
    title: str
    launch_url: str


class ScormRegistrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    package_id: UUID
    started_at: datetime
    completed_at: datetime | None
    status: str


class ScormInitializeOut(BaseModel):
    session_id: UUID
    registration: ScormRegistrationOut
    package: ScormPackageOut
    activities: list[ScormActivityOut]
    runtime_data: dict[str, str]


class ScormRuntimeSetRequest(BaseModel):
    key: str = Field(min_length=1, max_length=255)
    value: str = Field(default="", max_length=4096)


class ScormRuntimeSetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    registration_id: UUID
    key: str
    value: str
    updated_at: datetime


class ScormRuntimeValuesOut(BaseModel):
    registration_id: UUID
    data: dict[str, str]


class ScormReportOut(BaseModel):
    completion: int
    status: str
    score: float | None
    timeSpent: int
    lastAccessed: datetime
