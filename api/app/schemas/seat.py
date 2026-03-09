from __future__ import annotations

import uuid

from pydantic import BaseModel


class SeatResponse(BaseModel):
    seat_id: uuid.UUID
    seat_code: str
    row_number: int
    seat_letter: str
    is_booked: bool


class SeatMapResponse(BaseModel):
    flight_id: uuid.UUID
    seats: list[SeatResponse]
