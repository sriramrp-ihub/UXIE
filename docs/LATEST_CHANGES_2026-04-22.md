# UXIE Latest Changes (22 April 2026)

This document consolidates the latest updates merged from `main` and recent chatbot enhancements on the `Chatbot` branch.

---

## 1) Main branch changes integrated

### Commit `6755c43`
**Title:** learner quiz UI and mock endpoint for testing

Highlights:
- learner quiz/test experience updates
- supporting test/mock flow additions
- repository-level generated assets and temporary files included in commit

### Commit `5d97d32`
**Title:** refine analytics, SCORM flow, and admin/learner UX

Backend updates:
- `app/routes/analytics.py`
- `app/routes/scorm.py`
- `app/schemas/scorm.py`
- `app/services/analytics_service.py`
- `app/services/course_service.py`

Frontend updates:
- route and UX refinements: `web/src/App.tsx`
- admin/student layout and page improvements
- analytics/scorm API and hooks improvements
- added student certificates page
- environment/runtime client improvements (`web/src/lib/runtime/environment.ts`)

---

## 2) Chatbot and LLM stack updates

### Guardrails and validation
- semantic fallback validation flow is active:
  1. keyword match
  2. semantic classifier fallback (`classify_query()`)
  3. reject only when both fail
- classifier result logging added in guardrails
- classifier supports bounded TTL cache and in-flight deduplication

### Finance logic layer
- new finance engine at `app/llm/finance_engine.py`
- features:
  - query intent detection
  - structured input control (`intent`, `format`, `tone`, `needs_calculation`)
  - output post-processing and safety rewriting
  - deterministic placeholder calculation path (bypasses LLM for basic calculations)

### LLM orchestration and latency
- `app/llm/llm_service.py` now orchestrates:
  - `validate_query()`
  - finance input logic
  - prompt building with logic
  - LLM call (or direct calculation)
  - finance output logic
- latency optimizations:
  - response cache (TTL)
  - in-flight request deduplication (single-flight)
  - bounded waiting and fail-safe fallback
- `app/llm/llm_client.py` improvements:
  - reusable SSL context
  - bounded token config support
  - malformed provider response handling

---

## 3) Documentation updates made

Updated documents:
- `README.md`
- `docs/FULL_DOCUMENTATION.md`
- `docs/PROJECT_STATUS_2026-04-18.md`
- `docs/CHATBOT_GUARDRAILS.md`
- `docs/LATEST_CHANGES_2026-04-22.md` (this file)

---

## 4) Pending repository action

A merge from `origin/main` into `Chatbot` was started and conflict resolution was applied in:
- `web/src/components/layouts/StudentLayout.tsx`

Complete with:
1. finalize any remaining validations
2. commit merge result
3. push branch
