# Integrations And LLM Technical Reference

This document explains the current design and runtime behavior of:

- `app/integrations`
- `app/llm`

It is intended for debugging, onboarding, and regression analysis, especially after the Docker rebuild and chatbot-related fixes.

## Purpose

These two folders together implement the chatbot stack for UXIE:

- `app/integrations`
  Exposes the chatbot to external channels:
  - Web UI via FastAPI `/chat`
  - Telegram bot via long polling

- `app/llm`
  Implements the BFSI assistant behavior:
  - scope validation
  - intent detection
  - deterministic finance formatting
  - Gemini API calls
  - response caching
  - placeholder RAG scaffolding

## High-Level Architecture

User channels:

1. Web client sends `POST /api/v1/chat`
2. Telegram user sends a text message to the bot

Channel adapters:

- Web path:
  `app/integrations/web/routes.py`
  `app/integrations/web/controller.py`

- Telegram path:
  `app/integrations/telegram/bot.py`
  `app/integrations/telegram/handlers.py`

Shared business logic:

- `app/llm/llm_service.py`

Provider and guardrails:

- `app/llm/guardrails.py`
- `app/llm/intent_classifier.py`
- `app/llm/finance_engine.py`
- `app/llm/prompt_builder.py`
- `app/llm/llm_client.py`

## End-To-End Request Flow

### Web Chat Flow

1. Frontend calls `POST /api/v1/chat`
2. `app/integrations/web/routes.py` validates request schema
3. `app/integrations/web/controller.py` calls `LLMService.generate_response(query)`
4. `LLMService` validates scope and generates a response
5. Response is returned as JSON to the frontend

Primary files:

- `app/integrations/web/routes.py`
- `app/integrations/web/controller.py`
- `app/integrations/web/schemas.py`

### Telegram Flow

1. Telegram bot receives an update through polling
2. `app/integrations/telegram/bot.py` routes text messages to `on_text_message`
3. `app/integrations/telegram/handlers.py` calls `LLMService.generate_response(text)`
4. Result is sanitized and split into Telegram-safe chunks
5. Each chunk is sent using `reply_text`

Primary files:

- `app/integrations/telegram/bot.py`
- `app/integrations/telegram/handlers.py`
- `app/integrations/telegram/middleware.py`

## Folder: `app/integrations`

### `app/integrations/__init__.py`

Package marker for external integration adapters.

### Web Integration

#### `app/integrations/web/routes.py`

Responsibilities:

- defines the `/chat` route
- binds request and response schemas
- delegates actual work to the controller

Key behavior:

- creates a small adapter layer only
- does not contain chatbot business logic

#### `app/integrations/web/controller.py`

Responsibilities:

- constructs or reuses a shared `LLMService`
- executes chatbot requests from the web channel

Key behavior:

- the web channel is thin
- all real answer-generation rules live in `app/llm`

#### `app/integrations/web/schemas.py`

Responsibilities:

- validates incoming web requests
- defines web response schema

Schema summary:

- `WebChatRequest.query`
  required, min length 1, max length 4000
- `WebChatResponse.response`
  plain text response

### Telegram Integration

#### `app/integrations/telegram/bot.py`

Responsibilities:

- creates the Telegram application
- wires `/start`, `/help`, and text handlers
- starts long-polling with `run_polling(drop_pending_updates=True)`

Key behavior:

- requires `TELEGRAM_BOT_TOKEN`
- uses polling, not webhooks
- one and only one poller should run for a token

Important operational note:

- if multiple pollers run at once, Telegram returns:
  `Conflict: terminated by other getUpdates request`

#### `app/integrations/telegram/handlers.py`

Responsibilities:

- handles plain text Telegram messages
- delegates to `LLMService`
- sends reply back to Telegram

Current behavior:

- computes the answer through shared chatbot logic
- uses `split_telegram_text(...)`
- sends long replies in multiple Telegram messages

Recent fix:

- older behavior used one `reply_text(...)` for the whole answer
- now replies are chunked safely to avoid incomplete Telegram delivery

