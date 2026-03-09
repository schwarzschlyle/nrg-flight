from __future__ import annotations

from app.core.config import Settings


def test_normalize_database_url_postgresql_prefix():
    s = Settings(DATABASE_URL="postgresql://u:p@host/db", SECRET_KEY="x")
    assert s.normalize_database_url().startswith("postgresql+asyncpg://")


def test_normalize_database_url_postgres_prefix():
    s = Settings(DATABASE_URL="postgres://u:p@host/db", SECRET_KEY="x")
    assert s.normalize_database_url().startswith("postgresql+asyncpg://")


def test_normalize_database_url_no_change():
    s = Settings(DATABASE_URL="sqlite+aiosqlite:///test.db", SECRET_KEY="x")
    assert s.normalize_database_url() == "sqlite+aiosqlite:///test.db"


def test_admin_emails_parsing_and_lowercasing():
    s = Settings(DATABASE_URL="sqlite+aiosqlite:///test.db", SECRET_KEY="x", ADMIN_EMAILS="A@X.COM, b@x.com ,")
    assert s.admin_emails == {"a@x.com", "b@x.com"}


def test_cors_origins_parsing():
    s = Settings(DATABASE_URL="sqlite+aiosqlite:///test.db", SECRET_KEY="x", CORS_ORIGINS="http://a, http://b")
    assert s.cors_origins == ["http://a", "http://b"]


def test_cookie_params_production_forces_secure_true():
    s = Settings(
        DATABASE_URL="sqlite+aiosqlite:///test.db",
        SECRET_KEY="x",
        ENVIRONMENT="production",
        REFRESH_TOKEN_COOKIE_SECURE=False,
    )
    params = s.cookie_params()
    assert params["httponly"] is True
    assert params["secure"] is True


def test_health_helpers_time_and_uptime_types():
    from app.health import app_uptime_seconds, utcnow_iso

    assert isinstance(utcnow_iso(), str)
    assert app_uptime_seconds() >= 0
