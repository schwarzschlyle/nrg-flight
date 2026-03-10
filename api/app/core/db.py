from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import CHAR
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from sqlalchemy.types import TypeDecorator

from app.core.config import settings


class GUID(TypeDecorator):
    """Platform-independent GUID type.

    - PostgreSQL: uses native UUID
    - Others (e.g. SQLite): stores as CHAR(36)
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):  # type: ignore[override]
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID

            return dialect.type_descriptor(UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value: Any, dialect):  # type: ignore[override]
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(str(value))
        return str(value)

    def process_result_value(self, value: Any, dialect):  # type: ignore[override]
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))


class Base(DeclarativeBase):
    pass


def create_engine() -> AsyncEngine:
    # Neon URLs are usually `postgresql://...`; we normalize to `postgresql+asyncpg://...`.
    database_url = settings.normalize_database_url()
    url = make_url(database_url)
    query = dict(url.query)

    sslmode = query.pop("sslmode", None)
    # Not supported by asyncpg; included in some Neon connection strings.
    query.pop("channel_binding", None)

    connect_args: dict[str, Any] = {}
    if sslmode and sslmode.lower() not in {"disable", "allow"}:
        # `ssl=True` lets asyncpg create a default SSL context.
        connect_args["ssl"] = True

    url = url.set(query=query)

    return create_async_engine(url, pool_pre_ping=True, poolclass=NullPool, connect_args=connect_args)


engine = create_engine()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
