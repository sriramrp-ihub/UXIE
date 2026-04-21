"""Telegram bot configuration."""

from __future__ import annotations

from dataclasses import dataclass

from app.core.config import get_settings


@dataclass(frozen=True)
class TelegramSettings:
    bot_token: str


def get_telegram_settings() -> TelegramSettings:
    settings = get_settings()
    return TelegramSettings(bot_token=settings.telegram_bot_token)
