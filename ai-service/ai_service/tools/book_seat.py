from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from sqlalchemy import text
from langchain_core.messages import ToolMessage
from langchain_core.tools import InjectedToolCallId, tool
from langgraph.prebuilt import InjectedState
from langgraph.types import Command

from ai_service.core.db import AsyncSessionLocal
from ai_service.tools.common import parse_iso_date


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


@tool("book_seat")
async def book_seat(
    departure_date: str | None = None,
    slot_id: int | None = None,
    seat_code: str | None = None,
    aircraft_id: str | None = None,
    aircraft_model: str | None = None,
    confirm: bool = False,
    state: Annotated[dict, InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> Command | dict:
    """Book a specific seat on a specific flight slot.

This tool enforces a human-in-the-loop confirmation step:
- If confirm=false, it will *not* write to the database. It stores a pending booking request and asks for confirmation.
- If confirm=true, it will attempt to book using either the provided args or the stored pending booking.
"""

    # NOTE:
    # - `state` is injected by LangGraph's ToolNode via `InjectedState`
    # - `tool_call_id` is injected by LangChain via `InjectedToolCallId`
    # This replaces the old (and now removed) `ToolRuntime` API.
    state = state or {}
    pending = state.get("pending_booking") or {}

    if confirm:
        departure_date = departure_date or pending.get("departure_date")
        slot_id = slot_id if slot_id is not None else pending.get("slot_id")
        seat_code = seat_code or pending.get("seat_code")
        aircraft_id = aircraft_id or pending.get("aircraft_id")
        aircraft_model = aircraft_model or pending.get("aircraft_model")

    missing: list[str] = []
    if not departure_date:
        missing.append("departure_date (YYYY-MM-DD)")
    if slot_id is None:
        missing.append("slot_id (0-23)")
    if not seat_code:
        missing.append("seat_code (e.g. 12A)")

    if missing:
        msg = "To book a seat, I need: " + ", ".join(missing) + "."
        if tool_call_id:
            return Command(
                update={
                    "pending_booking": {
                        "departure_date": departure_date,
                        "slot_id": slot_id,
                        "seat_code": seat_code,
                        "aircraft_id": aircraft_id,
                        "aircraft_model": aircraft_model,
                    },
                    "messages": [ToolMessage(content=msg, tool_call_id=tool_call_id)],
                }
            )
        return {"needs": missing, "message": msg}

    if not confirm:
        summary = {
            "departure_date": departure_date,
            "slot_id": slot_id,
            "seat_code": seat_code,
            "aircraft_id": aircraft_id,
            "aircraft_model": aircraft_model,
        }
        msg = (
            "I can book this seat, but I need your confirmation first. "
            f"Reply 'confirm' to proceed: {summary}"
        )

        if tool_call_id:
            return Command(
                update={
                    "pending_booking": summary,
                    "messages": [ToolMessage(content=msg, tool_call_id=tool_call_id)],
                }
            )
        return {"status": "needs_confirmation", "pending_booking": summary, "message": msg}

    account_id_raw = state.get("account_id")
    if not account_id_raw:
        msg = "You're not logged in. Please sign in first, then say 'confirm' again."
        if tool_call_id:
            return Command(update={"messages": [ToolMessage(content=msg, tool_call_id=tool_call_id)]})
        return {"error": "unauthorized", "message": msg}

    account_id = uuid.UUID(str(account_id_raw))

    d = parse_iso_date(departure_date)
    booking_id = uuid.uuid4()
    now = _now_utc()

    async with AsyncSessionLocal() as db:
        async with db.begin():
            acct = await db.execute(
                text("SELECT is_active, deleted_at FROM account WHERE id = :id"),
                {"id": account_id},
            )
            acct_row = acct.mappings().first()
            if not acct_row or (acct_row["deleted_at"] is not None) or (acct_row["is_active"] is False):
                raise ValueError("Account is inactive or not found")

            flight = await db.execute(
                text(
                    """
                    SELECT f.id, f.flight_number, f.gate, f.aircraft_id, ts.label AS departure_time
                    FROM flight f
                    JOIN time_slot ts ON ts.id = f.time_slot_id
                    WHERE f.departure_date = :departure_date
                      AND f.time_slot_id = :slot_id
                      AND f.is_active = TRUE
                    """
                ),
                {"departure_date": d, "slot_id": int(slot_id)},
            )
            flight_row = flight.mappings().first()
            if not flight_row:
                raise ValueError("No active flight found for that date + slot")

            if aircraft_id and str(flight_row["aircraft_id"]) != str(aircraft_id):
                raise ValueError("That flight slot does not use the specified aircraft_id")

            if aircraft_model:
                am = await db.execute(
                    text("SELECT model FROM aircraft WHERE id = :id"),
                    {"id": flight_row["aircraft_id"]},
                )
                model = am.scalar()
                if model and str(model).lower() != str(aircraft_model).lower():
                    raise ValueError("That flight slot does not use the specified aircraft_model")

            seat = await db.execute(
                text(
                    """
                    SELECT id, is_booked
                    FROM seat
                    WHERE flight_id = :flight_id AND UPPER(seat_code) = UPPER(:seat_code)
                    """
                ),
                {"flight_id": flight_row["id"], "seat_code": str(seat_code)},
            )
            seat_row = seat.mappings().first()
            if not seat_row:
                raise ValueError("Seat not found")

            claim = await db.execute(
                text(
                    """
                    UPDATE seat
                    SET is_booked = TRUE, updated_at = now()
                    WHERE id = :seat_id AND flight_id = :flight_id AND is_booked = FALSE
                    """
                ),
                {"seat_id": seat_row["id"], "flight_id": flight_row["id"]},
            )
            if claim.rowcount == 0:
                raise ValueError("Seat already booked")

            await db.execute(
                text(
                    """
                    INSERT INTO booking (id, account_id, seat_id, flight_id, status_id, confirmed_at, created_at, updated_at)
                    VALUES (:id, :account_id, :seat_id, :flight_id, 2, :confirmed_at, :created_at, :updated_at)
                    """
                ),
                {
                    "id": booking_id,
                    "account_id": account_id,
                    "seat_id": seat_row["id"],
                    "flight_id": flight_row["id"],
                    "confirmed_at": now,
                    "created_at": now,
                    "updated_at": now,
                },
            )

        result = {
            "booking_id": str(booking_id),
            "flight_id": str(flight_row["id"]),
            "flight_number": flight_row["flight_number"],
            "gate": flight_row["gate"],
            "departure_date": departure_date,
            "departure_time": flight_row["departure_time"],
            "seat_code": str(seat_code).upper(),
        }

    if tool_call_id:
        return Command(
            update={
                "pending_booking": None,
                "messages": [ToolMessage(content=str(result), tool_call_id=tool_call_id)],
            }
        )
    return result
