from pathlib import Path
from uuid import UUID
from datetime import datetime, timezone
import re

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.cache.cache_service import CacheService
from app.core.config import get_settings
from app.db.models.course import Course, Lesson, Module
from app.db.models.enrollment import Enrollment
from app.db.models.progress import Progress
from app.db.models.scorm import (
    ScormActivity,
    ScormPackage,
    ScormRegistration,
    ScormRuntimeData,
    ScormTracking,
)
from app.db.models.user import User
from app.schemas.scorm import ScormRuntimeSetRequest
from app.utils.file_handler import (
    build_served_scorm_url,
    extract_scorm_zip,
    parse_imsmanifest,
    save_upload_to_disk,
)

settings = get_settings()
RUNTIME_KEY_RE = re.compile(r"^cmi(\.|$)")


class ScormService:
    @staticmethod
    def _runtime_indicates_completion(runtime_values: dict[str, str]) -> bool:
        completion_values = [
            runtime_values.get("cmi.core.lesson_status"),
            runtime_values.get("cmi.lesson_status"),
            runtime_values.get("cmi.completion_status"),
            runtime_values.get("cmi.success_status"),
        ]
        normalized = {
            (value or "").strip().lower() for value in completion_values if value is not None
        }
        return any(token in normalized for token in {"completed", "passed", "true"})

    @staticmethod
    def _resolve_or_create_lesson_for_package(db: Session, package: ScormPackage) -> UUID | None:
        if package.lesson_id is not None:
            return package.lesson_id

        existing_lesson = db.scalar(
            select(Lesson)
            .join(Lesson.module)
            .where(
                Lesson.content_type == "scorm",
                Lesson.content_url == package.file_path,
                Lesson.module.has(course_id=package.course_id),
            )
        )
        if existing_lesson is not None:
            package.lesson_id = existing_lesson.id
            db.add(package)
            return existing_lesson.id

        course = db.get(Course, package.course_id)
        if course is None:
            return None

        target_module = db.scalar(
            select(Module)
            .where(Module.course_id == package.course_id)
            .order_by(Module.order_index.asc(), Module.title.asc())
        )

        if target_module is None:
            target_module = Module(
                course_id=package.course_id,
                title="SCORM Content",
                order_index=0,
            )
            db.add(target_module)
            db.flush()

        created_lesson = Lesson(
            module_id=target_module.id,
            title=package.title,
            content_type="scorm",
            content_url=package.file_path,
        )
        db.add(created_lesson)
        db.flush()

        package.lesson_id = created_lesson.id
        db.add(package)
        return created_lesson.id

    @staticmethod
    def _assert_course_access(db: Session, course: Course, user: User) -> None:
        if user.role == "admin":
            return

        if user.role == "instructor" and course.instructor_id == user.id:
            return

        enrollment = db.scalar(
            select(Enrollment).where(
                Enrollment.user_id == user.id,
                Enrollment.course_id == course.id,
            )
        )
        if enrollment is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course",
            )

    @staticmethod
    def list_packages_for_course(db: Session, course_id: UUID, user: User) -> list[ScormPackage]:
        course = db.get(Course, course_id)
        if course is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

        ScormService._assert_course_access(db, course, user)
        return db.scalars(
            select(ScormPackage)
            .where(ScormPackage.course_id == course_id)
            .order_by(ScormPackage.created_at.desc())
        ).all()

    @staticmethod
    def upload_package(
        db: Session,
        course_id: UUID,
        file: UploadFile,
        lesson_id: UUID | None = None,
        title: str | None = None,
        actor: User | None = None,
    ) -> ScormPackage:
        course = db.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

        if actor is not None and actor.role == "instructor" and course.instructor_id != actor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can upload SCORM only to your own courses",
            )

        if lesson_id is not None:
            lesson = db.get(Lesson, lesson_id)
            if lesson is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Lesson not found",
                )
            if lesson.module.course_id != course_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Lesson does not belong to the selected course",
                )

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

        try:
            manifest_data = parse_imsmanifest(extract_dir / "imsmanifest.xml")
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid SCORM manifest: {exc}",
            ) from exc

        launch_file = manifest_data.get("launch") or "index.html"
        launch_url = build_served_scorm_url(base_dir, extract_dir, launch_file)

        package = ScormPackage(
            course_id=course_id,
            lesson_id=lesson_id,
            title=(title or manifest_data.get("title") or "Untitled SCORM Package"),
            version="SCORM_1_2",
            launch_file=launch_file,
            extracted_path=str(extract_dir),
            file_path=launch_url,
        )
        db.add(package)
        db.flush()

        activities = manifest_data.get("activities") or []
        if not activities:
            activities = [
                {
                    "identifier": "default-sco",
                    "title": package.title,
                    "launch": launch_file,
                }
            ]

        for activity in activities:
            launch = activity.get("launch")
            if not launch:
                continue
            activity_url = build_served_scorm_url(base_dir, extract_dir, launch)
            db.add(
                ScormActivity(
                    package_id=package.id,
                    identifier=activity.get("identifier") or "sco",
                    title=activity.get("title") or package.title,
                    launch_url=activity_url,
                )
            )

        db.commit()
        db.refresh(package)
        return package

    @staticmethod
    def _assert_package_access(db: Session, package: ScormPackage, user: User) -> None:
        course = db.get(Course, package.course_id)
        if course is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        ScormService._assert_course_access(db, course, user)

    @staticmethod
    def initialize_registration(db: Session, package_id: UUID, user: User) -> ScormRegistration:
        package = db.get(ScormPackage, package_id)
        if package is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SCORM package not found")

        ScormService._assert_package_access(db, package, user)

        registration = db.scalar(
            select(ScormRegistration)
            .where(
                ScormRegistration.user_id == user.id,
                ScormRegistration.package_id == package_id,
            )
            .order_by(ScormRegistration.started_at.desc())
        )

        if registration is None:
            registration = ScormRegistration(
                user_id=user.id,
                package_id=package_id,
                status="IN_PROGRESS",
            )
            db.add(registration)
            db.flush()
            defaults = {
                "cmi.core.lesson_status": "not attempted",
                "cmi.core.score.raw": "",
                "cmi.core.score.min": "",
                "cmi.core.score.max": "",
                "cmi.core.session_time": "00:00:00",
                "cmi.suspend_data": "",
            }
            for key, value in defaults.items():
                db.add(ScormRuntimeData(registration_id=registration.id, key=key, value=value))
        elif registration.status == "NOT_STARTED":
            registration.status = "IN_PROGRESS"

        db.commit()
        db.refresh(registration)
        return registration

    @staticmethod
    def _get_registration_for_user(
        db: Session, registration_id: UUID, user: User
    ) -> ScormRegistration:
        registration = db.get(ScormRegistration, registration_id)
        if registration is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SCORM session not found")

        if registration.user_id != user.id and user.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        package = db.get(ScormPackage, registration.package_id)
        if package is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SCORM package not found")
        ScormService._assert_package_access(db, package, user)
        return registration

    @staticmethod
    def get_runtime_values(
        db: Session, registration_id: UUID, user: User, key: str | None = None
    ) -> dict[str, str]:
        registration = ScormService._get_registration_for_user(db, registration_id, user)
        query = select(ScormRuntimeData).where(ScormRuntimeData.registration_id == registration.id)
        if key:
            query = query.where(ScormRuntimeData.key == key)

        rows = db.scalars(query).all()
        return {row.key: row.value for row in rows}

    @staticmethod
    def set_runtime_value(
        db: Session, registration_id: UUID, user: User, payload: ScormRuntimeSetRequest
    ) -> ScormRuntimeData:
        if not RUNTIME_KEY_RE.match(payload.key):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid SCORM runtime key",
            )

        registration = ScormService._get_registration_for_user(db, registration_id, user)
        record = db.scalar(
            select(ScormRuntimeData).where(
                ScormRuntimeData.registration_id == registration.id,
                ScormRuntimeData.key == payload.key,
            )
        )

        if record is None:
            record = ScormRuntimeData(
                registration_id=registration.id,
                key=payload.key,
                value=payload.value,
            )
            db.add(record)
        else:
            record.value = payload.value
            db.add(record)

        if registration.status == "NOT_STARTED":
            registration.status = "IN_PROGRESS"

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def commit_runtime(db: Session, registration_id: UUID, user: User) -> dict:
        registration = ScormService._get_registration_for_user(db, registration_id, user)
        package = db.get(ScormPackage, registration.package_id)
        if package is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SCORM package not found")

        runtime_values = {
            row.key: row.value
            for row in db.scalars(
                select(ScormRuntimeData).where(ScormRuntimeData.registration_id == registration.id)
            ).all()
        }

        ScormService._sync_legacy_tracking(db, user.id, package, runtime_values)
        CacheService.delete_key(f"dashboard:user:{user.id}")
        CacheService.delete_key("dashboard:global")
        db.commit()
        return {"registration_id": str(registration.id), "committed": True}

    @staticmethod
    def finish_runtime(db: Session, registration_id: UUID, user: User) -> ScormRegistration:
        registration = ScormService._get_registration_for_user(db, registration_id, user)
        package = db.get(ScormPackage, registration.package_id)
        if package is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SCORM package not found")

        runtime_values = {
            row.key: row.value
            for row in db.scalars(
                select(ScormRuntimeData).where(ScormRuntimeData.registration_id == registration.id)
            ).all()
        }

        if ScormService._runtime_indicates_completion(runtime_values):
            registration.status = "COMPLETED"
        elif registration.status == "NOT_STARTED":
            registration.status = "IN_PROGRESS"

        if registration.completed_at is None:
            registration.completed_at = datetime.now(timezone.utc)

        ScormService._sync_legacy_tracking(db, user.id, package, runtime_values)
        ScormService._sync_lms_progress(db, user.id, package, registration.status)
        CacheService.delete_key(f"dashboard:user:{user.id}")
        CacheService.delete_key("dashboard:global")
        db.add(registration)
        db.commit()
        db.refresh(registration)
        return registration

    @staticmethod
    def _sync_lms_progress(db: Session, user_id: UUID, package: ScormPackage, status_value: str) -> None:
        lesson_id = ScormService._resolve_or_create_lesson_for_package(db, package)
        if lesson_id is None:
            return

        progress = db.scalar(
            select(Progress).where(
                Progress.user_id == user_id,
                Progress.lesson_id == lesson_id,
            )
        )
        completed = status_value == "COMPLETED"
        now = datetime.now(timezone.utc)

        if progress is None:
            db.add(
                Progress(
                    user_id=user_id,
                    lesson_id=lesson_id,
                    completed=completed,
                    completed_at=now if completed else None,
                )
            )
            return

        progress.completed = completed
        progress.completed_at = now if completed else None
        db.add(progress)

    @staticmethod
    def _sync_legacy_tracking(
        db: Session,
        user_id: UUID,
        package: ScormPackage,
        runtime_values: dict[str, str],
    ) -> None:
        if package.lesson_id is None:
            lesson_id = ScormService._resolve_or_create_lesson_for_package(db, package)
            if lesson_id is None:
                return
            package.lesson_id = lesson_id

        score_raw = runtime_values.get("cmi.core.score.raw")
        lesson_status = (
            runtime_values.get("cmi.core.lesson_status")
            or runtime_values.get("cmi.lesson_status")
            or runtime_values.get("cmi.completion_status")
            or runtime_values.get("cmi.success_status")
            or "incomplete"
        )
        session_time = runtime_values.get("cmi.core.session_time") or "00:00:00"
        time_spent = ScormService._parse_scorm_time_to_seconds(session_time)

        tracking = db.scalar(
            select(ScormTracking).where(
                ScormTracking.user_id == user_id,
                ScormTracking.course_id == package.course_id,
                ScormTracking.lesson_id == package.lesson_id,
            )
        )

        parsed_score: float | None = None
        if score_raw not in {None, ""}:
            try:
                parsed_score = float(score_raw)
            except ValueError:
                parsed_score = None

        if tracking is None:
            db.add(
                ScormTracking(
                    user_id=user_id,
                    course_id=package.course_id,
                    lesson_id=package.lesson_id,
                    completion_status=lesson_status,
                    score=parsed_score,
                    time_spent=time_spent,
                )
            )
            return

        tracking.completion_status = lesson_status
        tracking.score = parsed_score
        tracking.time_spent = time_spent
        db.add(tracking)

    @staticmethod
    def _parse_scorm_time_to_seconds(value: str) -> int:
        parts = value.split(":")
        if len(parts) != 3:
            return 0
        try:
            hours = int(parts[0])
            minutes = int(parts[1])
            seconds = int(float(parts[2]))
        except ValueError:
            return 0
        return max(0, (hours * 3600) + (minutes * 60) + seconds)

    @staticmethod
    def get_registration_report(db: Session, registration_id: UUID, user: User) -> dict:
        registration = ScormService._get_registration_for_user(db, registration_id, user)
        runtime_values = {
            row.key: row.value
            for row in db.scalars(
                select(ScormRuntimeData).where(ScormRuntimeData.registration_id == registration.id)
            ).all()
        }

        completion = 100 if ScormService._runtime_indicates_completion(runtime_values) else 0

        status_value = (
            runtime_values.get("cmi.core.lesson_status")
            or runtime_values.get("cmi.lesson_status")
            or runtime_values.get("cmi.completion_status")
            or registration.status
        )
        status_value = (status_value or "in_progress").strip().lower()

        score_raw = runtime_values.get("cmi.core.score.raw")
        score: float | None
        try:
            score = float(score_raw) if score_raw not in {None, ""} else None
        except ValueError:
            score = None

        session_time = runtime_values.get("cmi.core.session_time") or "00:00:00"
        time_spent = ScormService._parse_scorm_time_to_seconds(session_time)

        return {
            "completion": completion,
            "status": status_value,
            "score": score,
            "timeSpent": time_spent,
            "lastAccessed": registration.completed_at or registration.started_at,
        }
