"""Utility helpers for chatbot text handling."""


def normalize_text(value: str) -> str:
    """Normalize whitespace and trim text input."""
    return " ".join((value or "").strip().split())


def truncate_text(value: str, max_chars: int = 4000) -> str:
    """Hard-limit text size to keep prompts bounded."""
    if len(value) <= max_chars:
        return value
    return value[:max_chars].rstrip()
