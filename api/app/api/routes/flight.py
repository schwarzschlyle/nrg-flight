from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_current_active_account, get_db
from app.exceptions.base import FlightNotFoundError, SlotNotFoundError
from app.models import TimeSlot
from app.schemas.flight import FlightResponse, SlotFlightResponse, SlotResponse


router = APIRouter(tags=["flights"])


async def _flight_to_response(db: AsyncSession, flight_id: uuid.UUID) -> FlightResponse:
    flight = await crud.get_flight_by_id(db, flight_id)
    if not flight or not flight.is_active:
        raise FlightNotFoundError("Flight not found")

    total_seats = await crud.get_total_seat_count(db, flight.id)
    available_seats = await crud.get_available_seat_count(db, flight.id)

    return FlightResponse(
        flight_id=flight.id,
        flight_number=flight.flight_number,
        gate=flight.gate,
        departure_date=flight.departure_date,
        departure_time=flight.time_slot.label,
        aircraft_model=flight.aircraft.model,
        total_seats=total_seats,
        available_seats=available_seats,
        is_active=flight.is_active,
    )


@router.get("/slots", response_model=list[SlotResponse])
async def list_slots(
    departure_date: date = Query(..., alias="date"),
    db: AsyncSession = Depends(get_db),
    _account=Depends(get_current_active_account),
) -> list[SlotResponse]:
    slots = await crud.get_slots_by_date(db, departure_date)
    return [SlotResponse(**s) for s in slots]


@router.get("/slots/{slot_id}/flight", response_model=SlotFlightResponse)
async def get_slot_flight(
    slot_id: int,
    departure_date: date = Query(..., alias="date"),
    db: AsyncSession = Depends(get_db),
    _account=Depends(get_current_active_account),
) -> SlotFlightResponse:
    slot = await db.get(TimeSlot, slot_id)
    if not slot:
        raise SlotNotFoundError("Slot not found")

    flight = await crud.get_flight_by_slot_and_date(db, slot_id=slot_id, departure_date=departure_date)
    if not flight:
        raise FlightNotFoundError("Flight not found")

    return SlotFlightResponse(
        flight_id=flight.id,
        flight_number=flight.flight_number,
        gate=flight.gate,
        departure_date=flight.departure_date,
        departure_time=flight.time_slot.label,
    )


@router.get("/flights", response_model=list[FlightResponse])
async def list_flights(
    departure_date: date | None = Query(default=None, alias="date"),
    db: AsyncSession = Depends(get_db),
    _account=Depends(get_current_active_account),
) -> list[FlightResponse]:
    flights = await crud.get_flights(db, departure_date=departure_date)
    out: list[FlightResponse] = []
    for flight in flights:
        out.append(await _flight_to_response(db, flight.id))
    return out


@router.get("/flights/{flight_id}", response_model=FlightResponse)
async def get_flight(
    flight_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _account=Depends(get_current_active_account),
) -> FlightResponse:
    return await _flight_to_response(db, flight_id)
