import uuid

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class ScormPackage(Base):
    __tablename__ = "scorm_packages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    lesson_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled SCORM Package")
    version: Mapped[str] = mapped_column(String(32), nullable=False, default="SCORM_1_2")
    launch_file: Mapped[str] = mapped_column(String(1024), nullable=False, default="index.html")
    extracted_path: Mapped[str] = mapped_column(String(2048), nullable=False, default="")
    file_path: Mapped[str] = mapped_column(String(2048), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    course = relationship("Course", back_populates="scorm_packages")
    lesson = relationship("Lesson", back_populates="scorm_packages")
    activities = relationship(
        "ScormActivity", back_populates="package", cascade="all, delete-orphan"
    )
    registrations = relationship(
        "ScormRegistration", back_populates="package", cascade="all, delete-orphan"
    )


class ScormActivity(Base):
    __tablename__ = "scorm_activities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    package_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scorm_packages.id", ondelete="CASCADE"), nullable=False
    )
    identifier: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    launch_url: Mapped[str] = mapped_column(String(2048), nullable=False)

    package = relationship("ScormPackage", back_populates="activities")


class ScormRegistration(Base):
    __tablename__ = "scorm_registrations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    package_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scorm_packages.id", ondelete="CASCADE"), nullable=False
    )
    started_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="NOT_STARTED")

    user = relationship("User", back_populates="scorm_registrations")
    package = relationship("ScormPackage", back_populates="registrations")
    runtime_data = relationship(
        "ScormRuntimeData", back_populates="registration", cascade="all, delete-orphan"
    )


class ScormRuntimeData(Base):
    __tablename__ = "scorm_runtime_data"
    __table_args__ = (
        UniqueConstraint("registration_id", "key", name="uq_scorm_runtime_registration_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    registration_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scorm_registrations.id", ondelete="CASCADE"),
        nullable=False,
    )
    key: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[str] = mapped_column(String(4096), nullable=False, default="")
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    registration = relationship("ScormRegistration", back_populates="runtime_data")


class ScormTracking(Base):
    __tablename__ = "scorm_trackings"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", "lesson_id", name="uq_scorm_track"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    completion_status: Mapped[str] = mapped_column(String(50), nullable=False)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    time_spent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_accessed: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="scorm_trackings")
    course = relationship("Course", back_populates="scorm_trackings")
    lesson = relationship("Lesson", back_populates="scorm_trackings")
