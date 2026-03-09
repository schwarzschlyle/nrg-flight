from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from datetime import date

from sqlalchemy import Select, and_, case, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import hash_password, utcnow, verify_password
from app.exceptions.base import (
    BookingNotFoundError,
    BookingOwnershipError,
    AircraftNotFoundError,
    EmailAlreadyExistsError,
    FlightAlreadyExistsError,
    FlightNotFoundError,
    InvalidCredentialsError,
    NoAvailableSeatsError,
    SeatAlreadyBookedError,
    SeatNotFoundError,
    SlotNotFoundError,
)
from app.models import Account, Aircraft, Booking, BookingStatus, Flight, Seat, TimeSlot
from app.utils import generate_seat_codes, get_slot_flight_number, get_slot_gate


@asynccontextmanager
async def _transaction(db: AsyncSession):
    if db.in_transaction():
        try:
            yield
            await db.commit()
        except Exception:
            await db.rollback()
            raise
    else:
        async with db.begin():
            yield


# ---------------------------------------------------------------------------
# Aircraft
# ---------------------------------------------------------------------------


async def get_aircraft(db: AsyncSession) -> list[Aircraft]:
    q = select(Aircraft).order_by(Aircraft.model.asc(), Aircraft.created_at.desc())
    return list((await db.scalars(q)).all())


async def get_aircraft_by_id(db: AsyncSession, aircraft_id: uuid.UUID) -> Aircraft | None:
    return await db.get(Aircraft, aircraft_id)


# ---------------------------------------------------------------------------
# Accounts
# ---------------------------------------------------------------------------


async def get_account_by_id(db: AsyncSession, account_id: uuid.UUID) -> Account | None:
    return await db.get(Account, account_id)


async def get_account_by_email(db: AsyncSession, email: str) -> Account | None:
    q = select(Account).where(func.lower(Account.email) == email.lower())
    return await db.scalar(q)


async def create_account(db: AsyncSession, *, email: str, password: str, full_name: str) -> Account:
    existing = await get_account_by_email(db, email)
    if existing:
        raise EmailAlreadyExistsError("Email already exists")

    account = Account(email=email.lower(), password_hash=hash_password(password), full_name=full_name)
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


async def authenticate_account(db: AsyncSession, *, email: str, password: str) -> Account:
    account = await get_account_by_email(db, email)
    if not account:
        raise InvalidCredentialsError("Invalid credentials")
    if not verify_password(password, account.password_hash):
        raise InvalidCredentialsError("Invalid credentials")
    return account


# ---------------------------------------------------------------------------
# Slots / Flights
# ---------------------------------------------------------------------------


def _available_seats_expr() -> case:
    return case((Seat.is_booked.is_(False), 1), else_=0)


async def get_slots_by_date(db: AsyncSession, departure_date: date) -> list[dict]:
    """Return all 24 slots with optional flight + seat counts for the given date."""

    # We compute flight_number + gate from slot_id (seed mapping).
    # Flight rows are created by admin per date+slot.
    q = (
        select(
            TimeSlot.id.label("slot_id"),
            TimeSlot.label.label("label"),
            Flight.id.label("flight_id"),
            Flight.flight_number.label("flight_number"),
            Flight.gate.label("gate"),
            Flight.is_active.label("is_active"),
            Flight.aircraft_id.label("aircraft_id"),
            Aircraft.total_rows.label("total_rows"),
            Aircraft.seats_per_row.label("seats_per_row"),
            Aircraft.model.label("aircraft_model"),
            func.coalesce(func.sum(_available_seats_expr()), 0).label("available_seats"),
        )
        .select_from(TimeSlot)
        .join(
            Flight,
            and_(Flight.time_slot_id == TimeSlot.id, Flight.departure_date == departure_date),
            isouter=True,
        )
        .join(Aircraft, Aircraft.id == Flight.aircraft_id, isouter=True)
        .join(Seat, Seat.flight_id == Flight.id, isouter=True)
        .group_by(
            TimeSlot.id,
            TimeSlot.label,
            Flight.id,
            Flight.flight_number,
            Flight.gate,
            Flight.is_active,
            Flight.aircraft_id,
            Aircraft.total_rows,
            Aircraft.seats_per_row,
            Aircraft.model,
        )
        .order_by(TimeSlot.id)
    )

    rows = (await db.execute(q)).mappings().all()

    out: list[dict] = []
    for row in rows:
        slot_id = int(row["slot_id"])
        total_seats = 0
        if row["total_rows"] is not None and row["seats_per_row"] is not None:
            total_seats = int(row["total_rows"]) * int(row["seats_per_row"])

        flight_id = row["flight_id"]
        if flight_id is not None and row["is_active"] is False:
            # Treat inactive flights as non-existent for booking UI.
            flight_id = None
            total_seats = 0

        aircraft_id = row["aircraft_id"] if flight_id is not None else None
        aircraft_model = row["aircraft_model"] if flight_id is not None else None

        available_seats = 0 if flight_id is None else int(row["available_seats"])

        out.append(
            {
                "slot_id": slot_id,
                "label": row["label"],
                "flight_number": row["flight_number"] or get_slot_flight_number(slot_id),
                "gate": row["gate"] or get_slot_gate(slot_id),
                "flight_id": flight_id,
                "aircraft_id": aircraft_id,
                "aircraft_model": aircraft_model,
                "total_seats": total_seats,
                "available_seats": available_seats,
            }
        )
    return out


