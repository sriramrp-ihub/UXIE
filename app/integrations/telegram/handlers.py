"""Telegram message handlers that delegate to LLM service."""

from __future__ import annotations

from typing import Any

from app.integrations.telegram.middleware import split_telegram_text, with_logging
from app.llm.llm_service import LLMService

service = LLMService()


@with_logging
async def on_text_message(update: Any, context: Any) -> None:
    if not update.message or not update.message.text:
        return

    answer = await service.generate_response(update.message.text)
    chunks = split_telegram_text(answer)
    if not chunks:
        await update.message.reply_text("I could not generate a response. Please try again.")
        return

    for chunk in chunks:
        await update.message.reply_text(chunk)
