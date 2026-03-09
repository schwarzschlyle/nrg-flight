from __future__ import annotations

import string


def generate_seat_codes(total_rows: int, seats_per_row: int) -> list[tuple[str, int, str]]:
    """Generate seat codes like "1A", "1B", … and return tuples:
    (seat_code, row_number, seat_letter).
    """

    if total_rows <= 0:
        raise ValueError("total_rows must be > 0")
    if seats_per_row <= 0:
        raise ValueError("seats_per_row must be > 0")
    if seats_per_row > 26:
        raise ValueError("seats_per_row must be <= 26")

    letters = list(string.ascii_uppercase[:seats_per_row])
    out: list[tuple[str, int, str]] = []
    for row in range(1, total_rows + 1):
        for letter in letters:
            out.append((f"{row}{letter}", row, letter))
    return out


def format_slot_label(slot_id: int) -> str:
    if slot_id < 0 or slot_id > 23:
        raise ValueError("slot_id must be between 0 and 23")
    return f"{slot_id:02d}:00"


def get_slot_flight_number(slot_id: int) -> str:
    # Matches fastapi_plan_docs/seed_values.txt
    return f"AX-{slot_id + 1:04d}"


def get_slot_gate(slot_id: int) -> str:
    # Matches fastapi_plan_docs/seed_values.txt
    terminals = ["A", "B", "C", "D", "E", "F"]
    gates_per_terminal = 4
    terminal = terminals[slot_id // gates_per_terminal]
    gate_number = (slot_id % gates_per_terminal) + 1
    return f"{terminal}{gate_number}"
