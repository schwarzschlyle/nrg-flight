from __future__ import annotations

import asyncio
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

# Ensure required config exists *before* importing app modules.
# We set these unconditionally so test runs are isolated from the developer's shell env.
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["ADMIN_EMAILS"] = "admin@example.com"
os.environ["CORS_ORIGINS"] = "http://localhost"

from app.core.db import Base  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import BookingStatus, TimeSlot  # noqa: E402


@pytest.fixture(scope="session")
def app():
    return create_app()


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture()
def test_engine(tmp_path, event_loop) -> AsyncEngine:
    db_file = tmp_path / "test.db"
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file}",
        future=True,
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async def _init() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Seed lookup tables (migration does this in prod)
        async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
        async with async_session() as session:
            session.add_all(
                [
                    BookingStatus(id=1, label="pending"),
                    BookingStatus(id=2, label="confirmed"),
                    BookingStatus(id=3, label="cancelled"),
                ]
            )
            session.add_all([TimeSlot(id=i, label=f"{i:02d}:00") for i in range(24)])
            await session.commit()

    event_loop.run_until_complete(_init())

    yield engine

    event_loop.run_until_complete(engine.dispose())


@pytest.fixture()
def session_maker(test_engine: AsyncEngine):
    return async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)


@pytest.fixture()
def client(app, session_maker):

    async def _get_db_override():
        async with session_maker() as session:
            yield session

    from app.api import deps

    app.dependency_overrides[deps.get_db] = _get_db_override
    with TestClient(app) as c:
        yield c

    # Cleanup
    app.dependency_overrides.clear()
