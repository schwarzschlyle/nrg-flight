from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import admin, aircraft, auth, booking, flight, seat


api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(aircraft.router)
api_router.include_router(flight.router)
api_router.include_router(seat.router)
api_router.include_router(booking.router)
api_router.include_router(admin.router)
