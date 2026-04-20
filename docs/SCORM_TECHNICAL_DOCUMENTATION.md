# UXIE LMS — Dedicated SCORM Technical Documentation

Last updated: 2026-04-18

This document describes the SCORM subsystem in UXIE end-to-end: upload pipeline, runtime API, persistence model, frontend integration, completion sync, and production operations.

---

## 1) Scope and Components

SCORM implementation spans:

- Backend routes: `app/routes/scorm.py`
- Backend service logic: `app/services/scorm_service.py`
- Schemas: `app/schemas/scorm.py`
- Models: `app/db/models/scorm.py`
- File/manifest helpers: `app/utils/file_handler.py`
- Migration: `alembic/versions/20260417_0002_scorm_runtime.py`
- React integration:
  - `web/src/lib/api/scorm.api.ts`
  - `web/src/features/scorm/useScorm.ts`
  - `web/src/features/scorm/useScormPlayer.ts`
  - `web/src/pages/ScormPlayerPage.tsx`
- Legacy static player:
  - `frontend/scorm-player.html`
  - `frontend/scorm-player.js`

---

## 2) SCORM Runtime Architecture

### 2.1 Upload and packaging

1. Instructor/admin uploads a `.zip` package via `/api/v1/admin/scorm/upload`.
2. ZIP is written to temporary path (`storage/tmp`).
3. ZIP is extracted to `SCORM_STORAGE_DIR/<uuid>/`.
4. `imsmanifest.xml` is parsed for package title, launch path, and SCO items.
5. DB entities are created (`scorm_packages`, `scorm_activities`).
6. Launch URLs are generated under `/scorm-content/...`.

### 2.2 Learner runtime session

1. Learner initializes with `/api/v1/scorm/{package_id}/initialize`.
2. Backend returns `session_id`, package metadata, activities, and current runtime key-values.
3. Player registers SCORM API bridge (`window.API`) and loads SCO in iframe.
4. SCO calls `LMSSetValue` / `LMSCommit` / `LMSFinish`.
5. Runtime values persist into `scorm_runtime_data`.
6. `finish` updates registration status and syncs LMS `progress` and legacy `scorm_trackings`.

---

## 3) Backend API Contract (SCORM Only)

Base prefix: `/api/v1`

### 3.1 Upload endpoint

`POST /admin/scorm/upload`

Form-data fields:

- `course_id` (required UUID)
- `lesson_id` (optional UUID)
- `title` (optional string)
- `file` (required `.zip`)

Access:

- Requires `instructor` or `admin`.
- Instructors can upload only to their own courses.

### 3.2 Package list endpoint

`GET /scorm/course/{course_id}/packages`

Access:

- Admin: allowed
- Instructor: allowed for owned course
- Student: allowed only if enrolled in the course

### 3.3 Session initialize

`POST /scorm/{package_id}/initialize`

Returns:

- `session_id` (`scorm_registrations.id`)
- `registration`
- `package`
- `activities`
- `runtime_data`

### 3.4 Runtime read

`GET /scorm/runtime/{registration_id}?key=<optional>`

Returns full key-value map or single-key map.

### 3.5 Runtime write

`POST /scorm/runtime/{registration_id}`

Body:

```json
{
  "key": "cmi.core.lesson_status",
  "value": "completed"
}
```

Validation:

- `key` max 255, must match `^cmi(\.|$)`
- `value` max 4096

### 3.6 Runtime commit

`POST /scorm/runtime/{registration_id}/commit`

- Persists/syncs runtime-derived tracking data.

### 3.7 Runtime finish

`POST /scorm/runtime/{registration_id}/finish`

- Finalizes registration status.
- Synchronizes LMS progress and legacy tracking.

---

## 4) Persistence Model and Semantics

### 4.1 Tables

- `scorm_packages`
  - Includes `course_id`, optional `lesson_id`, `title`, `version`, `launch_file`, `extracted_path`, `file_path`
- `scorm_activities`
  - SCO-level launch metadata
- `scorm_registrations`
  - User package session lifecycle (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)
- `scorm_runtime_data`
  - Per-registration SCORM key-value state (`uq_scorm_runtime_registration_key`)
- `scorm_trackings`
  - Legacy analytics compatibility layer

### 4.2 Default runtime keys on session creation

When a new registration is created, service seeds:

- `cmi.core.lesson_status = not attempted`
- `cmi.core.score.raw = ""`
- `cmi.core.score.min = ""`
- `cmi.core.score.max = ""`
- `cmi.core.session_time = 00:00:00`
- `cmi.suspend_data = ""`

### 4.3 Completion detection

Completion is inferred from runtime values using multiple SCORM variants:

- `cmi.core.lesson_status`
- `cmi.lesson_status`
- `cmi.completion_status`
- `cmi.success_status`

Any normalized value in `{completed, passed, true}` marks registration `COMPLETED`.

### 4.4 Progress synchronization behavior

On `finish`:

1. Service resolves lesson mapping for the package.
2. If `lesson_id` is missing:
   - attempts to match existing SCORM lesson by URL/course
   - otherwise creates fallback module `SCORM Content` and lesson
   - links package to that lesson
3. Updates/creates `progress` row for learner+lesson.

