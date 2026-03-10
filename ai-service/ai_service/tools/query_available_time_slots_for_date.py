from __future__ import annotations

from sqlalchemy import text
from langchain_core.tools import tool

from ai_service.core.db import AsyncSessionLocal
from ai_service.tools.common import parse_iso_date


@tool("query_available_time_slots_for_date")
async def query_available_time_slots_for_date(departure_date: str) -> list[dict]:
    """List active flight time slots for a date (only slots that have an active flight)."""

    d = parse_iso_date(departure_date)
    sql = text(
        """
        SELECT
          ts.id AS slot_id,
          ts.label AS label,
          f.id AS flight_id,
          f.flight_number AS flight_number,
          f.gate AS gate
        FROM flight f
        JOIN time_slot ts ON ts.id = f.time_slot_id
        WHERE f.departure_date = :departure_date AND f.is_active = TRUE
        ORDER BY ts.id
        """
    )

    async with AsyncSessionLocal() as db:
        rows = (await db.execute(sql, {"departure_date": d})).mappings().all()
    return [
        {
            "slot_id": int(r["slot_id"]),
            "label": r["label"],
            "flight_id": str(r["flight_id"]),
            "flight_number": r["flight_number"],
            "gate": r["gate"],
        }
        for r in rows
    ]
