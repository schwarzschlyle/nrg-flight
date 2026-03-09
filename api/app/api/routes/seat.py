from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_current_active_account, get_db
from app.exceptions.base import FlightNotFoundError, SeatNotFoundError
from app.schemas.seat import SeatMapResponse, SeatResponse


router = APIRouter(tags=["seats"])


def _seat_to_response(seat) -> SeatResponse:
    return SeatResponse(
        seat_id=seat.id,
        seat_code=seat.seat_code,
        row_number=seat.row_number,
        seat_letter=seat.seat_letter,
        is_booked=seat.is_booked,
    )


async def _ensure_flight(db: AsyncSession, flight_id: uuid.UUID) -> None:
    flight = await crud.get_flight_by_id(db, flight_id)
    if not flight or not flight.is_active:
        raise FlightNotFoundError("Flight not found")


@router.get("/flights/{flight_id}/seats", response_model=SeatMapResponse)
async def get_seat_map(
    flight_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _account=Depends(get_current_active_account),
) -> SeatMapResponse:
    await _ensure_flight(db, flight_id)
    seats = await crud.get_seats_by_flight(db, flight_id)
    return SeatMapResponse(flight_id=flight_id, seats=[_seat_to_response(s) for s in seats])


@router.get("/flights/{flight_id}/seats/first-available", response_model=SeatResponse)
async def first_available_seat(
    flight_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _account=Depends(get_current_active_account),
) -> SeatResponse:
    await _ensure_flight(db, flight_id)
    seat = await crud.get_first_available_seat(db, flight_id)
    return _seat_to_response(seat)


@router.get("/flights/{flight_id}/seats/{seat_code}", response_model=SeatResponse)
async def get_seat_by_code(
    flight_id: uuid.UUID,
    seat_code: str,
    db: AsyncSession = Depends(get_db),
    _account=Depends(get_current_active_account),
) -> SeatResponse:
    await _ensure_flight(db, flight_id)
    seat = await crud.get_seat_by_code(db, flight_id=flight_id, seat_code=seat_code)
    if not seat:
        raise SeatNotFoundError("Seat not found")
    return _seat_to_response(seat)
