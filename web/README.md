# UXIE LMS Frontend (React + TypeScript)

Production-grade LMS frontend integrated with UXIE FastAPI backend.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Zustand (auth/session state)
- React Query (server state/cache)
- Axios (API client)
- React Router (routing + lazy pages)

## Architecture

```
src/
 ├── components/
 ├── features/
 ├── pages/
 ├── lib/api/
 ├── store/
 ├── hooks/
 ├── types/
 └── utils/
```

Design rules followed:

- Feature-based modular organization
- Centralized API client and domain API files
- Route-level lazy loading
- Separate role route trees and role-based route guarding
- No direct API calls in pages/components (business logic in hooks/services)

## Role-separated route trees

Dedicated login flows:

- `/login/student`
- `/login/mentor`
- `/login/admin`

Dedicated role apps:

- `/student/*` — Learner experience
- `/mentor/*` — Mentor experience
- `/admin/*` — Admin experience

Role redirects after authentication:

- student → `/student/dashboard`
- instructor (mentor) → `/mentor/dashboard`
- admin → `/admin/dashboard`

## Setup

From `web/`:

1. Install dependencies:

   `npm install`

2. Start development server:

   `npm run dev`

3. Build production bundle:

   `npm run build`

## Environment

Optional `.env` in `web/`:

`VITE_API_URL=http://127.0.0.1:8000/api/v1`

If missing, default API URL above is used.

## Main capabilities

- Auth: role-specific login routes + session persistence + role mismatch blocking
- Student app: dashboard, course catalog, my learning, quiz attempts, profile, lesson viewer, SCORM player
- Mentor app: dashboard, course/module/lesson management, SCORM upload management, quiz management shell, student monitoring
- Admin app: global dashboard, user management, course oversight, platform analytics
- SCORM runtime bridge in student player (`window.API` for initialize/get/set/commit/finish)

## Notes

- Ensure backend is running (`uvicorn app.main:app --reload`) before using frontend.
- SCORM playback requires uploaded package IDs from the backend runtime flow.
