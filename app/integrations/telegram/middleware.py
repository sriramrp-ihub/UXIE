"""Telegram middleware helpers."""

from __future__ import annotations

import logging
import re
from collections.abc import Awaitable, Callable
from functools import wraps

logger = logging.getLogger(__name__)
TELEGRAM_MESSAGE_LIMIT = 4096
TELEGRAM_SAFE_CHUNK_SIZE = 3500


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

    # Remove prompt-echo artifacts that sometimes leak into model output.
    noisy_prefixes = (
        "intent context:",
        "answer style:",
        "output contract:",
        "tone:",
        "format:",
        "user question:",
        "out-of-scope fallback:",
        "for educational purposes:",
    )
    lines: list[str] = []
    for raw_line in value.splitlines():
        stripped = raw_line.strip()
        lowered = stripped.lower()
        if not stripped:
            lines.append("")
            continue
        matched_prefix = next((prefix for prefix in noisy_prefixes if lowered.startswith(prefix)), None)
        if matched_prefix:
            remainder = stripped[len(matched_prefix) :].lstrip(" :-")
            if remainder:
                lines.append(remainder)
            continue
        lines.append(raw_line)

    value = "\n".join(lines).strip()

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


def split_telegram_text(text: str, max_chars: int = TELEGRAM_SAFE_CHUNK_SIZE) -> list[str]:
    """Split long bot responses into Telegram-safe chunks.

    Prefer paragraph and line boundaries so multi-part answers remain readable.
    """
    value = sanitize_telegram_text(text)
    if not value:
        return []

    if max_chars <= 0 or max_chars > TELEGRAM_MESSAGE_LIMIT:
        max_chars = TELEGRAM_SAFE_CHUNK_SIZE

    paragraphs = value.split("\n\n")
    chunks: list[str] = []
    current = ""

    def flush_current() -> None:
        nonlocal current
        trimmed = current.strip()
        if trimmed:
            chunks.append(trimmed)
        current = ""

    def append_piece(piece: str) -> None:
        nonlocal current
        piece = piece.strip()
        if not piece:
            return

        candidate = piece if not current else f"{current}\n\n{piece}"
        if len(candidate) <= max_chars:
            current = candidate
            return

        flush_current()
        if len(piece) <= max_chars:
            current = piece
            return

        lines = piece.splitlines()
        line_buffer = ""
        for raw_line in lines:
            line = raw_line.rstrip()
            if not line:
                candidate_line = line_buffer + "\n" if line_buffer else ""
            else:
                candidate_line = line if not line_buffer else f"{line_buffer}\n{line}"

            if candidate_line and len(candidate_line) <= max_chars:
                line_buffer = candidate_line
                continue

            if line_buffer:
                chunks.append(line_buffer.strip())
                line_buffer = ""

            if len(line) <= max_chars:
                line_buffer = line
                continue

            start = 0
            while start < len(line):
                end = min(start + max_chars, len(line))
                if end < len(line):
                    split_at = line.rfind(" ", start, end)
                    if split_at > start:
                        end = split_at
                chunks.append(line[start:end].strip())
                start = end
                while start < len(line) and line[start] == " ":
                    start += 1

        if line_buffer.strip():
            chunks.append(line_buffer.strip())

    for paragraph in paragraphs:
        append_piece(paragraph)

    flush_current()
    return chunks
