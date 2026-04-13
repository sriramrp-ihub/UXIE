from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models.course import Course
from app.db.models.scorm import ScormPackage, ScormTracking
from app.db.models.user import User
from app.schemas.scorm import ScormTrackCreate
from app.utils.file_handler import (
    build_served_scorm_url,
    extract_scorm_zip,
    parse_imsmanifest,
    save_upload_to_disk,
)

settings = get_settings()


class ScormService:
    @staticmethod
    def upload_package(db: Session, course_id: UUID, file: UploadFile) -> ScormPackage:
        course = db.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

        if not file.filename or not file.filename.endswith(".zip"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only SCORM ZIP files are allowed",
            )

        raw_bytes = file.file.read()
        zip_path = save_upload_to_disk(raw_bytes, suffix=".zip")

        base_dir = Path(settings.scorm_storage_dir)
        base_dir.mkdir(parents=True, exist_ok=True)
        extract_dir = extract_scorm_zip(zip_path, base_dir)

        manifest_data = parse_imsmanifest(extract_dir / "imsmanifest.xml")
        launch_url = build_served_scorm_url(base_dir, extract_dir, manifest_data.get("launch"))

        package = ScormPackage(course_id=course_id, file_path=launch_url)
        db.add(package)
        db.commit()
        db.refresh(package)
        return package

    @staticmethod
    def track_progress(db: Session, user: User, payload: ScormTrackCreate) -> ScormTracking:
        record = db.scalar(
            select(ScormTracking).where(
                ScormTracking.user_id == user.id,
                ScormTracking.course_id == payload.course_id,
                ScormTracking.lesson_id == payload.lesson_id,
            )
        )

        if record is None:
            record = ScormTracking(
                user_id=user.id,
                course_id=payload.course_id,
                lesson_id=payload.lesson_id,
                completion_status=payload.completion_status,
                score=payload.score,
                time_spent=payload.time_spent,
            )
            db.add(record)
        else:
            record.completion_status = payload.completion_status
            record.score = payload.score
            record.time_spent = payload.time_spent
            db.add(record)

        db.commit()
        db.refresh(record)
        return record
