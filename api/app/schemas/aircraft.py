from __future__ import annotations

import uuid

from pydantic import BaseModel


class AircraftResponse(BaseModel):
    id: uuid.UUID
    model: str
    total_rows: int
    seats_per_row: int

    model_config = {"from_attributes": True}
