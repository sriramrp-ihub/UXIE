# UXIE LMS — Full Documentation

This document provides complete technical documentation for the current UXIE LMS codebase.

> **Important:** The current repository backend is implemented with **FastAPI + SQLAlchemy + PostgreSQL + Redis** (not NestJS/Prisma).

---

## 1) System Overview

UXIE LMS is a backend-first Learning Management System with a static frontend portal and SCORM 1.2 runtime support.

### Core capabilities

- User auth and role-based access (`student`, `instructor`, `admin`)
- Course creation and enrollment
- Module/lesson authoring
- Progress tracking
- Quiz retrieval and submission
- Analytics dashboards
- SCORM package upload, launch, runtime tracking, and completion persistence
- BFSI-focused chatbot (web + Telegram integrations)
- Multi-layer chatbot guardrails (keyword + semantic fallback)
- Finance logic layer for input intent control and output safety formatting

### High-level architecture

- **Backend:** FastAPI (`app/main.py`)
- **ORM:** SQLAlchemy 2.x
- **DB migrations:** Alembic
- **DB:** PostgreSQL
- **Cache/activity:** Redis
- **Frontend:** static HTML/CSS/JS served under `/sandbox`
- **SCORM content serving:** static files mounted at `/scorm-content`
- **Chatbot endpoint:** `/api/v1/chat`

---

## 2) Repository Structure

- `app/main.py` — FastAPI app, routers, middleware, static mounts
- `app/core/` — config, auth/security, dependencies, response envelope
- `app/routes/` — HTTP endpoint layer
- `app/services/` — business logic layer
- `app/db/models/` — SQLAlchemy models
- `app/db/base.py` — model registry for metadata/migrations
- `app/cache/` — Redis cache service
- `app/utils/file_handler.py` — file extraction/manifest parsing helpers
- `alembic/` — migration scripts
- `frontend/` — LMS portal and SCORM player UI
- `storage/scorm/` — extracted SCORM packages

---

## 3) Technology Stack & Versions

From `requirements.txt`:

- `fastapi==0.116.0`
- `uvicorn[standard]==0.35.0`
- `SQLAlchemy==2.0.41`
- `alembic==1.16.4`
- `psycopg2-binary==2.9.10`
- `python-jose[cryptography]==3.5.0`
- `passlib[bcrypt]==1.7.4`
- `pydantic==2.11.7`
- `pydantic-settings==2.10.1`
- `python-multipart==0.0.20`
- `redis==6.2.0`
- `email-validator==2.2.0`

---

## 4) Environment Configuration

Copy:

- `.env.example` → `.env`

### Supported environment variables

| Variable | Purpose | Example |
|---|---|---|
| `APP_NAME` | Display/service name | `LMS Backend` |
| `APP_VERSION` | Version in API metadata | `1.0.0` |
| `API_PREFIX` | API root prefix | `/api/v1` |
| `DEBUG` | FastAPI debug mode | `false` |
| `DATABASE_URL` | SQLAlchemy DB URL | `postgresql+psycopg2://postgres:postgres@localhost:5432/lms` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379/0` |
| `JWT_SECRET_KEY` | JWT signing secret | `super-strong-secret` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `60` |
| `VERIFICATION_TOKEN_EXPIRE_MINUTES` | Email verification token TTL | `1440` |
| `FRONTEND_VERIFY_URL` | Verification URL base | `http://localhost:8000/api/v1/auth/verify` |
| `SCORM_STORAGE_DIR` | SCORM extraction folder | `storage/scorm` |
| `CACHE_TTL_SHORT` | short cache TTL (seconds) | `60` |
| `CACHE_TTL_MEDIUM` | medium cache TTL (seconds) | `180` |
| `CACHE_TTL_LONG` | long cache TTL (seconds) | `300` |
| `ACTIVE_USER_WINDOW_SECONDS` | active user analytics window | `900` |
| `GEMINI_API_KEY` | Gemini API key for chatbot | `***` |
| `GEMINI_MODEL` | Gemini model alias | `gemini-flash-latest` |
| `GEMINI_TIMEOUT_SECONDS` | LLM request timeout | `20` |
| `TELEGRAM_BOT_TOKEN` | Telegram integration token | `***` |

