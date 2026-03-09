from __future__ import annotations

import uuid

from app.api.routes import admin
from app.exceptions.base import FlightNotFoundError


def test_admin_flight_to_response_missing_flight(session_maker, event_loop):
    async def _call() -> None:
        async with session_maker() as session:
            try:
                await admin._flight_to_response(session, uuid.uuid4())
            except FlightNotFoundError:
                return
            raise AssertionError("Expected FlightNotFoundError")

    event_loop.run_until_complete(_call())
