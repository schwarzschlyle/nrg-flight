from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, SmallInteger, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.db import Base, GUID


class Account(Base):
    __tablename__ = "account"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    has_verified_email: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    bookings: Mapped[list[Booking]] = relationship(back_populates="account")  # type: ignore[name-defined]


class Aircraft(Base):
    __tablename__ = "aircraft"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    model: Mapped[str] = mapped_column(String(80), nullable=False)
    total_rows: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    seats_per_row: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    flights: Mapped[list[Flight]] = relationship(back_populates="aircraft")  # type: ignore[name-defined]

    __table_args__ = (
        CheckConstraint("total_rows > 0", name="chk_aircraft_total_rows"),
        CheckConstraint("seats_per_row > 0", name="chk_aircraft_seats_per_row"),
    )


class TimeSlot(Base):
    __tablename__ = "time_slot"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    label: Mapped[str] = mapped_column(String(8), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    flights: Mapped[list[Flight]] = relationship(back_populates="time_slot")  # type: ignore[name-defined]

    __table_args__ = (CheckConstraint("id BETWEEN 0 AND 23", name="chk_time_slot_id"),)


class Flight(Base):
    __tablename__ = "flight"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    time_slot_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("time_slot.id"), nullable=False)
    aircraft_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("aircraft.id"), nullable=False)
    flight_number: Mapped[str] = mapped_column(String(10), nullable=False)
    gate: Mapped[str] = mapped_column(String(6), nullable=False)
    departure_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    time_slot: Mapped[TimeSlot] = relationship(back_populates="flights")
    aircraft: Mapped[Aircraft] = relationship(back_populates="flights")
    seats: Mapped[list[Seat]] = relationship(back_populates="flight")  # type: ignore[name-defined]
    bookings: Mapped[list[Booking]] = relationship(back_populates="flight")  # type: ignore[name-defined]

    __table_args__ = (
        UniqueConstraint("flight_number", "departure_date", name="uq_flight_number_date"),
        UniqueConstraint("time_slot_id", "departure_date", name="uq_flight_slot_date"),
        Index("idx_flight_departure_date", "departure_date"),
        Index("idx_flight_time_slot", "time_slot_id"),
        Index("idx_flight_aircraft", "aircraft_id"),
    )


class Seat(Base):
    __tablename__ = "seat"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    flight_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("flight.id"), nullable=False)
    seat_code: Mapped[str] = mapped_column(String(4), nullable=False)
    row_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    seat_letter: Mapped[str] = mapped_column(String(1), nullable=False)
    is_booked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    flight: Mapped[Flight] = relationship(back_populates="seats")
    bookings: Mapped[list[Booking]] = relationship(back_populates="seat")  # type: ignore[name-defined]

    __table_args__ = (
        UniqueConstraint("flight_id", "seat_code", name="uq_seat_per_flight"),
        CheckConstraint("row_number > 0", name="chk_seat_row_number"),
        Index("idx_seat_flight_id", "flight_id"),
        Index("idx_seat_flight_booked", "flight_id", "is_booked"),
    )


class BookingStatus(Base):
    __tablename__ = "booking_status"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    label: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    bookings: Mapped[list[Booking]] = relationship(back_populates="status")  # type: ignore[name-defined]


class Booking(Base):
    __tablename__ = "booking"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("account.id"), nullable=False)
    seat_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("seat.id"), nullable=False)
    flight_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("flight.id"), nullable=False)
    status_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("booking_status.id"), nullable=False, default=2)
    booked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    account: Mapped[Account] = relationship(back_populates="bookings")
    flight: Mapped[Flight] = relationship(back_populates="bookings")
    seat: Mapped[Seat] = relationship(back_populates="bookings")
    status: Mapped[BookingStatus] = relationship(back_populates="bookings")

    __table_args__ = (
        Index("idx_booking_account", "account_id"),
        Index("idx_booking_flight", "flight_id"),
        Index("idx_booking_seat", "seat_id"),
    )
