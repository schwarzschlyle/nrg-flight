from __future__ import annotations

import uuid
from sqlalchemy import text
from langchain_core.tools import tool

from ai_service.core.db import AsyncSessionLocal


@tool("query_window_seats_available")
async def query_window_seats_available(flight_id: str) -> dict:
    """Return how many window seats are available for a flight.

Window seats are the first and last seat letter in a row (e.g., A and F).
"""

    fid = uuid.UUID(flight_id)

    async with AsyncSessionLocal() as db:
        seats_per_row = await db.execute(
            text(
                """
                SELECT a.seats_per_row
                FROM flight f
                JOIN aircraft a ON a.id = f.aircraft_id
                WHERE f.id = :flight_id AND f.is_active = TRUE
                """
            ),
            {"flight_id": fid},
        )
        spr = seats_per_row.scalar()
        if spr is None:
            return {"flight_id": flight_id, "window_seats_available": 0}

        first = "A"
        last = chr(ord("A") + int(spr) - 1)

        cnt = await db.execute(
            text(
                """
                SELECT COUNT(*)
                FROM seat
                WHERE flight_id = :flight_id
                  AND is_booked = FALSE
                  AND (seat_letter = :first OR seat_letter = :last)
                """
            ),
            {"flight_id": fid, "first": first, "last": last},
        )
        return {"flight_id": flight_id, "window_seats_available": int(cnt.scalar() or 0), "first": first, "last": last}
