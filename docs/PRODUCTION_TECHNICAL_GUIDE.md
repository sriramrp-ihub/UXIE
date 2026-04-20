# UXIE LMS — Production Technical Guide

Last updated: 2026-04-18  
Scope: Backend API (`app/`), SCORM runtime pipeline, legacy static portal (`frontend/`), and modern React frontend (`web/`).

---

## 1) System Summary

UXIE is a role-based LMS with SCORM 1.2 support built around a FastAPI backend.

Core capabilities:

- JWT authentication + role-based authorization (`student`, `instructor`, `admin`)
- Course/module/lesson authoring
- Enrollment and lesson progress tracking
- Quiz attempt submission and scoring
- Analytics dashboards (per-user, per-course, global)
- SCORM upload, launch, runtime persistence, and LMS progress synchronization
- Redis-backed caching + active-user counters (graceful degradation when Redis is unavailable)

---

## 2) Runtime Architecture

### 2.1 Backend (authoritative source)

- Framework: FastAPI (`app/main.py`)
- ORM: SQLAlchemy 2.x (`app/db/`)
- Migrations: Alembic (`alembic/`)
- Primary datastore: PostgreSQL
- Cache/activity store: Redis

API routers mounted under `${API_PREFIX}` (default `/api/v1`):

- `/auth`
- `/users`
- `/courses`
- enrollment routes (`/enroll/{course_id}`, `/my-courses`)
- `/progress`
- `/quiz`
- `/analytics`
- `/scorm` and `/admin/scorm`

### 2.2 Frontend surfaces

1. **Legacy portal (served by backend):**
   - Files: `frontend/index.html`, `frontend/script.js`, `frontend/styles.css`
   - Mounted by backend at `/sandbox`

2. **Modern React app (separate build/runtime):**
   - Files: `web/` (Vite + React + TypeScript)
   - Runs via Vite in development; produces static assets for deployment

### 2.3 SCORM content serving

- Uploaded SCORM ZIPs are extracted under `SCORM_STORAGE_DIR` (default `storage/scorm`).
- Backend serves extracted content at `/scorm-content/...`.
- SCORM runtime APIs persist learner session state in DB.

---

## 3) Repository Layout (Operationally Relevant)

- `app/main.py` — app bootstrap, middleware, exception handlers, mounts
- `app/core/config.py` — environment-driven settings + defaults
- `app/core/security.py` — password hashing + JWT encode/decode
- `app/core/dependencies.py` — auth and role guards
- `app/routes/` — HTTP contract layer
- `app/services/` — business logic (course, auth, analytics, scorm)
- `app/db/models/` — SQLAlchemy entities and relational constraints
- `app/cache/` — Redis client/cache facade
- `app/utils/file_handler.py` — secure ZIP extract + manifest parsing
- `alembic/versions/` — schema evolution
- `docs/` — technical and status documentation
- `frontend/` — backend-served legacy UI
- `web/` — modern React frontend

---

## 4) Technology Stack and Versions

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

From `web/package.json`:

- React 19 + TypeScript 6 + Vite 8
- TanStack Query 5
- React Router 7
- Zustand 5
- Axios 1
- TailwindCSS 3

---

## 5) Environment Configuration

The backend reads `.env` via `app/core/config.py` and ships `.env.example`.

### 5.1 Required and critical variables

| Variable | Purpose | Default in code |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy DB connection | `postgresql+psycopg2://postgres:postgres@localhost:5432/lms` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379/0` |
| `JWT_SECRET_KEY` | JWT signing key | `change-me-in-production` |

### 5.2 Important application/runtime variables

| Variable | Purpose | Default |
|---|---|---|
| `APP_NAME` | service name | `LMS Backend` |
| `APP_VERSION` | API version metadata | `1.0.0` |
| `API_PREFIX` | route prefix | `/api/v1` |
| `DEBUG` | FastAPI debug mode | `false` |
| `JWT_ALGORITHM` | token algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | access token TTL | `60` |
| `VERIFICATION_TOKEN_EXPIRE_MINUTES` | email verification token TTL | `1440` |
| `FRONTEND_VERIFY_URL` | verification link base | `http://localhost:8000/api/v1/auth/verify` |
| `SCORM_STORAGE_DIR` | extracted package directory | `storage/scorm` |
| `CACHE_TTL_SHORT` | dashboard/user cache TTL | `60` |
| `CACHE_TTL_MEDIUM` | dashboard/global or list cache TTL | `180` |
| `CACHE_TTL_LONG` | available for longer-lived cache | `300` |
| `ACTIVE_USER_WINDOW_SECONDS` | active-user recency window | `900` |

