"""Guardrails for BFSI domain validation and policy checks."""

from app.llm.constants import BFSI_ALLOWED_TOPICS, EMPTY_QUERY_MESSAGE, OUT_OF_SCOPE_MESSAGE
from app.llm.intent_classifier import is_bfsi_intent
from app.llm.utils import normalize_text

_BFSI_ALLOWED_TOPICS_LOWER: tuple[str, ...] = tuple(topic.lower() for topic in BFSI_ALLOWED_TOPICS)


def _is_bfsi_query_lower(lowered: str) -> bool:
    """Fast keyword match assuming input is already normalized + lowercase."""
    return any(topic in lowered for topic in _BFSI_ALLOWED_TOPICS_LOWER)


def is_bfsi_query(query: str) -> bool:
    """Keyword-based BFSI scope check.

    Note: This can be replaced by classifier-based validation later.
    """
    lowered = normalize_text(query).lower()
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

    if _is_bfsi_query_lower(cleaned.lower()):
        return True, None

    in_scope_semantic = await is_bfsi_intent(cleaned)
    if not in_scope_semantic:
        return False, OUT_OF_SCOPE_MESSAGE

    return True, None
