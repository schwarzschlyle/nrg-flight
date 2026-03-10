from __future__ import annotations

from typing import Any

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from ai_service.core.config import settings


def create_engine() -> AsyncEngine:
    database_url = settings.normalize_database_url()
    url = make_url(database_url)
    query = dict(url.query)

    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)

    connect_args: dict[str, Any] = {}
    if sslmode and sslmode.lower() not in {"disable", "allow"}:
        connect_args["ssl"] = True

    url = url.set(query=query)
    return create_async_engine(url, pool_pre_ping=True, poolclass=NullPool, connect_args=connect_args)


engine = create_engine()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
