from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_current_active_account, get_db, get_pagination_params
from app.exceptions.base import BookingNotFoundError, BookingOwnershipError
from app.schemas.booking import BookingListResponse, BookingResponse, CreateBookingRequest
from app.schemas.common import MessageResponse


router = APIRouter(prefix="/bookings", tags=["bookings"])


def _booking_to_response(booking) -> BookingResponse:
    return BookingResponse(
        booking_id=booking.id,
        status=booking.status.label,
        seat_code=booking.seat.seat_code,
        flight_number=booking.flight.flight_number,
        gate=booking.flight.gate,
        departure_date=booking.flight.departure_date,
        departure_time=booking.flight.time_slot.label,
        booked_at=booking.booked_at,
    )


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    payload: CreateBookingRequest,
    db: AsyncSession = Depends(get_db),
    account=Depends(get_current_active_account),
) -> BookingResponse:
    booking = await crud.create_booking(
        db,
        account_id=account.id,
        flight_id=payload.flight_id,
        seat_id=payload.seat_id,
    )
    full = await crud.get_booking_by_id(db, booking.id)
    assert full is not None
    return _booking_to_response(full)


@router.get("", response_model=BookingListResponse)
async def list_bookings(
    status_filter: str | None = Query(default=None, alias="status"),
    departure_date: date | None = Query(default=None, alias="date"),
    pagination: tuple[int, int] = Depends(get_pagination_params),
    db: AsyncSession = Depends(get_db),
    account=Depends(get_current_active_account),
) -> BookingListResponse:
    limit, offset = pagination
    items, total = await crud.get_bookings_by_account(
        db,
        account_id=account.id,
        limit=limit,
        offset=offset,
        status=status_filter,
        departure_date=departure_date,
    )
    return BookingListResponse(items=[_booking_to_response(b) for b in items], total=total)


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    account=Depends(get_current_active_account),
) -> BookingResponse:
    booking = await crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise BookingNotFoundError("Booking not found")
    if booking.account_id != account.id:
        raise BookingOwnershipError("Booking does not belong to account")
    return _booking_to_response(booking)


@router.delete("/{booking_id}", response_model=MessageResponse)
async def delete_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    account=Depends(get_current_active_account),
) -> MessageResponse:
    await crud.cancel_booking(db, booking_id=booking_id, account_id=account.id)
    return MessageResponse(message="Booking cancelled")
