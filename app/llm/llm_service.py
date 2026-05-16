"""Main orchestration service for chatbot responses."""

import asyncio
import logging
import time

from app.llm.constants import (
    LLM_CONFIG_MESSAGE,
    LLM_NETWORK_MESSAGE,
    LLM_QUOTA_MESSAGE,
    LLM_UNAVAILABLE_MESSAGE,
    OUT_OF_SCOPE_MESSAGE,
)
from app.llm.finance_engine import (
    apply_finance_input_logic,
    apply_finance_output_logic,
    try_compute_finance_calculation,
)
from app.llm.guardrails import validate_query
from app.llm.llm_client import LLMClient
from app.llm.prompt_builder import build_prompt
from app.llm.utils import normalize_text, truncate_text

logger = logging.getLogger(__name__)

_RESPONSE_CACHE_TTL_SECONDS = 180
_RESPONSE_CACHE_MAX_ENTRIES = 512
_INFLIGHT_WAIT_TIMEOUT_SECONDS = 25.0
_DEFAULT_MAX_OUTPUT_TOKENS = 1000

_response_cache: dict[str, tuple[str, float]] = {}
_inflight_requests: dict[str, asyncio.Future[str]] = {}
_response_lock = asyncio.Lock()


def _build_cache_key(query: str) -> str:
    return truncate_text(normalize_text(query), max_chars=1000).lower()


def _get_cached_response(key: str, now: float) -> str | None:
    cached = _response_cache.get(key)
    if cached is None:
        return None
    value, expires_at = cached
    if expires_at <= now:
        _response_cache.pop(key, None)
        return None
    return value


def _set_cached_response(key: str, value: str, now: float) -> None:
    _response_cache[key] = (value, now + _RESPONSE_CACHE_TTL_SECONDS)
    if len(_response_cache) > _RESPONSE_CACHE_MAX_ENTRIES:
        oldest_key = next(iter(_response_cache))
        _response_cache.pop(oldest_key, None)


def _is_cacheable_response(value: str) -> bool:
    non_cacheable = {
        LLM_QUOTA_MESSAGE,
        LLM_CONFIG_MESSAGE,
        LLM_NETWORK_MESSAGE,
        LLM_UNAVAILABLE_MESSAGE,
    }
    return value not in non_cacheable


class LLMService:
    """Business-level entrypoint used by API and external integrations."""

    def __init__(self, client: LLMClient | None = None) -> None:
        self.client = client or LLMClient()

    async def _generate_via_llm(self, query: str, logic: dict[str, str | bool]) -> str:
        prompt = build_prompt(query, logic)
        try:
            response = await self.client.call_llm(
                prompt,
                max_output_tokens=_DEFAULT_MAX_OUTPUT_TOKENS,
            )
            return apply_finance_output_logic(response or OUT_OF_SCOPE_MESSAGE, logic)
        except Exception as exc:  # nosec B110
            logger.warning("LLM call failed: %s", exc)
            msg = str(exc).lower()
            if "429" in msg or "quota" in msg or "resource_exhausted" in msg:
                return LLM_QUOTA_MESSAGE
            if "api_key" in msg or "invalid argument" in msg or "permission" in msg:
                return LLM_CONFIG_MESSAGE
            if "network" in msg or "urlerror" in msg or "connection" in msg or "ssl" in msg:
                return LLM_NETWORK_MESSAGE
            return LLM_UNAVAILABLE_MESSAGE

    async def generate_response(self, query: str) -> str:
        """generate_response(query: str) -> str"""
        valid, fallback = await validate_query(query)
        if not valid:
            return fallback or OUT_OF_SCOPE_MESSAGE

        logic = apply_finance_input_logic(query)
        cache_key = _build_cache_key(query)

        now = time.monotonic()
        cached = _get_cached_response(cache_key, now)
        if cached is not None:
            return cached

        if bool(logic.get("needs_calculation")):
            direct_result = try_compute_finance_calculation(query)
            if direct_result:
                final_direct = apply_finance_output_logic(direct_result, logic)
                if _is_cacheable_response(final_direct):
                    async with _response_lock:
                        _set_cached_response(cache_key, final_direct, time.monotonic())
                return final_direct

        is_owner = False
        async with _response_lock:
            cached = _get_cached_response(cache_key, time.monotonic())
            if cached is not None:
                return cached

            inflight = _inflight_requests.get(cache_key)
            if inflight is None:
                inflight = asyncio.get_running_loop().create_future()
                _inflight_requests[cache_key] = inflight
                is_owner = True

        if not is_owner:
            try:
                return await asyncio.wait_for(inflight, timeout=_INFLIGHT_WAIT_TIMEOUT_SECONDS)
            except (asyncio.TimeoutError, Exception):
                # Fall back to independent generation if shared request is stuck.
                return await self._generate_via_llm(query, logic)

        owner_cancelled = False
        try:
            final_response = await self._generate_via_llm(query, logic)
        except asyncio.CancelledError:
            owner_cancelled = True
            final_response = LLM_UNAVAILABLE_MESSAGE

        async with _response_lock:
            if _is_cacheable_response(final_response):
                _set_cached_response(cache_key, final_response, time.monotonic())
            inflight = _inflight_requests.pop(cache_key, None)
            if inflight is not None and not inflight.done():
                inflight.set_result(final_response)

        if owner_cancelled:
            raise asyncio.CancelledError()

        return final_response


async def generate_response(query: str) -> str:
    """Function-style entrypoint matching required signature."""
    return await LLMService().generate_response(query)
