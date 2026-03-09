from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_db, require_admin
from app.schemas.admin import (
    AircraftResponse,
    CreateAircraftRequest,
    CreateFlightRequest,
    ManifestEntryResponse,
    UpdateFlightRequest,
)
from app.schemas.flight import FlightResponse


router = APIRouter(prefix="/admin", tags=["admin"])


async def _flight_to_response(db: AsyncSession, flight_id: uuid.UUID) -> FlightResponse:
    flight = await crud.get_flight_by_id(db, flight_id)
    if not flight:
        # Reuse the public flight serializer exception.
        from app.exceptions.base import FlightNotFoundError

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


@router.post("/aircraft", response_model=AircraftResponse, status_code=status.HTTP_201_CREATED)
async def create_aircraft(
    payload: CreateAircraftRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> AircraftResponse:
    aircraft = await crud.create_aircraft(
        db,
        model=payload.model,
        total_rows=payload.total_rows,
        seats_per_row=payload.seats_per_row,
    )
    return AircraftResponse.model_validate(aircraft)


@router.post("/flights", response_model=FlightResponse, status_code=status.HTTP_201_CREATED)
async def create_flight(
    payload: CreateFlightRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> FlightResponse:
    flight = await crud.create_flight_with_seats(
        db,
        time_slot_id=payload.time_slot_id,
        aircraft_id=payload.aircraft_id,
        departure_date=payload.departure_date,
    )
    return await _flight_to_response(db, flight.id)


@router.patch("/flights/{flight_id}", response_model=FlightResponse)
async def patch_flight(
    flight_id: uuid.UUID,
    payload: UpdateFlightRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> FlightResponse:
    flight = await crud.update_flight(db, flight_id=flight_id, gate=payload.gate, is_active=payload.is_active)
    return await _flight_to_response(db, flight.id)


@router.get("/flights/{flight_id}/manifest", response_model=list[ManifestEntryResponse])
async def manifest(
    flight_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> list[ManifestEntryResponse]:
    items = await crud.get_manifest(db, flight_id=flight_id)
    return [ManifestEntryResponse(**item) for item in items]
