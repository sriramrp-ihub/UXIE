from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session

from app.cache.cache_service import CacheService
from app.core.config import get_settings
from app.db.models.course import Course, Lesson, Module
from app.db.models.enrollment import Enrollment
from app.db.models.progress import Progress
from app.db.models.quiz import Question, Quiz, QuizAttempt
from app.db.models.scorm import ScormActivity, ScormPackage
from app.db.models.user import User
from app.schemas.course import CourseCreate, LessonCreate, ModuleCreate, ProgressUpdate
from app.schemas.quiz import QuizSubmitRequest

settings = get_settings()


class CourseService:
    @staticmethod
    def get_course_effective_units(db: Session, course_id: UUID) -> tuple[int, int]:
        """
        Returns (completed_units, total_units) for learner completion calculations.

        Rationale:
        - Non-SCORM lessons are counted directly.
        - SCORM content can represent multiple internal activities while being modeled as
          a single LMS lesson row. To avoid inflated 100% completion, effective SCORM
          denominator uses max(scorm_lessons, scorm_activities).
        """

        non_scorm_lessons = int(
            db.scalar(
                select(func.count(Lesson.id))
                .join(Module, Module.id == Lesson.module_id)
                .where(
                    Module.course_id == course_id,
                    Lesson.content_type != "scorm",
                )
            )
            or 0
        )

        scorm_lessons = int(
            db.scalar(
                select(func.count(Lesson.id))
                .join(Module, Module.id == Lesson.module_id)
                .where(
                    Module.course_id == course_id,
                    Lesson.content_type == "scorm",
                )
            )
            or 0
        )

        scorm_activities = int(
            db.scalar(
                select(func.count(ScormActivity.id))
                .join(ScormPackage, ScormPackage.id == ScormActivity.package_id)
                .where(ScormPackage.course_id == course_id)
            )
            or 0
        )

        total_units = non_scorm_lessons + max(scorm_lessons, scorm_activities)
        return (0, total_units)

    @staticmethod
    def get_user_course_effective_progress(db: Session, user_id: UUID, course_id: UUID) -> tuple[int, int]:
        non_scorm_completed = int(
            db.scalar(
                select(func.count(Progress.id))
                .join(Lesson, Lesson.id == Progress.lesson_id)
                .join(Module, Module.id == Lesson.module_id)
                .where(
                    Module.course_id == course_id,
                    Progress.user_id == user_id,
                    Progress.completed.is_(True),
                    Lesson.content_type != "scorm",
                )
            )
            or 0
        )

        scorm_completed_lessons = int(
            db.scalar(
                select(func.count(Progress.id))
                .join(Lesson, Lesson.id == Progress.lesson_id)
                .join(Module, Module.id == Lesson.module_id)
                .where(
                    Module.course_id == course_id,
                    Progress.user_id == user_id,
                    Progress.completed.is_(True),
                    Lesson.content_type == "scorm",
                )
            )
            or 0
        )

        non_scorm_lessons = int(
            db.scalar(
                select(func.count(Lesson.id))
                .join(Module, Module.id == Lesson.module_id)
                .where(
                    Module.course_id == course_id,
                    Lesson.content_type != "scorm",
                )
            )
            or 0
        )

        scorm_lessons = int(
            db.scalar(
                select(func.count(Lesson.id))
                .join(Module, Module.id == Lesson.module_id)
                .where(
                    Module.course_id == course_id,
                    Lesson.content_type == "scorm",
                )
            )
            or 0
        )

        scorm_activities = int(
            db.scalar(
                select(func.count(ScormActivity.id))
                .join(ScormPackage, ScormPackage.id == ScormActivity.package_id)
                .where(ScormPackage.course_id == course_id)
            )
            or 0
        )

        effective_scorm_total = max(scorm_lessons, scorm_activities)
        effective_scorm_completed = min(scorm_completed_lessons, effective_scorm_total)

        total_units = non_scorm_lessons + effective_scorm_total
        completed_units = non_scorm_completed + effective_scorm_completed
        return completed_units, total_units

    @staticmethod
    def _serialize_course(db: Session, course: Course) -> dict:
        instructor = db.get(User, course.instructor_id)
        modules_count = db.scalar(
            select(func.count(Module.id)).where(Module.course_id == course.id)
        ) or 0
        lessons_count = db.scalar(
            select(func.count(Lesson.id))
            .join(Module, Module.id == Lesson.module_id)
            .where(Module.course_id == course.id)
        ) or 0

        return {
            "id": str(course.id),
            "title": course.title,
            "description": course.description,
            "instructor_id": str(course.instructor_id),
            "instructor_name": instructor.name if instructor else None,
            "modules_count": int(modules_count),
            "lessons_count": int(lessons_count),
            "created_at": course.created_at.isoformat() if course.created_at else None,
        }

    @staticmethod
    def _can_access_course(db: Session, user: User, course_id: UUID) -> bool:
        if user.role == "admin":
            return True

        course = db.get(Course, course_id)
        if course is None:
            return False

        if user.role == "instructor" and course.instructor_id == user.id:
            return True

        enrollment_exists = db.scalar(
            select(
                exists().where(
                    Enrollment.user_id == user.id,
                    Enrollment.course_id == course_id,
                )
            )
        )
        return bool(enrollment_exists)

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
        serialized = [CourseService._serialize_course(db, c) for c in courses]
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

        structure = CourseService.get_course_structure(db, course_id)
        payload = {
            **CourseService._serialize_course(db, course),
            "modules": structure,
        }

        CacheService.set_json(
            cache_key,
            payload,
            settings.cache_ttl_medium,
        )
        return payload

    @staticmethod
    def get_course_structure(db: Session, course_id: UUID) -> list[dict]:
        course = db.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

        modules = db.scalars(
            select(Module)
            .where(Module.course_id == course_id)
            .order_by(Module.order_index.asc(), Module.title.asc())
        ).all()

        module_ids = [module.id for module in modules]
        lessons_by_module: dict[UUID, list[Lesson]] = {module.id: [] for module in modules}
        if module_ids:
            lessons = db.scalars(
                select(Lesson)
                .where(Lesson.module_id.in_(module_ids))
                .order_by(Lesson.title.asc())
            ).all()
            for lesson in lessons:
                lessons_by_module.setdefault(lesson.module_id, []).append(lesson)

        return [
            {
                "id": str(module.id),
                "course_id": str(module.course_id),
                "title": module.title,
                "order_index": module.order_index,
                "lessons": [
                    {
                        "id": str(lesson.id),
                        "module_id": str(lesson.module_id),
                        "title": lesson.title,
                        "content_type": lesson.content_type,
                        "content_url": lesson.content_url,
                    }
                    for lesson in lessons_by_module.get(module.id, [])
                ],
            }
            for module in modules
        ]

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
        CacheService.delete_key("courses:all")
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
        CacheService.delete_key("courses:all")
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
    def get_enrollment_payload(db: Session, enrollment: Enrollment) -> dict:
        course = db.get(Course, enrollment.course_id)
        return {
            "id": str(enrollment.id),
            "user_id": str(enrollment.user_id),
            "course_id": str(enrollment.course_id),
            "enrolled_at": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
            "course": {
                "id": str(course.id),
                "title": course.title,
            }
            if course
            else None,
            "message": f"Enrolled in {course.title}" if course else "Enrolled",
        }

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
        lesson = db.get(Lesson, payload.lesson_id)
        if lesson is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

        module = db.get(Module, lesson.module_id)
        if module is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

        if not CourseService._can_access_course(db, user, module.course_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this lesson",
            )

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
    def get_course_progress(db: Session, user: User, course_id: UUID) -> list[dict]:
        if not CourseService._can_access_course(db, user, course_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this course",
            )

        stmt = (
            select(Progress)
            .join(Lesson, Lesson.id == Progress.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .where(Module.course_id == course_id, Progress.user_id == user.id)
        )
        progress_rows = db.scalars(stmt).all()

        course = db.get(Course, course_id)
        lesson_lookup = {
            row.id: row
            for row in db.scalars(
                select(Lesson)
                .join(Module, Module.id == Lesson.module_id)
                .where(Module.course_id == course_id)
            ).all()
        }
        module_lookup = {
            row.id: row
            for row in db.scalars(select(Module).where(Module.course_id == course_id)).all()
        }

        completion = CourseService.get_course_completion_percentage(db, user.id, course_id)

        return [
            {
                "user_id": str(row.user_id),
                "lesson_id": str(row.lesson_id),
                "lesson_title": lesson_lookup.get(row.lesson_id).title
                if lesson_lookup.get(row.lesson_id)
                else None,
                "module_id": str(lesson_lookup.get(row.lesson_id).module_id)
                if lesson_lookup.get(row.lesson_id)
                else None,
                "module_title": module_lookup.get(lesson_lookup.get(row.lesson_id).module_id).title
                if lesson_lookup.get(row.lesson_id)
                and module_lookup.get(lesson_lookup.get(row.lesson_id).module_id)
                else None,
                "course_id": str(course_id),
                "course_title": course.title if course else None,
                "completed": row.completed,
                "completed_at": row.completed_at.isoformat() if row.completed_at else None,
                "completion_percentage": completion,
            }
            for row in progress_rows
        ]

    @staticmethod
    def get_course_completion_percentage(db: Session, user_id: UUID, course_id: UUID) -> int:
        completed_units, total_units = CourseService.get_user_course_effective_progress(
            db,
            user_id,
            course_id,
        )

        if int(total_units) <= 0:
            return 0

        return max(0, min(100, round((int(completed_units) / int(total_units)) * 100)))

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
    def build_quiz_payload(db: Session, quiz: Quiz, include_answers: bool = False) -> dict:
        course = db.get(Course, quiz.course_id)
        questions = db.scalars(select(Question).where(Question.quiz_id == quiz.id)).all()
        payload_questions = [
            {
                "id": str(question.id),
                "question": question.question,
                "options": question.options,
                **({"correct_answer": question.correct_answer} if include_answers else {}),
            }
            for question in questions
        ]
        return {
            "id": str(quiz.id),
            "course_id": str(quiz.course_id),
            "course_title": course.title if course else None,
            "question_count": len(payload_questions),
            "questions": payload_questions,
        }

    @staticmethod
    def build_quiz_attempt_payload(db: Session, attempt: QuizAttempt) -> dict:
        quiz = db.get(Quiz, attempt.quiz_id)
        course = db.get(Course, quiz.course_id) if quiz else None
        return {
            "id": str(attempt.id),
            "user_id": str(attempt.user_id),
            "quiz_id": str(attempt.quiz_id),
            "course_id": str(quiz.course_id) if quiz else None,
            "quiz_title": f"Quiz for {course.title}" if course else "Quiz",
            "course_title": course.title if course else None,
            "score": float(attempt.score),
            "passed": float(attempt.score) >= 60.0,
            "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
            "message": f"Score: {round(float(attempt.score), 2)} / 100",
        }

    @staticmethod
    def get_average_course_score(db: Session, course_id: UUID) -> float:
        stmt = (
            select(func.avg(QuizAttempt.score))
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .where(Quiz.course_id == course_id)
        )
        value = db.scalar(stmt)
        return float(value or 0.0)