### 5.3 Frontend env (React app)

`web/.env` optional:

- `VITE_API_URL` (defaults to `http://127.0.0.1:8000/api/v1` in frontend API client path)

---

## 6) Data Model (Production-Relevant Entities)

### 6.1 Identity and learning graph

- `users`
- `courses` (owned by instructor)
- `modules` (belongs to course)
- `lessons` (belongs to module)
- `enrollments` with unique constraint `(user_id, course_id)`
- `progress` with unique constraint `(user_id, lesson_id)`

### 6.2 Quiz

- `quizzes` (course-scoped)
- `questions`
- `quiz_attempts`

### 6.3 SCORM

- `scorm_packages`
- `scorm_activities`
- `scorm_registrations`
- `scorm_runtime_data` with unique `(registration_id, key)`
- `scorm_trackings` (legacy-compatible analytics table)

---

## 7) API Contract (Current)

All endpoints are prefixed with `/api/v1` by default.

### 7.1 Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/verify?token=...`

### 7.2 User

- `GET /users/me`
- `GET /users` (admin only)

### 7.3 Course domain

- `POST /courses` (instructor/admin)
- `GET /courses`
- `GET /courses/{course_id}`
- `GET /courses/{course_id}/structure`
- `POST /courses/modules` (instructor/admin)
- `POST /courses/lessons` (instructor/admin)

### 7.4 Enrollment and learning

- `POST /enroll/{course_id}`
- `GET /my-courses`
- `POST /progress/update`
- `GET /progress/{course_id}`

### 7.5 Quiz

- `GET /quiz/{course_id}`
- `POST /quiz/submit`

### 7.6 Analytics

- `GET /analytics/course/{course_id}` (instructor/admin)
- `GET /analytics/dashboard/me`
- `GET /analytics/dashboard/global` (admin)
- `GET /analytics/active-users` (admin)

### 7.7 SCORM

Admin/instructor upload:

- `POST /admin/scorm/upload` (multipart: `course_id`, optional `lesson_id`, optional `title`, `file=.zip`)

Learner runtime:

- `POST /scorm/{package_id}/initialize`
- `GET /scorm/runtime/{registration_id}` (optional `key` query)
- `POST /scorm/runtime/{registration_id}`
- `POST /scorm/runtime/{registration_id}/commit`
- `POST /scorm/runtime/{registration_id}/finish`

### 7.8 Response envelope

All API responses are wrapped:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## 8) SCORM Lifecycle and Completion Sync

### 8.1 Upload lifecycle

1. Validate ZIP extension
2. Save to temporary storage (`storage/tmp`)
3. Extract securely with traversal guard
4. Parse `imsmanifest.xml`
5. Persist package and activities
6. Serve launch assets from `/scorm-content/...`

### 8.2 Runtime lifecycle

1. `initialize` creates/returns `scorm_registrations` row
2. SCO writes runtime keys via runtime set API
3. `commit` persists runtime snapshot and syncs legacy tracking
4. `finish` derives status, marks completion, and syncs LMS progress

### 8.3 Completion inference behavior

Completion can be derived from multiple runtime keys (implementation supports legacy variance), including values indicating `completed`/`passed`.

### 8.4 Lesson fallback linkage

If a package does not have an explicit `lesson_id`, backend can resolve or create a SCORM lesson mapping so progress synchronization is not silently dropped.

---

## 9) Caching and Degradation Behavior

Redis is used for:

- course list cache (`courses:all`)
- course detail cache (`course:{id}`)
- user dashboard cache (`dashboard:user:{id}`)
- global dashboard cache (`dashboard:global`)
- active user sorted-set (`active_users`)

Failure mode:

- Redis failures are logged and handled gracefully.
- API continues serving with cache misses and active-user count fallback (`0` when Redis unavailable).