#### `app/integrations/telegram/middleware.py`

Responsibilities:

- logs Telegram handler usage
- sanitizes model output for Telegram formatting
- splits long messages into safe chunks

Key functions:

- `with_logging`
  lightweight handler logging decorator
- `sanitize_telegram_text`
  removes noisy prompt artifacts and normalizes markdown-like text
- `split_telegram_text`
  splits long text into chunks under Telegram-safe length

Message limits:

- Telegram theoretical limit tracked as `4096`
- safe chunk size currently set to `3500`

Recent fix:

- long bot responses are now chunked by paragraph and line boundaries
- prevents silent truncation in Telegram channel

#### `app/integrations/telegram/commands.py`

Responsibilities:

- defines `/start`
- defines `/help`

Behavior:

- `/start` sends a welcome prompt
- `/help` explains BFSI-only usage

#### `app/integrations/telegram/config.py`

Responsibilities:

- reads Telegram settings from global app config

Behavior:

- returns a minimal `TelegramSettings` dataclass
- currently only exposes `bot_token`

## Folder: `app/llm`

### `app/llm/__init__.py`

Exports:

- `LLMService`
- `generate_response`
- `ChatRequest`
- `ChatResponse`

### `app/llm/schemas.py`

Pydantic request/response models for internal or future API use.

Models:

- `ChatRequest`
  - `query`
  - optional `session_id`
- `ChatResponse`
  - `answer`
  - `in_scope`
  - `provider`
  - `model`

### `app/llm/constants.py`

Central constants for chatbot behavior.

Contains:

- BFSI keyword allowlist
- common fallback messages
- system instruction prompt

Important constants:

- `OUT_OF_SCOPE_MESSAGE`
- `LLM_UNAVAILABLE_MESSAGE`
- `LLM_QUOTA_MESSAGE`
- `LLM_CONFIG_MESSAGE`
- `LLM_NETWORK_MESSAGE`
- `DEFAULT_SYSTEM_INSTRUCTIONS`

### `app/llm/utils.py`

Low-level text helpers.

Functions:

- `normalize_text`
  trims and compresses whitespace
- `truncate_text`
  hard-limits string size

These helpers are used throughout validation, prompt building, caching, and post-processing.

### `app/llm/prompt_builder.py`

Responsibilities:

- builds final Gemini prompt from:
  - system instructions
  - finance intent
  - formatting guidance
  - user question

Behavior:

- normalizes and truncates user query to 2000 chars
- adjusts instructions by intent:
  - comparison
  - steps
  - definition
  - calculation

This is the point where channel-independent LLM prompting is assembled.

### `app/llm/finance_engine.py`

Deterministic finance logic layer.

Purpose:

- shape prompts before LLM calls
- shape outputs after LLM calls
- provide simple non-LLM calculations when possible

Key functions:

- `detect_finance_intent`
  classifies query into:
  - `investment`
  - `lending`
  - `insurance`
  - `definition`
  - `comparison`
  - `calculation`
  - `general`

- `apply_finance_input_logic`
  returns a control object with:
  - `intent`
  - `format`
  - `tone`
  - `needs_calculation`

- `apply_finance_output_logic`
  post-processes answers:
  - sanitizes unsafe claims
  - formats responses
  - appends disclaimers for finance-sensitive intents

- `try_compute_finance_calculation`
  performs simple deterministic calculations

Key behavior:

- calculation requests may bypass Gemini and return deterministic output
- finance/investment/insurance outputs may get safety disclaimers
- final output is truncated to protect channel size

### `app/llm/guardrails.py`

First line of scope validation.

Responsibilities:

- ensure chatbot stays BFSI-focused
- allow greetings
- fast-path keyword validation
- call semantic classifier if keywords do not match

Flow:

1. normalize input
2. reject empty input
3. allow greetings
4. allow direct BFSI keyword matches
5. otherwise call semantic classifier

Return shape:

- `(True, None)` if allowed
- `(False, message)` if rejected

Important behavior:

- greeting messages like `hi` and `hello` are allowed
- out-of-scope general knowledge queries like `What is Taj Mahal` are rejected

