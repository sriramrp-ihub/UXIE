from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.cache.cache_service import CacheService
from app.core.config import get_settings
from app.db.models.course import Course, Lesson, Module
from app.db.models.enrollment import Enrollment
from app.db.models.progress import Progress
from app.db.models.quiz import Quiz, QuizAttempt
from app.db.models.scorm import ScormInteraction, ScormTracking
from app.db.models.user import User
from app.services.course_service import CourseService

settings = get_settings()
QUIZ_ATTEMPT_SECONDS = 900


class AnalyticsService:
    @staticmethod
    def course_analytics(db: Session, course_id: UUID) -> dict:
        enrolled_user_ids = db.scalars(
            select(Enrollment.user_id).where(Enrollment.course_id == course_id)
        ).all()
        total_enrolled = len(enrolled_user_ids)

        total_completed_units = 0
        total_units = 0
        for user_id in enrolled_user_ids:
            completed_units, units = CourseService.get_user_course_effective_progress(
                db,
                user_id,
                course_id,
            )
            total_completed_units += int(completed_units)
            total_units += int(units)

        completion_pct = 0.0
        if total_enrolled > 0 and total_units > 0:
            completion_pct = (float(total_completed_units) / float(total_units)) * 100.0

        avg_score = db.scalar(
            select(func.avg(QuizAttempt.score))
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .where(Quiz.course_id == course_id)
        )

        time_spent = db.scalar(
            select(func.sum(ScormTracking.time_spent)).where(ScormTracking.course_id == course_id)
        ) or 0

        average_time_spent = 0
        if total_enrolled > 0:
            average_time_spent = int(float(time_spent) / float(total_enrolled))

        return {
            "course_id": str(course_id),
            "completion_rate": round(completion_pct, 2),
            "completion_percentage": round(completion_pct, 2),
            "average_score": round(float(avg_score or 0.0), 2),
            "average_time_spent": int(average_time_spent),
            "time_spent": int(time_spent),
        }

    @staticmethod
    def course_detailed_analytics(db: Session, course_id: UUID) -> dict:
        cache_key = f"analytics:course:{course_id}:detailed"
        cached = CacheService.get_json(cache_key)
        if cached is not None:
            return cached

        course = db.get(Course, course_id)
        if not course:
            empty_payload = {
                "course_id": str(course_id),
                "course_title": None,
                "enrolled_students": 0,
                "completion_rate": 0.0,
                "average_score": 0.0,
                "average_time_spent": 0,
                "learners": [],
            }
            CacheService.set_json(cache_key, empty_payload, settings.cache_ttl_short)
            return empty_payload

        enrolled_rows = db.execute(
            select(User.id, User.name, User.email)
            .join(Enrollment, Enrollment.user_id == User.id)
            .where(Enrollment.course_id == course_id)
            .order_by(User.name.asc())
        ).all()

        learners: list[dict] = []
        for user_id, name, email in enrolled_rows:
            tracking_rows = db.execute(
                select(
                    ScormTracking.lesson_id,
                    ScormTracking.time_spent,
                    Lesson.title,
                    Module.id,
                    Module.title,
                )
                .join(Lesson, Lesson.id == ScormTracking.lesson_id)
                .join(Module, Module.id == Lesson.module_id)
                .where(
                    ScormTracking.user_id == user_id,
                    ScormTracking.course_id == course_id,
                )
            ).all()

            module_map: dict[UUID, dict] = {}
            total_scorm_time = 0
            for lesson_id, time_spent, lesson_title, module_id, module_title in tracking_rows:
                lesson_time = int(time_spent or 0)
                total_scorm_time += lesson_time

                bucket = module_map.setdefault(
                    module_id,
                    {
                        "module_id": str(module_id),
                        "module_title": module_title,
                        "time_spent": 0,
                        "lessons": [],
                    },
                )
                bucket["time_spent"] += lesson_time
                bucket["lessons"].append(
                    {
                        "lesson_id": str(lesson_id),
                        "lesson_title": lesson_title,
                        "time_spent": lesson_time,
                    }
                )

            quiz_attempt_count = db.scalar(
                select(func.count(QuizAttempt.id))
                .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
                .where(
                    Quiz.course_id == course_id,
                    QuizAttempt.user_id == user_id,
                )
            ) or 0
            quiz_time_spent = int(quiz_attempt_count) * QUIZ_ATTEMPT_SECONDS

            average_score = db.scalar(
                select(func.avg(QuizAttempt.score))
                .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
                .where(
                    Quiz.course_id == course_id,
                    QuizAttempt.user_id == user_id,
                )
            ) or 0.0

            completion_percentage = CourseService.get_course_completion_percentage(
                db,
                user_id,
                course_id,
            )

            module_breakdown = sorted(
                module_map.values(),
                key=lambda row: row["module_title"].lower() if row["module_title"] else "",
            )

            learners.append(
                {
                    "user_id": str(user_id),
                    "name": name,
                    "email": email,
                    "completion_percentage": float(completion_percentage),
                    "average_score": round(float(average_score), 2),
                    "scorm_time_spent": total_scorm_time,
                    "quiz_time_spent": quiz_time_spent,
                    "total_time_spent": total_scorm_time + quiz_time_spent,
                    "modules": module_breakdown,
                }
            )

        average_score_course = db.scalar(
            select(func.avg(QuizAttempt.score))
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .where(Quiz.course_id == course_id)
        ) or 0.0

        completion_rate = 0.0
        if enrolled_rows:
            completion_total = sum(float(row["completion_percentage"]) for row in learners)
            completion_rate = completion_total / float(len(enrolled_rows))

        average_time_spent = 0
        if learners:
            average_time_spent = int(
                sum(int(row["total_time_spent"]) for row in learners) / len(learners)
            )

        payload = {
            "course_id": str(course_id),
            "course_title": course.title,
            "enrolled_students": len(enrolled_rows),
            "completion_rate": round(completion_rate, 2),
            "average_score": round(float(average_score_course), 2),
            "average_time_spent": int(average_time_spent),
            "learners": learners,
        }
        CacheService.set_json(cache_key, payload, settings.cache_ttl_short)
        return payload

    @staticmethod
    def question_analytics(db: Session, course_id: UUID) -> dict:
        cache_key = f"analytics:course:{course_id}:questions"
        cached = CacheService.get_json(cache_key)
        if cached is not None:
            return cached

        rows = db.execute(
            select(
                ScormInteraction.question_id,
                func.count(ScormInteraction.id).label("attempts"),
                func.sum(
                    case((func.lower(ScormInteraction.result) == "correct", 1), else_=0)
                ).label("correct_count"),
                func.sum(
                    case((func.lower(ScormInteraction.result) != "correct", 1), else_=0)
                ).label("failed_count"),
                func.avg(ScormInteraction.latency).label("avg_latency"),
            )
            .where(ScormInteraction.course_id == course_id)
            .group_by(ScormInteraction.question_id)
        ).all()

        questions: list[dict] = []
        for question_id, attempts, correct_count, failed_count, avg_latency in rows:
            attempts_value = int(attempts or 0)
            correct_value = int(correct_count or 0)
            failed_value = int(failed_count or 0)
            accuracy_pct = 0.0
            if attempts_value > 0:
                accuracy_pct = (float(correct_value) / float(attempts_value)) * 100.0

            questions.append(
                {
                    "question_id": question_id,
                    "attempts": attempts_value,
                    "correct_count": correct_value,
                    "failed_count": failed_value,
                    "accuracy_percentage": round(accuracy_pct, 2),
                    "average_latency": int(float(avg_latency or 0.0)),
                }
            )

        most_failed_questions = sorted(
            questions,
            key=lambda row: row["failed_count"],
            reverse=True,
        )[:10]

        average_latency_per_question = {
            row["question_id"]: row["average_latency"] for row in questions
        }
        question_accuracy = {
            row["question_id"]: row["accuracy_percentage"] for row in questions
        }

        payload = {
            "course_id": str(course_id),
            "most_failed_questions": most_failed_questions,
            "average_latency_per_question": average_latency_per_question,
            "question_accuracy_percentage": question_accuracy,
            "questions": questions,
        }
        CacheService.set_json(cache_key, payload, settings.cache_ttl_short)
        return payload

    @staticmethod
    def user_performance(db: Session, user_id: UUID) -> dict:
        cache_key = f"analytics:user:{user_id}:performance"
        cached = CacheService.get_json(cache_key)
        if cached is not None:
            return cached

        learning_time = db.scalar(
            select(func.sum(ScormTracking.time_spent)).where(ScormTracking.user_id == user_id)
        ) or 0

        weak_topic_rows = db.execute(
            select(
                ScormInteraction.question_id,
                func.count(ScormInteraction.id).label("attempts"),
                func.sum(
                    case((func.lower(ScormInteraction.result) == "correct", 1), else_=0)
                ).label("correct_count"),
            )
            .where(ScormInteraction.user_id == user_id)
            .group_by(ScormInteraction.question_id)
        ).all()

        weak_topics: list[dict] = []
        for question_id, attempts, correct_count in weak_topic_rows:
            attempts_value = int(attempts or 0)
            correct_value = int(correct_count or 0)
            accuracy_pct = 0.0
            if attempts_value > 0:
                accuracy_pct = (float(correct_value) / float(attempts_value)) * 100.0
            if attempts_value >= 2 and accuracy_pct < 60.0:
                weak_topics.append(
                    {
                        "question_id": question_id,
                        "attempts": attempts_value,
                        "accuracy_percentage": round(accuracy_pct, 2),
                    }
                )

        trend_rows = db.execute(
            select(
                func.date(ScormInteraction.created_at).label("day"),
                func.count(ScormInteraction.id).label("attempts"),
                func.sum(
                    case((func.lower(ScormInteraction.result) == "correct", 1), else_=0)
                ).label("correct_count"),
            )
            .where(ScormInteraction.user_id == user_id)
            .group_by(func.date(ScormInteraction.created_at))
            .order_by(func.date(ScormInteraction.created_at).asc())
        ).all()

        performance_trend: list[dict] = []
        for day, attempts, correct_count in trend_rows:
            attempts_value = int(attempts or 0)
            correct_value = int(correct_count or 0)
            accuracy_pct = 0.0
            if attempts_value > 0:
                accuracy_pct = (float(correct_value) / float(attempts_value)) * 100.0

            performance_trend.append(
                {
                    "date": day.isoformat() if hasattr(day, "isoformat") else str(day),
                    "attempts": attempts_value,
                    "accuracy_percentage": round(accuracy_pct, 2),
                }
            )

        payload = {
            "user_id": str(user_id),
            "learning_time": int(learning_time),
            "weak_topics": weak_topics,
            "performance_trend": performance_trend,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        CacheService.set_json(cache_key, payload, settings.cache_ttl_short)
        return payload

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

        enrolled_course_ids = db.scalars(
            select(Enrollment.course_id).where(Enrollment.user_id == user_id)
        ).all()

        completed_lessons = 0
        total_lessons = 0
        for course_id in enrolled_course_ids:
            completed_units, total_units = CourseService.get_user_course_effective_progress(
                db,
                user_id,
                course_id,
            )
            completed_lessons += int(completed_units)
            total_lessons += int(total_units)

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
