"""Telegram command handlers."""

from __future__ import annotations

from typing import Any

from app.integrations.telegram.middleware import with_logging


@with_logging
async def start_command(update: Any, context: Any) -> None:
    if update.message:
        await update.message.reply_text("Welcome to the BFSI assistant. Ask your BFSI question.")


@with_logging
async def help_command(update: Any, context: Any) -> None:
    if update.message:
        await update.message.reply_text("Use this bot for BFSI-related queries only.")