### `app/llm/intent_classifier.py`

Semantic fallback classifier for BFSI scope.

Purpose:

- if keyword matching fails, use Gemini to decide whether the query is BFSI-related

How it works:

- builds a small classification prompt
- asks Gemini to return exactly:
  - `IN_SCOPE`
  - `OUT_OF_SCOPE`

Caching and concurrency:

- classification cache TTL: 600 seconds
- max cached entries: 1024
- deduplicates inflight classification requests

Important operational implication:

- unclear user queries may trigger two separate Gemini calls:
  1. scope classification
  2. actual answer generation

This is one reason Telegram replies can feel slower for ambiguous questions.

### `app/llm/llm_client.py`

Gemini provider adapter.

Responsibilities:

- reads model config from `Settings`
- issues raw HTTP requests to Gemini
- extracts plain text response
- translates provider errors into runtime exceptions

Inputs from config:

- `gemini_api_key`
- `gemini_model`
- `gemini_timeout_seconds`

Current transport details:

- uses Python standard library `urllib.request`
- uses explicit SSL context from `certifi`
- sends `generateContent` request to Gemini REST API

Error categories produced here:

- HTTP error
- network error
- malformed response
- missing API key

Recent fix:

- if Gemini stops because of `MAX_TOKENS`, the returned text now appends:
  `Reply truncated due to response length. Ask me to continue.`

This avoids silent mid-sentence cutoffs.

### `app/llm/llm_service.py`

Main orchestration layer for chatbot behavior.

This is the core business engine used by both web and Telegram channels.

Responsibilities:

- validate scope
- run deterministic finance shortcuts
- build prompt
- call Gemini
- post-process response
- cache answers
- deduplicate concurrent identical requests

Primary flow inside `generate_response(query)`:

1. validate query using `guardrails.validate_query`
2. derive finance intent via `apply_finance_input_logic`
3. check response cache
4. for simple calculations, compute locally
5. deduplicate inflight requests for same normalized question
6. build prompt and call Gemini
7. apply finance output formatting and disclaimers
8. cache safe final responses

Caching:

- response cache TTL: 180 seconds
- max cached entries: 512

Concurrency behavior:

- identical inflight prompts share one response future
- followers wait up to 25 seconds

Recent fix:

- normal answer generation budget increased from `600` to `1000` output tokens
- this reduces mid-sentence cutoffs such as:
  `Here is a structured`

### `app/llm/rag/*`

These files are placeholders for future retrieval-augmented generation.

Current status:

- not used by the active chatbot flow
- not production-ready

Files:

- `app/llm/rag/embedding.py`
  raises `NotImplementedError`
- `app/llm/rag/vector_store.py`
  defines abstract upsert/search contract
- `app/llm/rag/retriever.py`
  orchestrator built on placeholders
- `app/llm/rag/__init__.py`
  package marker

## Runtime Configuration Dependencies

Primary config source:

- `app/core/config.py`

Relevant settings:

- `gemini_api_key`
- `gemini_model`
- `gemini_timeout_seconds`
- `telegram_bot_token`

Operational note:

- the backend and Telegram container must actually receive `.env` values
- editing `.env` alone is not enough if the running container is not restarted or not using `env_file`

## Docker And Deployment Notes

### Backend

The backend service uses:

- `env_file: .env`
- explicit Docker environment overrides for DB/cache/security

This means:

- Gemini and Telegram keys must be present in `.env`
- backend must be recreated or restarted after `.env` changes

### Frontend

The frontend is static and must receive API base URL at build time.

Important fix applied during debugging:

- `VITE_API_URL` is now passed as a build arg in Docker
- this prevents the frontend from baking the wrong API path into the production bundle

### Telegram

The Telegram container also uses `.env`.

Important rule:

- only one Telegram poller should exist for a token

If a second poller runs, symptoms include:

- duplicate hello responses
- out-of-order replies
- long delays
- Telegram `Conflict` errors

## Known Failure Modes

### 1. Gemini API key missing or invalid

