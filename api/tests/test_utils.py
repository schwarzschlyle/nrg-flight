from __future__ import annotations

import pytest

from app.utils import format_slot_label, generate_seat_codes, get_slot_flight_number, get_slot_gate


def test_generate_seat_codes_happy_path():
    seats = generate_seat_codes(2, 3)
    assert seats == [
        ("1A", 1, "A"),
        ("1B", 1, "B"),
        ("1C", 1, "C"),
        ("2A", 2, "A"),
        ("2B", 2, "B"),
        ("2C", 2, "C"),
    ]


@pytest.mark.parametrize(
    "rows,seats_per_row",
    [
        (0, 1),
        (-1, 1),
        (1, 0),
        (1, -1),
        (1, 27),
    ],
)
def test_generate_seat_codes_validation(rows, seats_per_row):
    with pytest.raises(ValueError):
        generate_seat_codes(rows, seats_per_row)


def test_format_slot_label_happy_path():
    assert format_slot_label(0) == "00:00"
    assert format_slot_label(23) == "23:00"


@pytest.mark.parametrize("slot_id", [-1, 24])
def test_format_slot_label_validation(slot_id):
    with pytest.raises(ValueError):
        format_slot_label(slot_id)


def test_seed_mapping_matches_plan_docs():
    assert get_slot_flight_number(0) == "AX-0001"
    assert get_slot_flight_number(23) == "AX-0024"
    assert get_slot_gate(0) == "A1"
    assert get_slot_gate(3) == "A4"
    assert get_slot_gate(4) == "B1"
    assert get_slot_gate(23) == "F4"
