"""Guardrails for BFSI domain validation and policy checks."""

import logging
import re

from app.llm.constants import BFSI_ALLOWED_TOPICS, EMPTY_QUERY_MESSAGE, OUT_OF_SCOPE_MESSAGE
from app.llm.intent_classifier import classify_query
from app.llm.utils import normalize_text

_BFSI_ALLOWED_TOPICS_LOWER: tuple[str, ...] = tuple(topic.lower() for topic in BFSI_ALLOWED_TOPICS)
_BFSI_TOPIC_TOKENS: frozenset[str] = frozenset(
    token
    for topic in _BFSI_ALLOWED_TOPICS_LOWER
    for token in re.findall(r"[a-z]+", topic)
    if len(token) >= 3
)
logger = logging.getLogger(__name__)

_GREETING_TOKENS: tuple[str, ...] = (
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "namaste",
)


def _is_bfsi_query_lower(lowered: str) -> bool:
    """Fast keyword match assuming input is already normalized + lowercase."""
    return any(topic in lowered for topic in _BFSI_ALLOWED_TOPICS_LOWER)


def _has_bfsi_token_signal(lowered: str) -> bool:
    tokens = re.findall(r"[a-z]+", lowered)
    if not tokens:
        return False

    overlap = [token for token in tokens if token in _BFSI_TOPIC_TOKENS]
    if len(overlap) >= 1:
        return True

    # Light typo tolerance for a few high-frequency BFSI words.
    fuzzy_targets = ("bank", "banking", "interest", "insurance", "finance", "atm", "loan", "credit")
    for token in tokens:
        if len(token) < 4:
            continue
        for target in fuzzy_targets:
            if abs(len(token) - len(target)) <= 2 and token[0] == target[0] and token[-1] == target[-1]:
                return True
    return False


def is_bfsi_query(query: str) -> bool:
    """Keyword-based BFSI scope check.

    Note: This can be replaced by classifier-based validation later.
    """
    lowered = normalize_text(query).lower()
    if any(lowered == token or lowered.startswith(f"{token} ") for token in _GREETING_TOKENS):
        return True
    return _is_bfsi_query_lower(lowered)


async def validate_query(query: str) -> tuple[bool, str | None]:
    """Validate query and return (is_valid, rejection_message_if_any).

    Multi-layer validation order:
    1) Keyword-based BFSI match (fast path)
    2) Semantic intent classifier fallback (LLM-based)
    """
    cleaned = normalize_text(query)
    if not cleaned:
        return False, EMPTY_QUERY_MESSAGE

    lowered = cleaned.lower()
    if any(lowered == token or lowered.startswith(f"{token} ") for token in _GREETING_TOKENS):
        return True, None

    if _is_bfsi_query_lower(lowered) or _has_bfsi_token_signal(lowered):
        return True, None

    intent = await classify_query(cleaned)
    logger.info("Guardrail semantic classifier result: %s", intent)

    if intent == "in_scope":
        return True, None

    return False, OUT_OF_SCOPE_MESSAGE
