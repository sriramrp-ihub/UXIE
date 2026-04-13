from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.cache.cache_service import CacheService
from app.core.config import get_settings
from app.db.models.course import Course, Lesson, Module
from app.db.models.enrollment import Enrollment
from app.db.models.progress import Progress
from app.db.models.quiz import Question, Quiz, QuizAttempt
from app.db.models.user import User
from app.schemas.course import CourseCreate, LessonCreate, ModuleCreate, ProgressUpdate
from app.schemas.quiz import QuizSubmitRequest

settings = get_settings()


class CourseService:
    @staticmethod
    def create_course(db: Session, instructor: User, payload: CourseCreate) -> Course:
        course = Course(
            title=payload.title,
            description=payload.description,
            instructor_id=instructor.id,
        )
        db.add(course)
        db.commit()
        db.refresh(course)

        CacheService.delete_key("courses:all")
        CacheService.delete_key("dashboard:global")
        return course

    @staticmethod
    def list_courses(db: Session) -> list[Course]:
        cached = CacheService.get_json("courses:all")
        if cached is not None:
            return cached

        courses = db.scalars(select(Course).order_by(Course.created_at.desc())).all()
        serialized = [
            {
                "id": str(c.id),
                "title": c.title,
                "description": c.description,
                "instructor_id": str(c.instructor_id),
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in courses
        ]
        CacheService.set_json("courses:all", serialized, settings.cache_ttl_medium)
        return courses

    @staticmethod
    def get_course(db: Session, course_id: UUID) -> Course | dict:
        cache_key = f"course:{course_id}"
        cached = CacheService.get_json(cache_key)
        if cached is not None:
            return cached

        course = db.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

        CacheService.set_json(
            cache_key,
            {
                "id": str(course.id),
                "title": course.title,
                "description": course.description,
                "instructor_id": str(course.instructor_id),
                "created_at": course.created_at.isoformat() if course.created_at else None,
            },
            settings.cache_ttl_medium,
        )
        return course

    @staticmethod
    def create_module(db: Session, payload: ModuleCreate) -> Module:
        course = db.get(Course, payload.course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

        module = Module(
            course_id=payload.course_id,
            title=payload.title,
            order_index=payload.order_index,
        )
        db.add(module)
        db.commit()
        db.refresh(module)

        CacheService.delete_key(f"course:{payload.course_id}")
        return module

    @staticmethod
    def create_lesson(db: Session, payload: LessonCreate) -> Lesson:
        module = db.get(Module, payload.module_id)
        if not module:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

        lesson = Lesson(
            module_id=payload.module_id,
            title=payload.title,
            content_type=payload.content_type,
            content_url=payload.content_url,
        )
        db.add(lesson)
        db.commit()
        db.refresh(lesson)

        CacheService.delete_key(f"course:{module.course_id}")
        return lesson

    @staticmethod
    def enroll_user(db: Session, user: User, course_id: UUID) -> Enrollment:
        course = db.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

        existing = db.scalar(
            select(Enrollment).where(
                Enrollment.user_id == user.id,
                Enrollment.course_id == course_id,
            )
        )
        if existing:
            return existing

        enrollment = Enrollment(user_id=user.id, course_id=course_id)
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        CacheService.delete_key(f"dashboard:user:{user.id}")
        return enrollment

    @staticmethod
    def get_my_courses(db: Session, user: User) -> list[Course]:
        stmt = (
            select(Course)
            .join(Enrollment, Enrollment.course_id == Course.id)
            .where(Enrollment.user_id == user.id)
            .order_by(Course.created_at.desc())
        )
        return db.scalars(stmt).all()

    @staticmethod
    def update_progress(db: Session, user: User, payload: ProgressUpdate) -> Progress:
        progress = db.scalar(
            select(Progress).where(
                Progress.user_id == user.id,
                Progress.lesson_id == payload.lesson_id,
            )
        )

        now = datetime.now(timezone.utc)
        if progress is None:
            progress = Progress(
                user_id=user.id,
                lesson_id=payload.lesson_id,
                completed=payload.completed,
                completed_at=now if payload.completed else None,
            )
            db.add(progress)
        else:
            progress.completed = payload.completed
            progress.completed_at = now if payload.completed else None
            db.add(progress)

        db.commit()
        db.refresh(progress)
        CacheService.delete_key(f"dashboard:user:{user.id}")
        return progress

    @staticmethod
    def get_course_progress(db: Session, user: User, course_id: UUID) -> list[Progress]:
        stmt = (
            select(Progress)
            .join(Lesson, Lesson.id == Progress.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .where(Module.course_id == course_id, Progress.user_id == user.id)
        )
        return db.scalars(stmt).all()

    @staticmethod
    def get_quiz_by_course(db: Session, course_id: UUID) -> Quiz:
        quiz = db.scalar(select(Quiz).where(Quiz.course_id == course_id))
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
        return quiz

    @staticmethod
    def submit_quiz(db: Session, user: User, payload: QuizSubmitRequest) -> QuizAttempt:
        quiz = db.get(Quiz, payload.quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        questions = db.scalars(select(Question).where(Question.quiz_id == quiz.id)).all()
        if not questions:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No questions")

        answer_map = {a.question_id: a.answer for a in payload.answers}
        correct_count = 0
        for q in questions:
            if answer_map.get(q.id) == q.correct_answer:
                correct_count += 1

        score = (correct_count / len(questions)) * 100
        attempt = QuizAttempt(user_id=user.id, quiz_id=quiz.id, score=score)
        db.add(attempt)
        db.commit()
        db.refresh(attempt)

        CacheService.delete_key(f"dashboard:user:{user.id}")
        CacheService.delete_key("dashboard:global")
        return attempt

    @staticmethod
    def get_average_course_score(db: Session, course_id: UUID) -> float:
        stmt = (
            select(func.avg(QuizAttempt.score))
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .where(Quiz.course_id == course_id)
        )
        value = db.scalar(stmt)
        return float(value or 0.0)
