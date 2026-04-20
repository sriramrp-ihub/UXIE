from uuid import UUID

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.cache.cache_service import CacheService
from app.core.config import get_settings
from app.db.models.course import Course, Lesson, Module
from app.db.models.enrollment import Enrollment
from app.db.models.progress import Progress
from app.db.models.quiz import Quiz, QuizAttempt
from app.db.models.scorm import ScormTracking
from app.db.models.user import User

settings = get_settings()
QUIZ_ATTEMPT_SECONDS = 900


class AnalyticsService:
    @staticmethod
    def course_analytics(db: Session, course_id: UUID) -> dict:
        total_lessons_stmt = (
            select(func.count(Lesson.id))
            .join(Module, Module.id == Lesson.module_id)
            .where(Module.course_id == course_id)
        )
        total_lessons = db.scalar(total_lessons_stmt) or 0

        total_enrolled = db.scalar(
            select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)
        ) or 0

        completed_rows = db.scalar(
            select(func.count(Progress.id))
            .join(Lesson, Lesson.id == Progress.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .where(Module.course_id == course_id, Progress.completed.is_(True))
        ) or 0

        completion_pct = 0.0
        if total_lessons > 0 and total_enrolled > 0:
            completion_pct = (completed_rows / (total_lessons * total_enrolled)) * 100

        avg_score = db.scalar(
            select(func.avg(QuizAttempt.score))
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .where(Quiz.course_id == course_id)
        )

        time_spent = db.scalar(
            select(func.sum(ScormTracking.time_spent)).where(ScormTracking.course_id == course_id)
        ) or 0

        return {
            "course_id": str(course_id),
            "completion_percentage": round(completion_pct, 2),
            "average_score": round(float(avg_score or 0.0), 2),
            "time_spent": int(time_spent),
        }

    @staticmethod
    def user_dashboard(db: Session, user_id: UUID) -> dict:
        cache_key = f"dashboard:user:{user_id}"
        cached = CacheService.get_json(cache_key)
        if cached is not None:
            return cached

        enrolled_courses = db.scalar(
            select(func.count(Enrollment.id)).where(Enrollment.user_id == user_id)
        ) or 0

        avg_score = db.scalar(
            select(func.avg(QuizAttempt.score)).where(QuizAttempt.user_id == user_id)
        ) or 0.0

        total_time_spent = db.scalar(
            select(func.sum(ScormTracking.time_spent)).where(ScormTracking.user_id == user_id)
        ) or 0

        quiz_attempts_count = db.scalar(
            select(func.count(QuizAttempt.id)).where(QuizAttempt.user_id == user_id)
        ) or 0
        quiz_time_spent = int(quiz_attempts_count) * QUIZ_ATTEMPT_SECONDS

        completed_lessons = db.scalar(
            select(func.count(Progress.id)).where(
                Progress.user_id == user_id,
                Progress.completed.is_(True),
            )
        ) or 0

        total_lessons = db.scalar(
            select(func.count(Lesson.id))
            .join(Module, Module.id == Lesson.module_id)
            .join(Course, Course.id == Module.course_id)
            .join(Enrollment, Enrollment.course_id == Course.id)
            .where(Enrollment.user_id == user_id)
        ) or 0

        completion_percentage = 0.0
        if total_lessons > 0:
            completion_percentage = (float(completed_lessons) / float(total_lessons)) * 100.0

        data = {
            "user_id": str(user_id),
            "enrolled_courses": int(enrolled_courses),
            "average_score": round(float(avg_score), 2),
            "time_spent": int(total_time_spent) + quiz_time_spent,
            "completed_lessons": int(completed_lessons),
            "completion_percentage": round(completion_percentage, 2),
        }
        CacheService.set_json(cache_key, data, settings.cache_ttl_short)
        return data

    @staticmethod
    def global_dashboard(db: Session) -> dict:
        cache_key = "dashboard:global"
        cached = CacheService.get_json(cache_key)
        if cached is not None:
            return cached

        total_users = db.scalar(select(func.count(User.id))) or 0
        total_courses = db.scalar(select(func.count(Course.id))) or 0
        total_enrollments = db.scalar(select(func.count(Enrollment.id))) or 0
        active_users = CacheService.get_active_users(settings.active_user_window_seconds)
        avg_score = db.scalar(select(func.avg(QuizAttempt.score))) or 0.0

        total_completed_lessons = db.scalar(
            select(func.count(Progress.id)).where(Progress.completed.is_(True))
        ) or 0
        total_lessons = db.scalar(select(func.count(Lesson.id))) or 0
        completion_percentage = 0.0
        if total_lessons > 0 and total_users > 0:
            completion_percentage = (float(total_completed_lessons) / float(total_lessons * total_users)) * 100.0

        total_time_spent = db.scalar(select(func.sum(ScormTracking.time_spent))) or 0
        total_quiz_attempts = db.scalar(select(func.count(QuizAttempt.id))) or 0
        total_time_spent = int(total_time_spent) + (int(total_quiz_attempts) * QUIZ_ATTEMPT_SECONDS)

        data = {
            "total_users": int(total_users),
            "total_courses": int(total_courses),
            "total_enrollments": int(total_enrollments),
            "active_users": int(active_users),
            "average_score": round(float(avg_score), 2),
            "completion_percentage": round(completion_percentage, 2),
            "time_spent": int(total_time_spent),
        }
        CacheService.set_json(cache_key, data, settings.cache_ttl_medium)
        return data

    @staticmethod
    def get_active_users_count() -> int:
        return CacheService.get_active_users(settings.active_user_window_seconds)

    @staticmethod
    def time_spent_by_user(db: Session, user_id: UUID) -> dict:
        total_scorm_time = db.scalar(
            select(func.sum(ScormTracking.time_spent)).where(ScormTracking.user_id == user_id)
        ) or 0

        by_course_rows = db.execute(
            select(
                ScormTracking.course_id,
                func.sum(ScormTracking.time_spent),
                Course.title,
            )
            .join(Course, Course.id == ScormTracking.course_id)
            .where(ScormTracking.user_id == user_id)
            .group_by(ScormTracking.course_id, Course.title)
        ).all()

        quiz_rows = db.execute(
            select(
                Quiz.course_id,
                func.count(QuizAttempt.id),
            )
            .select_from(QuizAttempt)
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .where(QuizAttempt.user_id == user_id)
            .group_by(Quiz.course_id)
        ).all()

        course_time_map: dict[UUID, dict] = {
            course_id: {
                "course_id": str(course_id),
                "course_title": course_title,
                "scorm_time_spent": int(time_spent or 0),
                "quiz_time_spent": 0,
            }
            for course_id, time_spent, course_title in by_course_rows
        }

        for course_id, attempt_count in quiz_rows:
            course = db.get(Course, course_id)
            bucket = course_time_map.setdefault(
                course_id,
                {
                    "course_id": str(course_id),
                    "course_title": course.title if course else "Course",
                    "scorm_time_spent": 0,
                    "quiz_time_spent": 0,
                },
            )
            bucket["quiz_time_spent"] = int(attempt_count or 0) * QUIZ_ATTEMPT_SECONDS

        courses = []
        for bucket in course_time_map.values():
            total = int(bucket["scorm_time_spent"]) + int(bucket["quiz_time_spent"])
            courses.append(
                {
                    "course_id": bucket["course_id"],
                    "course_title": bucket["course_title"],
                    "time_spent": total,
                }
            )

        total_quiz_time = sum(item["quiz_time_spent"] for item in course_time_map.values())

        return {
            "user_id": str(user_id),
            "total_time_spent": int(total_scorm_time) + int(total_quiz_time),
            "courses": courses,
        }