Symptoms:

- Web assistant returns:
  `Gemini API key is missing or invalid. Please update server configuration.`
- backend logs show:
  `LLM call failed: GEMINI_API_KEY is not configured`

Common causes:

- `.env` edited but backend container not restarted
- backend container not using `.env`
- typo in key name or invalid key value

### 2. Frontend uses stale or wrong API base URL

Symptoms:

- login flow breaks even though backend works
- browser shows `Cannot read properties of undefined (reading 'access_token')`

Cause:

- static frontend built without correct `VITE_API_URL`

Fix applied:

- build-time `VITE_API_URL` injection in Docker frontend build

### 3. Telegram duplicate or out-of-order replies

Symptoms:

- multiple greetings
- replies attached to unexpected sequence
- delayed response arrival

Cause:

- multiple Telegram pollers sharing same token

Observed log signature:

- `Conflict: terminated by other getUpdates request`

### 4. Telegram network/DNS failures

Symptoms:

- Telegram bot slow or intermittently silent
- long retry gaps

Observed log signature:

- `httpx.ConnectError: [Errno -5] No address associated with hostname`

Cause:

- container networking or DNS resolution issue while contacting Telegram

### 5. Mid-sentence chatbot cutoffs

Symptoms:

- responses end with:
  - `Here is a side-`
  - `Here is a structured`

Cause:

- Gemini output cap hit before response completed

Fix applied:

- higher answer token budget
- explicit truncation note if model still stops at max tokens

### 6. Telegram incomplete long replies

Symptoms:

- long answers arrive only partially

Cause:

- one `reply_text(...)` exceeded practical Telegram payload size

Fix applied:

- chunked Telegram reply sending

### 7. Slower ambiguous BFSI questions

Symptoms:

- short direct BFSI keywords reply quickly
- fuzzy or broad questions take longer

Cause:

- guardrail fallback triggers semantic classification first
- then main answer generation runs

This can mean two Gemini calls for one user message.

## Current State Summary

As of the current codebase:

- Web chatbot route is thin and correct
- Shared `LLMService` is the single answer-generation engine
- Telegram now chunks long messages
- Gemini response budget has been increased
- explicit truncation notice is added for max-token cutoffs
- RAG code exists only as future scaffolding

## Recommended Next Improvements

1. Add structured logging around each stage:
   - guardrail keyword pass
   - classifier fallback
   - deterministic calculation shortcut
   - Gemini call start/end
   - finish reason

2. Add a Telegram typing/action indicator before long LLM calls.

3. Add a single-instance safeguard for Telegram polling.

4. Add tests for:
   - out-of-scope rejection
   - greeting acceptance
   - calculation shortcut
   - Telegram chunk splitting
   - max-token truncation notice

5. Consider reducing semantic-classifier latency by:
   - expanding BFSI keyword coverage
   - caching more aggressively
   - optionally skipping classifier for obviously harmless general finance terms

6. Consider auto-continuation for truncated Telegram/web answers.

## File Reference Index

Integrations:

- `app/integrations/__init__.py`
- `app/integrations/web/__init__.py`
- `app/integrations/web/routes.py`
- `app/integrations/web/controller.py`
- `app/integrations/web/schemas.py`
- `app/integrations/telegram/__init__.py`
- `app/integrations/telegram/bot.py`
- `app/integrations/telegram/handlers.py`
- `app/integrations/telegram/middleware.py`
- `app/integrations/telegram/commands.py`
- `app/integrations/telegram/config.py`

LLM:

- `app/llm/__init__.py`
- `app/llm/schemas.py`
- `app/llm/constants.py`
- `app/llm/utils.py`
- `app/llm/prompt_builder.py`
- `app/llm/finance_engine.py`
- `app/llm/guardrails.py`
- `app/llm/intent_classifier.py`
- `app/llm/llm_client.py`
- `app/llm/llm_service.py`
- `app/llm/rag/__init__.py`
- `app/llm/rag/embedding.py`
- `app/llm/rag/vector_store.py`
- `app/llm/rag/retriever.py`
