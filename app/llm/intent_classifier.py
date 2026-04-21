"""Semantic BFSI intent classification layer.

This module provides an async classifier used as a fallback when keyword
matching does not identify a query as BFSI-related.
"""

import asyncio
import time

from app.llm.llm_client import LLMClient
from app.llm.utils import normalize_text, truncate_text

_CLASSIFICATION_CACHE_TTL_SECONDS = 600
_CLASSIFICATION_CACHE_MAX_ENTRIES = 1024
_INFLIGHT_WAIT_TIMEOUT_SECONDS = 25.0

_classification_cache: dict[str, tuple[bool, float]] = {}
_inflight_requests: dict[str, asyncio.Future[bool]] = {}
_cache_lock = asyncio.Lock()
_client = LLMClient()

CLASSIFICATION_PROMPT_TEMPLATE = """
Classify BFSI intent.
Return exactly one token: IN_SCOPE or OUT_OF_SCOPE.
IN_SCOPE = banking, finance, insurance, payments, compliance, risk, investment, economics.
OUT_OF_SCOPE = all other domains.
Query: {query}
""".strip()


def _get_cached_value(key: str, now: float) -> bool | None:
    cached = _classification_cache.get(key)
    if cached is None:
        return None

    value, expires_at = cached
    if expires_at <= now:
        _classification_cache.pop(key, None)
        return None

    return value


def _set_cached_value(key: str, value: bool, now: float) -> None:
    _classification_cache[key] = (value, now + _CLASSIFICATION_CACHE_TTL_SECONDS)
    if len(_classification_cache) > _CLASSIFICATION_CACHE_MAX_ENTRIES:
        # Simple bounded-size eviction by removing oldest inserted key.
        oldest_key = next(iter(_classification_cache))
        _classification_cache.pop(oldest_key, None)


async def _classify_remote(normalized_query: str) -> bool:
    prompt = CLASSIFICATION_PROMPT_TEMPLATE.format(query=normalized_query)
    raw = (
        await _client.call_llm(
            prompt,
            temperature=0.0,
            max_output_tokens=4,
        )
    ).strip().upper()

    if raw == "IN_SCOPE":
        return True
    if raw == "OUT_OF_SCOPE":
        return False

    # Defensive parsing in case model returns extra text.
    return "IN_SCOPE" in raw and "OUT_OF_SCOPE" not in raw


async def is_bfsi_intent(query: str) -> bool:
    """Classify whether a query is BFSI-related using LLM semantic intent.

    Safe behavior:
    - Any classification/API failure returns False (OUT_OF_SCOPE).
    """
    normalized = truncate_text(normalize_text(query), max_chars=1000).lower()
    if not normalized:
        return False

    now = time.monotonic()
    cached = _get_cached_value(normalized, now)
    if cached is not None:
        return cached

    is_owner = False
    async with _cache_lock:
        cached = _get_cached_value(normalized, time.monotonic())
        if cached is not None:
            return cached

        inflight = _inflight_requests.get(normalized)
        if inflight is None:
            inflight = asyncio.get_running_loop().create_future()
            _inflight_requests[normalized] = inflight
            is_owner = True

    if not is_owner:
        try:
            return await asyncio.wait_for(inflight, timeout=_INFLIGHT_WAIT_TIMEOUT_SECONDS)
        except (asyncio.TimeoutError, Exception):
            # Fail-safe: avoid request stalls when owner task is interrupted.
            return False

    owner_cancelled = False
    try:
        result = await _classify_remote(normalized)
    except asyncio.CancelledError:
        owner_cancelled = True
        result = False
    except Exception:  # nosec B110
        result = False

    async with _cache_lock:
        _set_cached_value(normalized, result, time.monotonic())
        inflight = _inflight_requests.pop(normalized, None)
        if inflight is not None and not inflight.done():
            inflight.set_result(result)

    if owner_cancelled:
        raise asyncio.CancelledError()

    return result
