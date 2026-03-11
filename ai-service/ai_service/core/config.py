from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


_ROOT_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ROOT_ENV_FILE), env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = Field(..., description="PostgreSQL connection string")
    SECRET_KEY: str = Field(..., description="JWT signing secret (shared with api/ if decoding their JWTs)")
    ALGORITHM: str = "HS256"

    # Optional: the service should still boot without a key (chat endpoint will be disabled).
    OPENAI_API_KEY: str | None = Field(default=None, description="OpenAI API key")
    OPENAI_MODEL: str = "gpt-4.1-mini"

    CORS_ORIGINS: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def openai_enabled(self) -> bool:
        return bool(self.OPENAI_API_KEY)

    def normalize_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