This design prevents silent loss of LMS progress for packages uploaded without explicit lesson linkage.

---

## 5) Security and Access Controls

### 5.1 Route access

- Upload: `require_instructor` (`instructor` or `admin`)
- Runtime/package endpoints: authenticated user, plus course/registration access checks

### 5.2 Ownership checks

- Instructor upload rejected if course not owned by instructor.
- Registration access denied if session belongs to another user (except admin).
- Course access enforced for package listing and runtime operations.

### 5.3 File safety

ZIP extraction blocks path traversal by validating resolved member paths stay within extraction directory.

---

## 6) Frontend Integration Details

## 6.1 React API client layer

`web/src/lib/api/scorm.api.ts` provides typed wrappers for upload, list, initialize, runtime get/set, commit, finish.

## 6.2 React query hooks

`web/src/features/scorm/useScorm.ts`:

- wraps all SCORM mutations/queries
- invalidates key learning views after finish:
  - `progress`
  - `analytics/me`
  - `courses/structure`

## 6.3 React SCORM player bridge

`web/src/features/scorm/useScormPlayer.ts`:

- initializes session and iframe launch URL
- exposes SCORM 1.2 API methods:
  - `LMSInitialize`
  - `LMSFinish`
  - `LMSGetValue`
  - `LMSSetValue`
  - `LMSCommit`
  - `LMSGetLastError`
- tracks dirty runtime keys in-memory and flushes in batch
- clamps runtime values to 4000 chars to avoid payload overflows
- uses resilient finish pipeline (continues finalize even if some writes fail)
- surfaces learner-facing status messages (initializing/saving/finalized/failure)

## 6.4 Legacy static SCORM player

`frontend/scorm-player.js` provides similar `window.API` behavior with query-param-driven launch (`packageId`, optional `apiBase`, optional `token`).

---

## 7) Migration Notes

Migration `20260417_0002_scorm_runtime.py` introduced:

- package metadata extension (`lesson_id`, `title`, `version`, `launch_file`, `extracted_path`)
- new runtime entities:
  - `scorm_activities`
  - `scorm_registrations`
  - `scorm_runtime_data`
- required FK/index/uniqueness constraints for runtime operations

Deployment requirement: run `alembic upgrade head` before using new SCORM runtime endpoints.

---

## 8) Operational Runbook (SCORM)

### 8.1 Upload checklist

- Ensure uploader has instructor/admin role.
- Ensure instructor owns target course.
- Ensure ZIP contains valid `imsmanifest.xml` and launchable resource.
- Ensure filesystem has write permissions for `SCORM_STORAGE_DIR` and `storage/tmp`.

### 8.2 Runtime checklist

- `initialize` returns valid `session_id` and `launch_url`.
- Player iframe loads `/scorm-content/...` path without 404.
- SCO can access `window.parent.API` or injected iframe `API`.
- `finish` returns success and progress reflects in `/progress/{course_id}`.

### 8.3 Monitoring targets

- SCORM upload failures by reason (bad ZIP, manifest parse failure, access denied)
- Runtime write failure rate (400/422/5xx)
- Finish success rate
- Delta between completed registrations and completed LMS progress rows

### 8.4 Storage and backup

Back up both:

- PostgreSQL tables (metadata/runtime state)
- SCORM extracted assets (`SCORM_STORAGE_DIR`)

Losing extracted assets breaks launch URLs even if DB rows remain intact.

---

## 9) Failure Modes and Troubleshooting

### 9.1 “SCORM content loads, progress not updating”

Debug order:

1. Confirm `POST /scorm/runtime/{registration_id}/finish` returns success.
2. Read runtime keys (`GET /scorm/runtime/{registration_id}`) and verify completion status key exists.
3. Verify package has lesson mapping (`scorm_packages.lesson_id`) or fallback mapping was created.
4. Check learner’s selected course context on progress screen.

### 9.2 400 `Invalid SCORM runtime key`

- Runtime key must start with `cmi`.
- Non-SCORM custom keys are intentionally rejected.

### 9.3 403 responses

- User is not enrolled / not owner / not admin for requested course/session.

### 9.4 404 during launch

- Package extract path missing or invalid launch path from manifest.
- Verify `/scorm-content/...` mount and stored `file_path`.

---

## 10) Current Constraints and Recommendations

1. Runtime key whitelist currently pattern-based (`^cmi`) not full SCORM vocabulary validation.
2. No background retry queue for failed runtime writes (client handles best effort + continue finalize).
3. No dedicated metrics endpoint for SCORM health; rely on logs/observability stack.
4. Consider adding idempotency tokens for upload and finish operations in high-scale deployments.

---

## 11) Quick Reference (SCORM APIs)

- Upload package: `POST /api/v1/admin/scorm/upload`
- List packages by course: `GET /api/v1/scorm/course/{course_id}/packages`
- Initialize session: `POST /api/v1/scorm/{package_id}/initialize`
- Get runtime data: `GET /api/v1/scorm/runtime/{registration_id}`
- Set runtime value: `POST /api/v1/scorm/runtime/{registration_id}`
- Commit runtime: `POST /api/v1/scorm/runtime/{registration_id}/commit`
- Finish runtime: `POST /api/v1/scorm/runtime/{registration_id}/finish`
