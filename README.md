# LMS Backend (FastAPI)

Production-grade Learning Management System backend with SCORM support, analytics, JWT auth, and Redis cache-aside.

## Stack

- FastAPI (Python 3.11+)
- PostgreSQL + SQLAlchemy 2.0 ORM
- Alembic migrations
- Redis cache
- JWT (python-jose)
- Passlib bcrypt hashing
- Pydantic v2

## Quick start

1. Create and activate a virtual environment.
2. Install dependencies from `requirements.txt`.
3. Copy `.env.example` to `.env` and fill actual secrets.
4. Run DB migrations with Alembic.
5. Start API with Uvicorn:

	 `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

## API prefix

All APIs are mounted under: `/api/v1`

## Dummy frontend for testing

- Open `http://127.0.0.1:8000/sandbox/` for a lightweight API playground UI.
- It supports quick testing for auth, courses, enrollments, SCORM upload/tracking, progress, quiz, and analytics endpoints.

## Key endpoints

- Auth: `/auth/register`, `/auth/login`, `/auth/verify`
- Courses: `/courses`, `/courses/{course_id}`, `/courses/modules`, `/courses/lessons`
- Enrollment: `/enroll/{course_id}`, `/my-courses`
- SCORM: `/scorm/upload`, `/scorm/track`
- Progress: `/progress/update`, `/progress/{course_id}`
- Quiz: `/quiz/{course_id}`, `/quiz/submit`
- Analytics: `/analytics/course/{course_id}`, `/analytics/dashboard/me`, `/analytics/dashboard/global`

## Architecture

- `app/routes`: HTTP-only layer (request/response)
- `app/services`: business logic layer
- `app/db`: ORM models + DB setup
- `app/cache`: Redis access + cache patterns
- `app/core`: config, security, dependencies, response envelope

## Response format

```json
{
	"success": true,
	"data": {},
	"error": null
}
```

## Notes

- SCORM extracted files are served from `/scorm-content/...`
- Active users are tracked in Redis sorted set `active_users`
- Cache keys include: `courses:all`, `course:{id}`, `dashboard:user:{id}`, `dashboard:global`, `active_users`
