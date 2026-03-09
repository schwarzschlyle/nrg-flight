"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-03-07

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "account",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False, unique=True),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("has_verified_email", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_account_email", "account", ["email"], unique=False)

    op.create_table(
        "aircraft",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("model", sa.String(length=80), nullable=False),
        sa.Column("total_rows", sa.SmallInteger(), nullable=False),
        sa.Column("seats_per_row", sa.SmallInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("total_rows > 0", name="chk_aircraft_total_rows"),
        sa.CheckConstraint("seats_per_row > 0", name="chk_aircraft_seats_per_row"),
    )

    op.create_table(
        "time_slot",
        sa.Column("id", sa.SmallInteger(), primary_key=True, nullable=False),
        sa.Column("label", sa.String(length=8), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("id BETWEEN 0 AND 23", name="chk_time_slot_id"),
    )

    op.create_table(
        "booking_status",
        sa.Column("id", sa.SmallInteger(), primary_key=True, nullable=False),
        sa.Column("label", sa.String(length=20), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "flight",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("time_slot_id", sa.SmallInteger(), sa.ForeignKey("time_slot.id"), nullable=False),
        sa.Column("aircraft_id", sa.Uuid(), sa.ForeignKey("aircraft.id"), nullable=False),
        sa.Column("flight_number", sa.String(length=10), nullable=False),
        sa.Column("gate", sa.String(length=6), nullable=False),
        sa.Column("departure_date", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("flight_number", "departure_date", name="uq_flight_number_date"),
        sa.UniqueConstraint("time_slot_id", "departure_date", name="uq_flight_slot_date"),
    )
    op.create_index("idx_flight_departure_date", "flight", ["departure_date"], unique=False)
    op.create_index("idx_flight_time_slot", "flight", ["time_slot_id"], unique=False)
    op.create_index("idx_flight_aircraft", "flight", ["aircraft_id"], unique=False)

    op.create_table(
        "seat",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("flight_id", sa.Uuid(), sa.ForeignKey("flight.id"), nullable=False),
        sa.Column("seat_code", sa.String(length=4), nullable=False),
        sa.Column("row_number", sa.SmallInteger(), nullable=False),
        sa.Column("seat_letter", sa.String(length=1), nullable=False),
        sa.Column("is_booked", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("flight_id", "seat_code", name="uq_seat_per_flight"),
        sa.CheckConstraint("row_number > 0", name="chk_seat_row_number"),
    )
    op.create_index("idx_seat_flight_id", "seat", ["flight_id"], unique=False)
    op.create_index("idx_seat_flight_booked", "seat", ["flight_id", "is_booked"], unique=False)
    op.create_index(
        "idx_seat_available",
        "seat",
        ["flight_id"],
        unique=False,
        postgresql_where=sa.text("is_booked = false"),
    )

    op.create_table(
        "booking",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), sa.ForeignKey("account.id"), nullable=False),
        sa.Column("seat_id", sa.Uuid(), sa.ForeignKey("seat.id"), nullable=False),
        sa.Column("flight_id", sa.Uuid(), sa.ForeignKey("flight.id"), nullable=False),
        sa.Column("status_id", sa.SmallInteger(), sa.ForeignKey("booking_status.id"), nullable=False, server_default=sa.text("2")),
        sa.Column("booked_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_booking_account", "booking", ["account_id"], unique=False)
    op.create_index("idx_booking_flight", "booking", ["flight_id"], unique=False)
    op.create_index("idx_booking_seat", "booking", ["seat_id"], unique=False)

    # Seed booking_status
    booking_status = sa.table(
        "booking_status",
        sa.column("id", sa.SmallInteger),
        sa.column("label", sa.String),
    )
    op.bulk_insert(
        booking_status,
        [
            {"id": 1, "label": "pending"},
            {"id": 2, "label": "confirmed"},
            {"id": 3, "label": "cancelled"},
        ],
    )

    # Seed 24 hourly time slots
    time_slot = sa.table(
        "time_slot",
        sa.column("id", sa.SmallInteger),
        sa.column("label", sa.String),
    )
    op.bulk_insert(
        time_slot,
        [{"id": i, "label": f"{i:02d}:00"} for i in range(24)],
    )


def downgrade() -> None:
    op.drop_index("idx_booking_seat", table_name="booking")
    op.drop_index("idx_booking_flight", table_name="booking")
    op.drop_index("idx_booking_account", table_name="booking")
    op.drop_table("booking")

    op.drop_index("idx_seat_available", table_name="seat")
    op.drop_index("idx_seat_flight_booked", table_name="seat")
    op.drop_index("idx_seat_flight_id", table_name="seat")
    op.drop_table("seat")

    op.drop_index("idx_flight_aircraft", table_name="flight")
    op.drop_index("idx_flight_time_slot", table_name="flight")
    op.drop_index("idx_flight_departure_date", table_name="flight")
    op.drop_table("flight")

    op.drop_table("booking_status")
    op.drop_table("time_slot")
    op.drop_table("aircraft")

    op.drop_index("idx_account_email", table_name="account")
    op.drop_table("account")