---

## 5) Local Development Setup

## Prerequisites

- Python 3.11+
- PostgreSQL (running)
- Redis (running)

## Install

1. Create a virtual environment
2. Install dependencies from `requirements.txt`
3. Configure `.env`

## Database migration

Run Alembic migrations (from repo root):

- `alembic upgrade head`

Current notable revisions include:

- `20260413_0001` — initial schema
- `20260417_0002` — SCORM runtime entities and package metadata extension

## Run API

Start backend:

- `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

## Open docs and portal

- Swagger UI: `http://127.0.0.1:8000/docs`
- LMS Portal: `http://127.0.0.1:8000/sandbox/`
- SCORM Player: `http://127.0.0.1:8000/sandbox/scorm-player.html?packageId=<PACKAGE_UUID>`

---

## 6) Authentication & Authorization Model

### Roles

- `student`
- `instructor`
- `admin`

### Dependency guards

- `get_current_user` — requires valid Bearer JWT
- `require_student`
- `require_instructor` (`instructor` or `admin`)
- `require_admin`

### Token flow

1. Register user
2. Verify email (`/auth/verify?token=...`)
3. Login to receive `access_token`
4. Pass `Authorization: Bearer <token>` header

---

## 7) API Response Contract

All endpoints return envelope format:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

On errors, `error` is populated by centralized exception handlers.

---

## 8) API Reference (Current)

All routes are under prefix: `/api/v1`

### 8.1 Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/verify?token=...`

### 8.2 Users

- `GET /users/me` — authenticated user profile
- `GET /users` — admin only

### 8.3 Courses / Authoring

- `POST /courses` — instructor/admin
- `GET /courses`
- `GET /courses/{course_id}`
- `POST /courses/modules` — instructor/admin
- `POST /courses/lessons` — instructor/admin

### 8.4 Enrollment

- `POST /enroll/{course_id}`
- `GET /my-courses`

### 8.5 Progress

- `POST /progress/update`
- `GET /progress/{course_id}`

### 8.6 Quiz

- `GET /quiz/{course_id}`
- `POST /quiz/submit`

### 8.7 Analytics

- `GET /analytics/course/{course_id}` — instructor/admin
- `GET /analytics/dashboard/me`
- `GET /analytics/dashboard/global` — admin only

### 8.8 Chatbot

- `POST /chat`
  - Request body: `{ "query": "..." }`
  - Response body: `{ "response": "..." }`
  - Validation flow:
    1. BFSI keyword fast-path
    2. semantic classifier fallback
    3. reject only if both checks fail
  - Post-processing flow:
    - finance intent extraction and prompt control
    - output safety rewrite (unsafe claims removal + disclaimers)
- `GET /analytics/active-users` — admin only

### 8.8 SCORM Admin Upload

- `POST /admin/scorm/upload`
  - Multipart form fields:
    - `course_id` (required)
    - `lesson_id` (optional)
    - `title` (optional)
    - `file` (`.zip`, required)

### 8.9 SCORM Runtime

- `POST /scorm/{package_id}/initialize`
- `GET /scorm/runtime/{registration_id}?key=...`
- `POST /scorm/runtime/{registration_id}`
  - body: `{ "key": "cmi.core.score.raw", "value": "85" }`
- `POST /scorm/runtime/{registration_id}/commit`
- `POST /scorm/runtime/{registration_id}/finish`

---

## 9) SCORM 1.2 Implementation Details

### Package handling

Upload flow:

1. Accept ZIP package
2. Persist temporary upload
3. Extract to `SCORM_STORAGE_DIR/<uuid>/`
4. Parse `imsmanifest.xml`
5. Resolve launch file and SCO activities
6. Persist package/activity metadata

Security:

- ZIP path traversal protection during extraction

### Runtime entities

