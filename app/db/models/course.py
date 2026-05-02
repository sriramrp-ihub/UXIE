import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    instructor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    instructor = relationship("User", back_populates="courses")
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship(
        "Enrollment", back_populates="course", cascade="all, delete-orphan"
    )
    scorm_packages = relationship(
        "ScormPackage", back_populates="course", cascade="all, delete-orphan"
    )
    scorm_trackings = relationship(
        "ScormTracking", back_populates="course", cascade="all, delete-orphan"
    )
    scorm_interactions = relationship(
        "ScormInteraction", back_populates="course", cascade="all, delete-orphan"
    )
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(50), nullable=False)
    content_url: Mapped[str] = mapped_column(String(1024), nullable=False)

    module = relationship("Module", back_populates="lessons")
    progress_records = relationship(
        "Progress", back_populates="lesson", cascade="all, delete-orphan"
    )
    scorm_trackings = relationship(
        "ScormTracking", back_populates="lesson", cascade="all, delete-orphan"
    )
    scorm_packages = relationship("ScormPackage", back_populates="lesson")