async def get_flight_by_id(db: AsyncSession, flight_id: uuid.UUID) -> Flight | None:
    q = (
        select(Flight)
        .where(Flight.id == flight_id)
        .options(selectinload(Flight.aircraft), selectinload(Flight.time_slot))
    )
    return await db.scalar(q)


async def get_flight_by_slot_and_date(
    db: AsyncSession,
    *,
    slot_id: int,
    departure_date: date,
    include_inactive: bool = False,
) -> Flight | None:
    filters = [Flight.time_slot_id == slot_id, Flight.departure_date == departure_date]
    if not include_inactive:
        filters.append(Flight.is_active.is_(True))

    q = select(Flight).where(and_(*filters)).options(selectinload(Flight.aircraft), selectinload(Flight.time_slot))
    return await db.scalar(q)


async def get_flights(db: AsyncSession, *, departure_date: date | None = None) -> list[Flight]:
    q: Select = (
        select(Flight)
        .where(Flight.is_active.is_(True))
        .options(selectinload(Flight.aircraft), selectinload(Flight.time_slot))
    )
    if departure_date is not None:
        q = q.where(Flight.departure_date == departure_date)
    q = q.order_by(Flight.departure_date.desc(), Flight.time_slot_id.asc())
    return list((await db.scalars(q)).all())


async def get_available_seat_count(db: AsyncSession, flight_id: uuid.UUID) -> int:
    q = select(func.count(Seat.id)).where(and_(Seat.flight_id == flight_id, Seat.is_booked.is_(False)))
    return int(await db.scalar(q) or 0)


async def get_total_seat_count(db: AsyncSession, flight_id: uuid.UUID) -> int:
    q = select(func.count(Seat.id)).where(Seat.flight_id == flight_id)
    return int(await db.scalar(q) or 0)


# ---------------------------------------------------------------------------
# Seats
# ---------------------------------------------------------------------------


async def get_seats_by_flight(db: AsyncSession, flight_id: uuid.UUID) -> list[Seat]:
    q = select(Seat).where(Seat.flight_id == flight_id).order_by(Seat.row_number.asc(), Seat.seat_letter.asc())
    return list((await db.scalars(q)).all())


async def get_first_available_seat(db: AsyncSession, flight_id: uuid.UUID) -> Seat:
    q = (
        select(Seat)
        .where(and_(Seat.flight_id == flight_id, Seat.is_booked.is_(False)))
        .order_by(Seat.row_number.asc(), Seat.seat_letter.asc())
        .limit(1)
    )
    seat = await db.scalar(q)
    if not seat:
        raise NoAvailableSeatsError("No available seats")
    return seat


async def get_seat_by_code(db: AsyncSession, *, flight_id: uuid.UUID, seat_code: str) -> Seat | None:
    q = select(Seat).where(and_(Seat.flight_id == flight_id, func.upper(Seat.seat_code) == seat_code.upper()))
    return await db.scalar(q)


# ---------------------------------------------------------------------------
# Bookings
# ---------------------------------------------------------------------------


async def create_booking(
    db: AsyncSession,
    *,
    account_id: uuid.UUID,
    flight_id: uuid.UUID,
    seat_id: uuid.UUID,
) -> Booking:
    """Book a seat with concurrency-safe seat claiming."""

    async with _transaction(db):
        flight = await get_flight_by_id(db, flight_id)
        if not flight or not flight.is_active:
            raise FlightNotFoundError("Flight not found")

        # Atomic claim: only flips is_booked from FALSE->TRUE.
        claim = (
            update(Seat)
            .where(and_(Seat.id == seat_id, Seat.flight_id == flight_id, Seat.is_booked.is_(False)))
            .values(is_booked=True)
        )
        result = await db.execute(claim)
        if result.rowcount == 0:
            seat = await db.scalar(select(Seat).where(and_(Seat.id == seat_id, Seat.flight_id == flight_id)))
            if not seat:
                raise SeatNotFoundError("Seat not found")
            raise SeatAlreadyBookedError("Seat already booked")

        booking = Booking(
            account_id=account_id,
            seat_id=seat_id,
            flight_id=flight_id,
            status_id=2,
            confirmed_at=utcnow(),
        )
        db.add(booking)
        await db.flush()

    await db.refresh(booking)
    return booking


async def get_booking_by_id(db: AsyncSession, booking_id: uuid.UUID) -> Booking | None:
    q = (
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.flight).selectinload(Flight.time_slot),
            selectinload(Booking.flight).selectinload(Flight.aircraft),
            selectinload(Booking.seat),
            selectinload(Booking.status),
        )
    )
    return await db.scalar(q)