- `scorm_packages`
- `scorm_activities`
- `scorm_registrations`
- `scorm_runtime_data`

Legacy compatibility:

- `scorm_trackings` is still synchronized for analytics and existing behavior

### Runtime behavior

- Registration initialized per user/package
- Runtime keys persisted at registration scope
- Typical tracked keys include:
  - `cmi.core.lesson_status`
  - `cmi.core.score.raw`
  - `cmi.core.score.min`
  - `cmi.core.score.max`
  - `cmi.core.session_time`
  - `cmi.suspend_data`

### Finish and LMS integration

- `finish` derives completion state from SCORM runtime values
- If package is linked to a lesson (`lesson_id`), LMS `progress` gets synchronized

### Player integration

Static player (`frontend/scorm-player.js`) provides `window.API` methods:

- `LMSInitialize("")`
- `LMSFinish("")`
- `LMSGetValue(key)`
- `LMSSetValue(key, value)`
- `LMSCommit("")`
- `LMSGetLastError()`
- plus error helper methods

---

## 10) Frontend Portal Documentation

Portal entry:

- `/sandbox/`

Main sections:

- Authentication
- Dashboard
- Course Catalog
- My Learning
- Instructor Studio
- SCORM Center
- Quiz Center
- Analytics
- Admin

### Role-aware behavior

- Student: learning/catalog/progress/quiz/scorm runtime actions
- Instructor: all student features + authoring + course analytics
- Admin: all features + user listing + global analytics

---

## 11) Caching & Activity Tracking

Redis-backed features:

- Cache keys:
  - `courses:all`
  - `course:{id}`
  - `dashboard:user:{id}`
  - `dashboard:global`
- Active users tracked in sorted set `active_users`

Active window controlled by:

- `ACTIVE_USER_WINDOW_SECONDS`

---

## 12) Security Notes

- JWT auth enforced for protected routes
- Role-based dependency guards
- SCORM runtime registration ownership checks
- SCORM upload restricted to instructor/admin with course-ownership enforcement for instructors
- Upload type validation for SCORM ZIP

---

## 13) Operations & Deployment Notes

- Ensure PostgreSQL and Redis are healthy before app startup
- Run migrations before deploying new code
- Use strong production `JWT_SECRET_KEY`
- Use persistent volume for `SCORM_STORAGE_DIR` in production
- Restrict CORS origins in production (`app/main.py` currently allows all)

---

## 14) Troubleshooting

### API starts but DB errors occur

- Verify `DATABASE_URL`
- Confirm DB reachable
- Run `alembic upgrade head`

### Redis-related dashboard/active user issues

- Verify `REDIS_URL`
- Confirm Redis process is reachable

### SCORM upload fails

- Ensure file is `.zip`
- Ensure `imsmanifest.xml` is present and valid
- Check filesystem permissions for `SCORM_STORAGE_DIR`

### SCORM player cannot load content

- Verify package has launchable resource in manifest
- Confirm package ID is correct
- Check browser devtools for iframe/network failures

### 403 on authoring/runtime routes

- Check role in `/users/me`
- Confirm enrollment or instructor ownership where required

---

## 15) Known Current Gaps (API-level)

The current portal is fully integrated with existing endpoints, but these capabilities would benefit from additional endpoints:

- Full module/lesson tree retrieval by course
- SCORM package listing/history by course
- Quiz attempt history listing
- Aggregated learner transcript endpoints

---

## 16) Quick Endpoint Checklist

- [x] Auth
- [x] Users
- [x] Courses / authoring
- [x] Enrollment
- [x] Progress
- [x] Quiz
- [x] Analytics
- [x] SCORM upload/runtime

---

## 17) References

- FastAPI app entry: `app/main.py`
- Config model: `app/core/config.py`
- SCORM service: `app/services/scorm_service.py`
- SCORM routes: `app/routes/scorm.py`
- Portal UI: `frontend/index.html`, `frontend/script.js`, `frontend/styles.css`
- SCORM player: `frontend/scorm-player.html`, `frontend/scorm-player.js`
