"""Telegram bot entrypoint.

Requires optional dependency: python-telegram-bot
"""

from __future__ import annotations

from app.integrations.telegram.commands import help_command, start_command
from app.integrations.telegram.config import get_telegram_settings
from app.integrations.telegram.handlers import on_text_message


def start_bot() -> None:
    """Start telegram bot polling loop."""
    settings = get_telegram_settings()
    if not settings.bot_token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not configured")

    try:
        from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters
    except ImportError as exc:
        raise RuntimeError("Install python-telegram-bot to enable Telegram integration") from exc

    app = ApplicationBuilder().token(settings.bot_token).build()
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text_message))
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    start_bot()
