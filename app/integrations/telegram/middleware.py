"""Telegram middleware helpers."""

from __future__ import annotations

import logging
import re
from collections.abc import Awaitable, Callable
from functools import wraps

logger = logging.getLogger(__name__)


def with_logging(handler: Callable[..., Awaitable[None]]) -> Callable[..., Awaitable[None]]:
    """Decorator to add lightweight logging around telegram handlers."""

    @wraps(handler)
    async def wrapper(*args, **kwargs):
        logger.info("Telegram handler invoked: %s", handler.__name__)
        return await handler(*args, **kwargs)

    return wrapper


def sanitize_telegram_text(text: str) -> str:
    """Normalize LLM markdown-heavy output into plain Telegram-friendly text."""
    value = (text or "").strip()

    # Convert markdown headings and emphasis into plain text.
    value = re.sub(r"^#{1,6}\s*", "", value, flags=re.MULTILINE)
    value = re.sub(r"\*\*(.*?)\*\*", r"\1", value)
    value = re.sub(r"__(.*?)__", r"\1", value)
    value = re.sub(r"`([^`]*)`", r"\1", value)

    # Convert markdown bullets to a consistent unicode bullet.
    value = re.sub(r"^\s*\*\s+", "• ", value, flags=re.MULTILINE)
    value = re.sub(r"^\s*-\s+", "• ", value, flags=re.MULTILINE)

    # Remove leftover standalone asterisks.
    value = value.replace("*", "")

    # Compact excessive blank lines.
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()
