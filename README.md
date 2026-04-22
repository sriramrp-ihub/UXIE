# UXIE LMS (FastAPI + SCORM 1.2)

Production-grade Learning Management System backend with:

- JWT auth + role-based access control
- Course authoring and enrollment
- Progress + quiz flows
- Analytics dashboards
- SCORM 1.2 upload, playback, runtime tracking, and completion persistence
- Redis cache-aside and active-user tracking
- BFSI-focused chatbot integrations (Web + Telegram) with semantic guardrails

## Latest updates (22 April 2026)

- Merged latest `main` improvements for learner/admin UX, SCORM flow, and analytics refinements.
- Added learner-focused updates in web app, including certificates and quiz/testing-related experience updates.
- Enhanced chatbot stack with:
	- semantic fallback guardrails (`keyword -> classifier -> allow/reject`)
	- finance logic engine (`input intent + output safety formatting`)
	- latency optimizations (single-flight dedupe + response cache + bounded classifier cache)

See the consolidated change log: `docs/LATEST_CHANGES_2026-04-22.md`.

## Full technical documentation

For deep architecture and implementation details, see:

- `docs/FULL_DOCUMENTATION.md`
- `docs/PRODUCTION_TECHNICAL_GUIDE.md` (technical + production-grade operations guide)
- `docs/SCORM_TECHNICAL_DOCUMENTATION.md` (dedicated SCORM architecture + runtime guide)
- `docs/PROJECT_STATUS_2026-04-18.md` (detailed current status snapshot)
- `docs/LATEST_CHANGES_2026-04-22.md` (latest merged and implemented updates)
- `docs/CHATBOT_GUARDRAILS.md` (chatbot validation + safety logic)
- `web/README.md` (React frontend app)

---

## Tech stack

- FastAPI (Python 3.11+)
- SQLAlchemy 2.0 ORM
- PostgreSQL
- Alembic migrations
- Redis
- JWT (`python-jose`)
- Passlib bcrypt
- Pydantic v2
- Static portal UI (HTML/CSS/JS)

---

## Project structure

Detailed source tree (excluding generated folders such as `.venv/`, `node_modules/`, `dist/`, `__pycache__/`):

```text
UXIE/
├── README.md
├── requirements.txt
├── alembic.ini
├── .env.example
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       ├── 20260413_0001_initial_schema.py
│       └── 20260417_0002_scorm_runtime.py
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── cache/
│   │   ├── __init__.py
│   │   ├── cache_service.py
│   │   └── redis_client.py
│   ├── constants/
│   │   ├── __init__.py
│   │   └── roles.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   ├── response.py
│   │   └── security.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── database.py
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── course.py
│   │       ├── enrollment.py
│   │       ├── progress.py
│   │       ├── quiz.py
│   │       ├── scorm.py
│   │       └── user.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── analytics.py
│   │   ├── auth.py
│   │   ├── courses.py
│   │   ├── enrollments.py
│   │   ├── progress.py
│   │   ├── quiz.py
│   │   ├── scorm.py
│   │   └── users.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── course.py
│   │   ├── quiz.py
│   │   ├── scorm.py
│   │   └── user.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── analytics_service.py
│   │   ├── auth_service.py
│   │   ├── course_service.py
│   │   └── scorm_service.py
│   └── utils/
│       ├── __init__.py
│       ├── email.py
│       └── file_handler.py
├── docs/
│   ├── FULL_DOCUMENTATION.md
│   ├── PRODUCTION_TECHNICAL_GUIDE.md
│   ├── PROJECT_STATUS_2026-04-18.md
│   └── SCORM_TECHNICAL_DOCUMENTATION.md
├── frontend/
│   ├── index.html
│   ├── scorm-player.html
│   ├── scorm-player.js
│   ├── script.js
│   └── styles.css
├── storage/
│   ├── scorm/
│   │   └── <package_uuid>/... extracted SCORM assets ...
│   └── tmp/
│       └── <upload_uuid>.zip
└── web/
	├── README.md
	├── index.html
	├── package.json
	├── package-lock.json
	├── vite.config.ts
	├── eslint.config.js
	├── postcss.config.js
	├── tailwind.config.js
	├── tsconfig.json
	├── tsconfig.app.json
	├── tsconfig.node.json
	├── public/
	│   ├── favicon.svg
	│   └── icons.svg
	└── src/
		├── App.tsx
		├── main.tsx
		├── index.css
		├── App.css
		├── assets/
		├── components/
		│   ├── AppShell.tsx
		│   ├── EmptyState.tsx
		│   ├── ErrorState.tsx
		│   ├── GlobalErrorBoundary.tsx
		│   ├── LoadingState.tsx
		│   ├── ProtectedRoute.tsx
		│   ├── RoleGuard.tsx
		│   ├── RoleProtectedRoute.tsx
		│   ├── ToastViewport.tsx
		│   └── layouts/
		├── features/
		│   ├── analytics/
		│   ├── auth/
		│   ├── courses/
		│   ├── quiz/
		│   └── scorm/
		├── hooks/
		│   └── useAuthBootstrap.ts
		├── lib/
		│   └── api/
		├── pages/
		│   ├── admin/
		│   ├── auth/
		│   ├── student/
		│   ├── AdminPanelPage.tsx
		│   ├── AnalyticsPage.tsx
		│   ├── CatalogPage.tsx
		│   ├── CourseDetailPage.tsx
		│   ├── DashboardPage.tsx
		│   ├── LessonViewerPage.tsx
		│   ├── LoginPage.tsx
		│   ├── MyLearningPage.tsx
		│   ├── QuizPage.tsx
		│   ├── RegisterPage.tsx
		│   ├── ScormCenterPage.tsx
		│   └── ScormPlayerPage.tsx
		├── store/
		│   ├── auth.store.ts
		│   └── uiFeedback.store.ts
		├── types/
		│   └── domain.ts
		└── utils/
			├── jwt.ts
			├── roleRouting.ts
			└── storage.ts
```

