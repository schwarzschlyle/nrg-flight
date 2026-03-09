from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic import Field
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


_ROOT_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"  # api/.env


class Settings(BaseSettings):
    # Use an absolute path so `uvicorn` works regardless of current working directory.
    model_config = SettingsConfigDict(env_file=str(_ROOT_ENV_FILE), env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = Field(..., description="PostgreSQL connection string")
    SECRET_KEY: str = Field(..., description="JWT signing secret")

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ENVIRONMENT: str = "development"  # development | production

    # Comma-separated list
    ADMIN_EMAILS: str = ""

    # Comma-separated list of origins
    CORS_ORIGINS: str = ""

    REFRESH_TOKEN_COOKIE_NAME: str = "refresh_token"
    REFRESH_TOKEN_COOKIE_SECURE: bool = False
    REFRESH_TOKEN_COOKIE_SAMESITE: str = "lax"  # lax | strict | none

    @property
    def admin_emails(self) -> set[str]:
        return {email.strip().lower() for email in self.ADMIN_EMAILS.split(",") if email.strip()}

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    def normalize_database_url(self) -> str:
        """Normalize URLs like `postgresql://` to `postgresql+asyncpg://` for SQLAlchemy async."""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    def cookie_params(self) -> dict[str, Any]:
        # In production you typically want Secure cookies.
        secure = self.REFRESH_TOKEN_COOKIE_SECURE if not self.is_production else True
        return {
            "httponly": True,
            "secure": secure,
            "samesite": self.REFRESH_TOKEN_COOKIE_SAMESITE,
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
