from __future__ import annotations


class TicketingException(Exception):
    """Base class for domain exceptions (no HTTP knowledge)."""


class EmailAlreadyExistsError(TicketingException):
    pass


class InvalidCredentialsError(TicketingException):
    pass


class AccountInactiveError(TicketingException):
    pass


class FlightNotFoundError(TicketingException):
    pass


class AircraftNotFoundError(TicketingException):
    pass


class FlightAlreadyExistsError(TicketingException):
    pass


class SlotNotFoundError(TicketingException):
    pass


class SeatNotFoundError(TicketingException):
    pass


class SeatAlreadyBookedError(TicketingException):
    pass


class NoAvailableSeatsError(TicketingException):
    pass


class BookingNotFoundError(TicketingException):
    pass


class BookingOwnershipError(TicketingException):
    pass
