from __future__ import annotations

import uuid
from datetime import date

from pydantic import BaseModel


class SlotResponse(BaseModel):
    slot_id: int
    label: str
    flight_number: str
    gate: str
    flight_id: uuid.UUID | None = None
    aircraft_id: uuid.UUID | None = None
    aircraft_model: str | None = None
    total_seats: int = 0
    available_seats: int = 0


class SlotFlightResponse(BaseModel):
    flight_id: uuid.UUID
    flight_number: str
    gate: str
    departure_date: date
    departure_time: str


class FlightResponse(BaseModel):
    flight_id: uuid.UUID
    flight_number: str
    gate: str
    departure_date: date
    departure_time: str
    aircraft_model: str
    total_seats: int
    available_seats: int
    is_active: bool
