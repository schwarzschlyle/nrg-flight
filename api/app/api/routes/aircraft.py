from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_current_active_account, get_db
from app.exceptions.base import AircraftNotFoundError
from app.schemas.aircraft import AircraftResponse


router = APIRouter(prefix="/aircraft", tags=["aircraft"])


@router.get("", response_model=list[AircraftResponse])
async def list_aircraft(
    db: AsyncSession = Depends(get_db),
    _account=Depends(get_current_active_account),
) -> list[AircraftResponse]:
    items = await crud.get_aircraft(db)
    return [AircraftResponse.model_validate(a) for a in items]


@router.get("/{aircraft_id}", response_model=AircraftResponse)
async def get_aircraft(
    aircraft_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _account=Depends(get_current_active_account),
) -> AircraftResponse:
    aircraft = await crud.get_aircraft_by_id(db, aircraft_id)
    if not aircraft:
        raise AircraftNotFoundError("Aircraft not found")
    return AircraftResponse.model_validate(aircraft)