async def get_bookings_by_account(
    db: AsyncSession,
    *,
    account_id: uuid.UUID,
    limit: int,
    offset: int,
    status: str | None = None,
    departure_date: date | None = None,
) -> tuple[list[Booking], int]:
    q = (
        select(Booking)
        .where(Booking.account_id == account_id)
        .options(
            selectinload(Booking.flight).selectinload(Flight.time_slot),
            selectinload(Booking.seat),
            selectinload(Booking.status),
        )
        .order_by(Booking.booked_at.desc())
    )

    count_q = select(func.count(Booking.id)).where(Booking.account_id == account_id)

    if status is not None:
        q = q.join(BookingStatus).where(func.lower(BookingStatus.label) == status.lower())
        count_q = count_q.join(BookingStatus).where(func.lower(BookingStatus.label) == status.lower())

    if departure_date is not None:
        q = q.join(Flight).where(Flight.departure_date == departure_date)
        count_q = count_q.join(Flight).where(Flight.departure_date == departure_date)

    total = int(await db.scalar(count_q) or 0)
    q = q.limit(limit).offset(offset)
    items = list((await db.scalars(q)).all())
    return items, total


async def cancel_booking(db: AsyncSession, *, booking_id: uuid.UUID, account_id: uuid.UUID) -> Booking:
    async with _transaction(db):
        booking = await db.scalar(
            select(Booking)
            .where(Booking.id == booking_id)
            .options(selectinload(Booking.seat), selectinload(Booking.status))
        )
        if not booking:
            raise BookingNotFoundError("Booking not found")
        if booking.account_id != account_id:
            raise BookingOwnershipError("Booking does not belong to account")

        # Idempotent cancellation.
        if booking.status_id != 3:
            booking.status_id = 3
            booking.cancelled_at = utcnow()
            await db.execute(update(Seat).where(Seat.id == booking.seat_id).values(is_booked=False))

    await db.refresh(booking)
    return booking


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------


async def create_aircraft(db: AsyncSession, *, model: str, total_rows: int, seats_per_row: int) -> Aircraft:
    aircraft = Aircraft(model=model, total_rows=total_rows, seats_per_row=seats_per_row)
    db.add(aircraft)
    await db.commit()
    await db.refresh(aircraft)
    return aircraft


async def create_flight_with_seats(
    db: AsyncSession,
    *,
    time_slot_id: int,
    aircraft_id: uuid.UUID,
    departure_date: date,
) -> Flight:
    async with _transaction(db):
        slot = await db.get(TimeSlot, time_slot_id)
        if not slot:
            raise SlotNotFoundError("Slot not found")

        aircraft = await db.get(Aircraft, aircraft_id)
        if not aircraft:
            raise AircraftNotFoundError("Aircraft not found")

        existing = await get_flight_by_slot_and_date(
            db,
            slot_id=time_slot_id,
            departure_date=departure_date,
            include_inactive=True,
        )
        if existing:
            raise FlightAlreadyExistsError("Flight already exists")

        flight = Flight(
            time_slot_id=time_slot_id,
            aircraft_id=aircraft_id,
            flight_number=get_slot_flight_number(time_slot_id),
            gate=get_slot_gate(time_slot_id),
            departure_date=departure_date,
            is_active=True,
        )
        db.add(flight)
        await db.flush()

        seats = [Seat(flight_id=flight.id, seat_code=code, row_number=row, seat_letter=letter) for code, row, letter in generate_seat_codes(aircraft.total_rows, aircraft.seats_per_row)]
        db.add_all(seats)

    await db.refresh(flight)
    return flight


async def update_flight(db: AsyncSession, *, flight_id: uuid.UUID, gate: str | None, is_active: bool | None) -> Flight:
    flight = await get_flight_by_id(db, flight_id)
    if not flight:
        raise FlightNotFoundError("Flight not found")

    if gate is not None:
        flight.gate = gate
    if is_active is not None:
        flight.is_active = is_active

    await db.commit()
    await db.refresh(flight)
    return flight


async def get_manifest(db: AsyncSession, *, flight_id: uuid.UUID) -> list[dict]:
    flight = await get_flight_by_id(db, flight_id)
    if not flight:
        raise FlightNotFoundError("Flight not found")

    q = (
        select(Account.id, Account.full_name, Account.email, Seat.seat_code)
        .join(Booking, Booking.account_id == Account.id)
        .join(Seat, Seat.id == Booking.seat_id)
        .where(and_(Booking.flight_id == flight_id, Booking.status_id == 2))
        .order_by(Seat.row_number.asc(), Seat.seat_letter.asc())
    )

    rows = (await db.execute(q)).all()
    return [
        {
            "account_id": r[0],
            "full_name": r[1],
            "email": r[2],
            "seat_code": r[3],
        }
        for r in rows
    ]
