from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    app_name: str = "LMS Backend"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"
    debug: bool = False

    database_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/lms"
    )
    redis_url: str = Field(default="redis://localhost:6379/0")

    jwt_secret_key: str = Field(default="change-me-in-production")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    verification_token_expire_minutes: int = 60 * 24

    frontend_verify_url: str = "http://localhost:8000/api/v1/auth/verify"
    scorm_storage_dir: str = str(PROJECT_ROOT / "storage" / "scorm")

    cache_ttl_short: int = 60
    cache_ttl_medium: int = 180
    cache_ttl_long: int = 300
    active_user_window_seconds: int = 900

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    gemini_timeout_seconds: float = 20.0

    telegram_bot_token: str = ""

    model_config = SettingsConfigDict(env_file=str(ENV_FILE), env_file_encoding="utf-8")

    @field_validator("debug", mode="before")
    @classmethod
    def normalize_debug(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "development", "dev"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "production", "prod"}:
                return False
        return value

    def model_post_init(self, __context) -> None:  # type: ignore[override]
        scorm_path = Path(self.scorm_storage_dir)
        if not scorm_path.is_absolute():
            self.scorm_storage_dir = str(PROJECT_ROOT / scorm_path)


@lru_cache
def get_settings() -> Settings:
    return Settings()
