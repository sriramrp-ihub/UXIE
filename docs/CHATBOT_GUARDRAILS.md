# Chatbot Guardrails: BFSI Domain Validation

## 1. Overview

The initial chatbot guardrail relied only on keyword matching to determine
whether a query was BFSI-related. While this was fast and deterministic,
it could reject implicit finance questions that did not contain an exact keyword.

Example false-negative risk:
- "How does repo rate affect borrowing cost?" (finance intent, may miss keyword list)

To improve accuracy while preserving strict domain control, the system now uses
a 3-layer validation pipeline.

---

## 2. New 3-Layer Validation System

### Layer 1: Keyword Matching (fast path)
- File: `app/llm/guardrails.py`
- Function: `is_bfsi_query(query: str) -> bool`
- Source of terms: `app/llm/constants.py` (`BFSI_ALLOWED_TOPICS`)
- Behavior:
  - Normalize query text.
  - Check if any BFSI keyword exists.
  - If yes, allow immediately.

### Layer 2: Semantic Intent Classification (fallback path)
- File: `app/llm/intent_classifier.py`
- Functions:
  - `is_bfsi_intent(query: str) -> bool` (async)
  - `classify_query(query: str) -> str` (async, returns `in_scope` / `out_of_scope`)
- Behavior:
  - Runs only when keyword layer fails.
  - Sends a strict classification prompt to Gemini.
  - Model must return only `IN_SCOPE` or `OUT_OF_SCOPE`.
  - If classifier returns `IN_SCOPE`, query is allowed.
  - Any classifier error defaults to `OUT_OF_SCOPE` for safety.
  - Uses bounded TTL cache + in-flight request deduplication to reduce latency
    and avoid duplicate classifier calls under concurrent load.

### Layer 3: LLM Response Generation
- Files:
  - `app/llm/llm_service.py`
  - `app/llm/prompt_builder.py`
  - `app/llm/llm_client.py`
- Behavior:
  - Once validation passes, prompt is built with BFSI instructions.
  - Finance input logic controls intent/tone/format before LLM call.
  - Gemini generates the final answer.
  - Finance output logic sanitizes unsafe claims, formats output, and appends disclaimers.
  - Error messages are mapped to safe fallbacks (quota/config/network/unavailable).

### Observability
- Guardrails logs semantic classifier decision at validation time to help verify fallback behavior in production traces.

---

## 3. Flow Diagram (text-based)

User Query
  -> normalize_text()
  -> Layer 1: Keyword Match
       -> if pass: proceed
       -> if fail: Layer 2 Semantic Intent Classifier
             -> if IN_SCOPE: proceed
             -> if OUT_OF_SCOPE/failure: reject with domain fallback
  -> Layer 3: Prompt Builder + LLM Client
  -> Response

---

## 4. Advantages

- Handles implicit finance queries that keyword-only checks miss.
- Reduces false negatives while preserving strict domain boundaries.
- Maintains backward compatibility with existing keyword logic.
- Uses deterministic low-token classifier responses (`temperature=0.0`, small
  output tokens) for faster and more stable intent decisions.
- Adds bounded in-memory cache in semantic layer to reduce repeated
  classification calls.
- Deduplicates concurrent classification requests for identical queries.

---

## 5. Limitations

- Adds slight latency for queries that miss keyword layer and require classifier call.
- Semantic fallback depends on external LLM availability and quota.
- In-memory cache is process-local (not shared across workers/instances).

---

## 7. Production Safety and Edge-Case Handling

- Empty/whitespace prompts are short-circuited before provider call.
- Malformed provider JSON/encoding responses are handled safely.
- Semantic classifier uses fail-safe behavior (`OUT_OF_SCOPE`) on timeout/error.
- In-flight dedup includes bounded wait timeout to prevent stalled requests.
- Owner-task cancellation in classifier path is cleaned up and propagated safely.

---

## 6. Future Improvements

- Replace semantic classifier with embedding similarity retrieval.
- Add a local lightweight intent classifier model for lower latency.
- Introduce hybrid scoring (keyword + semantic + confidence threshold).
- Move classification cache to Redis for multi-instance consistency.
