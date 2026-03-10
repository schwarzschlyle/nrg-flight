from __future__ import annotations

import uuid
from sqlalchemy import text
from langchain_core.tools import tool

from ai_service.core.db import AsyncSessionLocal


@tool("query_passenger_count_for_flight")
async def query_passenger_count_for_flight(flight_id: str) -> dict:
    """Return how many confirmed passengers (bookings) exist for a flight."""

    fid = uuid.UUID(flight_id)
    sql = text("SELECT COUNT(*) AS cnt FROM booking WHERE flight_id = :flight_id AND status_id = 2")
    async with AsyncSessionLocal() as db:
        cnt = int((await db.execute(sql, {"flight_id": fid})).scalar() or 0)
    return {"flight_id": flight_id, "passengers": cnt}
