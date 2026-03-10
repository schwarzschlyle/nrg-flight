from __future__ import annotations

from datetime import date


def parse_iso_date(value: str) -> date:
    return date.fromisoformat(value)
