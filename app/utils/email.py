import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def send_verification_email(email: str, token: str) -> None:
    verification_link = f"{settings.frontend_verify_url}?token={token}"
    logger.info("Send verification email to %s: %s", email, verification_link)
