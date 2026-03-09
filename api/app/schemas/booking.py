from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel


class CreateBookingRequest(BaseModel):
    flight_id: uuid.UUID
    seat_id: uuid.UUID


class BookingResponse(BaseModel):
    booking_id: uuid.UUID
    status: str
    seat_code: str
    flight_number: str
    gate: str
    departure_date: date
    departure_time: str
    booked_at: datetime


class BookingListResponse(BaseModel):
    items: list[BookingResponse]
    total: int
