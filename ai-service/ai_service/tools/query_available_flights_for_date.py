from __future__ import annotations

from sqlalchemy import text
from langchain_core.tools import tool

from ai_service.core.db import AsyncSessionLocal
from ai_service.tools.common import parse_iso_date


@tool("query_available_flights_for_date")
async def query_available_flights_for_date(departure_date: str) -> list[dict]:
    """List all 24 time slots for a date, including any active flight + aircraft + seat availability."""

    d = parse_iso_date(departure_date)
    sql = text(
        """
        SELECT
          ts.id AS slot_id,
          ts.label AS label,
          f.id AS flight_id,
          f.flight_number AS flight_number,
          f.gate AS gate,
          f.aircraft_id AS aircraft_id,
          a.model AS aircraft_model,
          a.total_rows AS total_rows,
          a.seats_per_row AS seats_per_row,
          COALESCE(SUM(CASE WHEN s.is_booked = FALSE THEN 1 ELSE 0 END), 0) AS available_seats
        FROM time_slot ts
        LEFT JOIN flight f
          ON f.time_slot_id = ts.id
          AND f.departure_date = :departure_date
          AND f.is_active = TRUE
        LEFT JOIN aircraft a ON a.id = f.aircraft_id
        LEFT JOIN seat s ON s.flight_id = f.id
        GROUP BY
          ts.id, ts.label, f.id, f.flight_number, f.gate, f.aircraft_id, a.model, a.total_rows, a.seats_per_row
        ORDER BY ts.id
        """
    )

    async with AsyncSessionLocal() as db:
        rows = (await db.execute(sql, {"departure_date": d})).mappings().all()

    out: list[dict] = []
    for r in rows:
        total_seats = 0
        if r["total_rows"] is not None and r["seats_per_row"] is not None:
            total_seats = int(r["total_rows"]) * int(r["seats_per_row"])

        out.append(
            {
                "slot_id": int(r["slot_id"]),
                "label": r["label"],
                "flight_id": str(r["flight_id"]) if r["flight_id"] is not None else None,
                "flight_number": r["flight_number"],
                "gate": r["gate"],
                "aircraft_id": str(r["aircraft_id"]) if r["aircraft_id"] is not None else None,
                "aircraft_model": r["aircraft_model"],
                "total_seats": total_seats,
                "available_seats": int(r["available_seats"]),
            }
        )
    return out
