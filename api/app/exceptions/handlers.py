from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.exceptions import base


def _json_error(message: str, status_code: int, headers: dict[str, str] | None = None) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"message": message}, headers=headers)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(_request, exc: HTTPException):
        # Normalize FastAPI's default {"detail": ...} to {"message": ...}
        return _json_error(str(exc.detail), exc.status_code, headers=exc.headers)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_request, exc: RequestValidationError):
        return _json_error("Validation error", 422)

    @app.exception_handler(base.EmailAlreadyExistsError)
    async def email_exists_handler(_request, exc: base.EmailAlreadyExistsError):
        return _json_error(str(exc) or "Email already exists", 409)

    @app.exception_handler(base.InvalidCredentialsError)
    async def invalid_credentials_handler(_request, exc: base.InvalidCredentialsError):
        return _json_error(str(exc) or "Invalid credentials", 401)

    @app.exception_handler(base.AccountInactiveError)
    async def account_inactive_handler(_request, exc: base.AccountInactiveError):
        return _json_error(str(exc) or "Account is inactive", 403)

    @app.exception_handler(base.FlightNotFoundError)
    async def flight_not_found_handler(_request, exc: base.FlightNotFoundError):
        return _json_error(str(exc) or "Flight not found", 404)

    @app.exception_handler(base.AircraftNotFoundError)
    async def aircraft_not_found_handler(_request, exc: base.AircraftNotFoundError):
        return _json_error(str(exc) or "Aircraft not found", 404)

    @app.exception_handler(base.FlightAlreadyExistsError)
    async def flight_already_exists_handler(_request, exc: base.FlightAlreadyExistsError):
        return _json_error(str(exc) or "Flight already exists", 409)

    @app.exception_handler(base.SlotNotFoundError)
    async def slot_not_found_handler(_request, exc: base.SlotNotFoundError):
        return _json_error(str(exc) or "Slot not found", 404)

    @app.exception_handler(base.SeatNotFoundError)
    async def seat_not_found_handler(_request, exc: base.SeatNotFoundError):
        return _json_error(str(exc) or "Seat not found", 404)

    @app.exception_handler(base.NoAvailableSeatsError)
    async def no_available_seats_handler(_request, exc: base.NoAvailableSeatsError):
        return _json_error(str(exc) or "No available seats", 409)

    @app.exception_handler(base.SeatAlreadyBookedError)
    async def seat_already_booked_handler(_request, exc: base.SeatAlreadyBookedError):
        return _json_error(str(exc) or "Seat already booked", 409)

    @app.exception_handler(base.BookingNotFoundError)
    async def booking_not_found_handler(_request, exc: base.BookingNotFoundError):
        return _json_error(str(exc) or "Booking not found", 404)

    @app.exception_handler(base.BookingOwnershipError)
    async def booking_ownership_handler(_request, exc: base.BookingOwnershipError):
        return _json_error(str(exc) or "Forbidden", 403)