---

## 10) Security Posture

### 10.1 Implemented controls

- Password hashing with bcrypt (Passlib)
- JWT access tokens with expiration
- Role-based dependencies (`require_student`, `require_instructor`, `require_admin`)
- SCORM registration ownership checks
- Instructor course ownership checks on upload
- ZIP path traversal protection on SCORM extraction
- Centralized exception handling to avoid stack traces in responses

### 10.2 Production hardening required

1. Replace default `JWT_SECRET_KEY`.
2. Restrict CORS origins (currently `allow_origins=["*"]`).
3. Terminate TLS at reverse proxy/load balancer.
4. Add request rate limiting at API gateway/proxy level.
5. Add audit logging for privileged actions (admin/instructor changes).
6. Replace log-only email verification sender with real SMTP/provider integration.

---

## 11) Build, Run, and Release Commands (Verified)

Run commands from repository root (`UXIE/`) unless stated.

### 11.1 Backend

- Install dependencies: `pip install -r requirements.txt`
- Apply migrations: `alembic upgrade head`
- Start API: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

### 11.2 React frontend (`web/`)

- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Preview build: `npm run preview`

### 11.3 Minimal quality gates currently used

- Frontend lint: `web/npm run lint`
- Backend syntax check: `python3 -m compileall app/services/scorm_service.py` (or broader compileall scope in CI)

---

## 12) Production Deployment Blueprint

### 12.1 Recommended topology

- Reverse proxy (Nginx/Traefik) in front
- FastAPI app workers behind proxy
- PostgreSQL managed instance
- Redis managed instance
- Persistent filesystem/volume for `SCORM_STORAGE_DIR`

### 12.2 Essential deployment sequence

1. Deploy application artifact
2. Load/update environment variables
3. Run `alembic upgrade head`
4. Run smoke checks (`/`, `/docs`, auth flow)
5. Switch traffic

### 12.3 Stateful data and backups

Protect and back up:

- PostgreSQL database
- SCORM extracted content directory (`SCORM_STORAGE_DIR`)

Without SCORM storage backup, existing package metadata may reference missing content.

---

## 13) Observability and Operations

### 13.1 Health and diagnostics

- Root endpoint `GET /` returns service metadata and simple health response.
- Swagger at `/docs` for route-level validation.

### 13.2 Logging behavior

- Exception handlers log DB outages and unhandled errors.
- Redis cache failures are logged as warnings and do not crash requests.
- Email verification currently logs verification URLs.

### 13.3 Suggested SLO-focused monitoring

- API request latency and error rate by route
- DB connection errors and pool saturation
- Redis availability and timeout rate
- SCORM runtime write failures and finish failures
- Storage utilization for `SCORM_STORAGE_DIR`

---

## 14) Troubleshooting Runbook

### Problem: 503 Database unavailable

- Verify `DATABASE_URL`
- Verify PostgreSQL reachability/credentials
- Check migration state (`alembic current` / `alembic upgrade head`)

### Problem: SCORM package loads but progress not visible

1. Confirm runtime `finish` endpoint succeeds.
2. Inspect registration runtime values for completion keys.
3. Verify package-to-lesson linkage (`lesson_id`) or fallback-created lesson.
4. Ensure learner is checking progress in the same course context.

### Problem: active users always zero

- Check Redis availability and `REDIS_URL`.
- Confirm authorized traffic includes Bearer tokens so middleware can track activity.

### Problem: 403 on course/scorm actions

- Confirm role (`/users/me`).
- For instructor actions, verify course ownership.
- For learner progress, verify enrollment or admin privileges.

---

## 15) Known Production Gaps / Next Improvements

1. CORS still fully open; lock down per environment.
2. No built-in rate limiting/throttling layer.
3. Email verification sender is logging-only.
4. No first-party container orchestration manifests in repo.
5. Automated end-to-end test suite is not yet part of this repository path.

---

## 16) Glossary

- **SCO:** Shareable Content Object (launchable SCORM learning unit)
- **Registration:** User session instance for a SCORM package
- **Runtime data:** Key-value SCORM state (`cmi.*`) persisted per registration
- **Legacy tracking:** `scorm_trackings` table retained for compatibility/analytics aggregation
