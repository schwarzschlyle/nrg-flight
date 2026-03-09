from __future__ import annotations

import asyncio
from logging.config import fileConfig
from typing import Any

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings
from app.core.db import Base

# Import models so Base.metadata is populated.
from app import models  # noqa: F401  # pylint: disable=unused-import


config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    return settings.normalize_database_url()


def _normalize_alembic_url(*, hide_password: bool = True) -> tuple[str, dict[str, Any]]:
    """Return (url, connect_args) compatible with asyncpg.

    Notes:
    - `str(URL)` **masks** the password (replaces it with `***`). That's great for logs,
      but it breaks actual DB connections if used as the engine URL.
    - asyncpg does not accept libpq URL params like `sslmode`.
    """

    url = make_url(get_url())
    query = dict(url.query)

    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)

    connect_args: dict[str, Any] = {}
    if sslmode and sslmode.lower() not in {"disable", "allow"}:
        connect_args["ssl"] = True

    url = url.set(query=query)
    # IMPORTANT: Use render_as_string(hide_password=False) when we actually need to connect.
    return url.render_as_string(hide_password=hide_password), connect_args


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""

    # Offline mode doesn't connect, so keep secrets out of generated SQL/logs.
    url, _connect_args = _normalize_alembic_url(hide_password=True)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode using an async engine."""

    # Online mode must include the real password (not `***`) or auth will fail.
    url, connect_args = _normalize_alembic_url(hide_password=False)

    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = url

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
