"""Prompt construction for BFSI chatbot."""

from app.llm.constants import DEFAULT_SYSTEM_INSTRUCTIONS, OUT_OF_SCOPE_MESSAGE
from app.llm.utils import normalize_text, truncate_text


def build_prompt(query: str) -> str:
    """build_prompt(query: str) -> str

    Build a final model prompt with system constraints and user text.
    """
    cleaned = truncate_text(normalize_text(query), max_chars=2000)
    return (
        f"{DEFAULT_SYSTEM_INSTRUCTIONS}\n\n"
        f"Out-of-scope fallback: {OUT_OF_SCOPE_MESSAGE}\n\n"
        f"User Question: {cleaned}"
    )
