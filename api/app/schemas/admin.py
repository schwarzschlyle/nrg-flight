from __future__ import annotations

import uuid
from datetime import date

from pydantic import BaseModel, Field


class CreateAircraftRequest(BaseModel):
    model: str = Field(min_length=1, max_length=80)
    total_rows: int = Field(gt=0, le=200)
    seats_per_row: int = Field(gt=0, le=26)


class AircraftResponse(BaseModel):
    id: uuid.UUID
    model: str
    total_rows: int
    seats_per_row: int

    model_config = {"from_attributes": True}


class CreateFlightRequest(BaseModel):
    time_slot_id: int = Field(ge=0, le=23)
    aircraft_id: uuid.UUID
    departure_date: date


class UpdateFlightRequest(BaseModel):
    gate: str | None = Field(default=None, min_length=1, max_length=6)
    is_active: bool | None = None


class ManifestEntryResponse(BaseModel):
    account_id: uuid.UUID
    full_name: str
    email: str
    seat_code: str
