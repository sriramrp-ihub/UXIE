"""Telegram message handlers that delegate to LLM service."""

from __future__ import annotations

from typing import Any

from app.integrations.telegram.middleware import sanitize_telegram_text, with_logging
from app.llm.llm_service import LLMService

service = LLMService()


@with_logging
async def on_text_message(update: Any, context: Any) -> None:
    if not update.message or not update.message.text:
        return

    answer = await service.generate_response(update.message.text)
    await update.message.reply_text(sanitize_telegram_text(answer))
