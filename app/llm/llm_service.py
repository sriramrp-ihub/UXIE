"""Main orchestration service for chatbot responses."""

import logging

from app.llm.constants import (
    LLM_CONFIG_MESSAGE,
    LLM_NETWORK_MESSAGE,
    LLM_QUOTA_MESSAGE,
    LLM_UNAVAILABLE_MESSAGE,
    OUT_OF_SCOPE_MESSAGE,
)
from app.llm.guardrails import validate_query
from app.llm.llm_client import LLMClient
from app.llm.prompt_builder import build_prompt

logger = logging.getLogger(__name__)


class LLMService:
    """Business-level entrypoint used by API and external integrations."""

    def __init__(self, client: LLMClient | None = None) -> None:
        self.client = client or LLMClient()

    async def generate_response(self, query: str) -> str:
        """generate_response(query: str) -> str"""
        valid, fallback = await validate_query(query)
        if not valid:
            return fallback or OUT_OF_SCOPE_MESSAGE

        prompt = build_prompt(query)
        try:
            response = await self.client.call_llm(prompt)
            return response or OUT_OF_SCOPE_MESSAGE
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


async def generate_response(query: str) -> str:
    """Function-style entrypoint matching required signature."""
    return await LLMService().generate_response(query)