Key directories at a glance:

- `app/` — FastAPI backend (API routes, business services, data layer, SCORM runtime logic).
- `web/` — React + TypeScript application used as the modern LMS frontend.
- `frontend/` — static portal assets mounted at `/sandbox` (legacy/simple UI).
- `storage/scorm/` — extracted SCORM package files served through `/scorm-content`.
- `alembic/` — DB schema migration history.
- `docs/` — architecture, production, SCORM internals, and status documentation.

---

## Environment configuration

1. Copy `.env.example` to `.env`
2. Set real values for DB/Redis/JWT secret

Key variables:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET_KEY`
- `API_PREFIX` (default `/api/v1`)
- `SCORM_STORAGE_DIR` (default `storage/scorm`)
- `CACHE_TTL_SHORT|MEDIUM|LONG`
- `ACTIVE_USER_WINDOW_SECONDS`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_TIMEOUT_SECONDS`
- `TELEGRAM_BOT_TOKEN`

> Use a strong production secret for `JWT_SECRET_KEY`.

---

## Local setup

1. Create and activate a Python virtual environment
2. Install dependencies:

	`pip install -r requirements.txt`

3. Apply DB migrations:

	`alembic upgrade head`

4. Start API:

	`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

5. Open:

- API docs: `http://127.0.0.1:8000/docs`
- LMS portal: `http://127.0.0.1:8000/sandbox/`

---

## Runtime URLs

- API prefix: `/api/v1`
- SCORM static content: `/scorm-content/...`
- Portal UI: `/sandbox/`
- SCORM player: `/sandbox/scorm-player.html?packageId=<SCORM_PACKAGE_UUID>`

---

## API overview

All endpoints are under `/api/v1`.

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/verify?token=...`

### Users

- `GET /users/me`
- `GET /users` (admin)

### Courses / Authoring

- `POST /courses` (instructor/admin)
- `GET /courses`
- `GET /courses/{course_id}`
- `POST /courses/modules` (instructor/admin)
- `POST /courses/lessons` (instructor/admin)

### Enrollment

- `POST /enroll/{course_id}`
- `GET /my-courses`

### Progress

- `POST /progress/update`
- `GET /progress/{course_id}`

### Quiz

- `GET /quiz/{course_id}`
- `POST /quiz/submit`

### Analytics

- `GET /analytics/course/{course_id}` (instructor/admin)
- `GET /analytics/dashboard/me`
- `GET /analytics/dashboard/global` (admin)
- `GET /analytics/active-users` (admin)

### SCORM Admin Upload

- `POST /admin/scorm/upload`
  - multipart form data:
	 - `course_id` (required)
	 - `lesson_id` (optional)
	 - `title` (optional)
	 - `file` (`.zip`, required)

### SCORM Runtime API

- `POST /scorm/{package_id}/initialize`
- `GET /scorm/runtime/{registration_id}?key=...`
- `POST /scorm/runtime/{registration_id}`
- `POST /scorm/runtime/{registration_id}/commit`
- `POST /scorm/runtime/{registration_id}/finish`

### Chatbot

- `POST /chat`

---

## SCORM 1.2 behavior

Implemented runtime flow:

1. Upload SCORM package (`.zip`)
2. Extract package and parse `imsmanifest.xml`
3. Persist package + SCO/activity metadata
4. Initialize learner registration/session
5. Read/write runtime keys (e.g., `cmi.core.lesson_status`, `cmi.core.score.raw`)
6. Commit runtime state
7. Finish session and sync completion

Persistence model includes:

- `scorm_packages`
- `scorm_activities`
- `scorm_registrations`
- `scorm_runtime_data`

Compatibility sync:

- Existing `scorm_trackings` is synchronized for legacy analytics compatibility.

---

## Portal UI coverage

The portal at `/sandbox/` includes:

- Auth (register/login/verify/logout)
- Role-aware navigation
- Catalog + enrollment
- My learning + progress updates
- Instructor authoring (course/module/lesson)
- SCORM upload + runtime controls + player launch
- Quiz retrieval/submission
- User and global analytics
- Admin users listing

---

## Security and access control

- JWT Bearer token auth for protected routes
- Role guards: student / instructor / admin
- SCORM runtime registration ownership validation
- Instructor upload constrained to owned courses (admins can manage all)
- ZIP extraction path traversal protection for SCORM uploads

---

## Caching and activity tracking

Redis cache keys include:

- `courses:all`
- `course:{id}`
- `dashboard:user:{id}`
- `dashboard:global`

Active user tracking:

- Sorted set key: `active_users`
- Window configured by `ACTIVE_USER_WINDOW_SECONDS`

---

## Standard response envelope

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## Production notes

- Run migrations before deploying app updates
- Use secure secrets and restricted CORS origins
- Use persistent storage for `SCORM_STORAGE_DIR`
- Ensure PostgreSQL and Redis health checks are in place

---

## Troubleshooting quick checks

- DB errors → verify `DATABASE_URL` and run `alembic upgrade head`
- Redis errors → verify `REDIS_URL` and service availability
- SCORM upload errors → verify ZIP format and valid `imsmanifest.xml`
- 403 responses → verify role and enrollment/ownership constraints

---

## Current known API gaps (for future enhancement)

- Full module/lesson tree retrieval by course
- SCORM package history/listing by course
- Quiz attempt history endpoint
- Aggregated learner transcript endpoint
