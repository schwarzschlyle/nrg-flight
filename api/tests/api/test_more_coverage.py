from __future__ import annotations

import uuid
from datetime import date


def _register_and_login(client, *, email: str, full_name: str = "User") -> str:
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": full_name},
    )
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    assert r.status_code == 200
    return r.json()["access_token"]


def _create_aircraft(client, admin_token: str, *, rows: int, seats_per_row: int) -> str:
    r = client.post(
        "/api/v1/admin/aircraft",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"model": "Test Plane", "total_rows": rows, "seats_per_row": seats_per_row},
    )
    assert r.status_code == 201
    return r.json()["id"]


def _create_flight(client, admin_token: str, *, slot_id: int, aircraft_id: str, departure: date) -> str:
    r = client.post(
        "/api/v1/admin/flights",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"time_slot_id": slot_id, "aircraft_id": aircraft_id, "departure_date": str(departure)},
    )
    assert r.status_code == 201
    return r.json()["flight_id"]


def test_error_handlers_admin_denial_filters_and_inactive_behavior(client):
    admin_token = _register_and_login(client, email="admin@example.com", full_name="Admin")
    user_token = _register_and_login(client, email="user@example.com")

    # Non-admin cannot access admin routes
    r = client.post(
        "/api/v1/admin/aircraft",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"model": "X", "total_rows": 1, "seats_per_row": 1},
    )
    assert r.status_code == 403
    assert r.json()["message"] == "Admin access required"

    today = date.today()

    # Slot not found
    r = client.get(
        f"/api/v1/slots/99/flight?date={today}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Slot not found"

    # Flight not found (slot exists but no flight created)
    r = client.get(
        f"/api/v1/slots/2/flight?date={today}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Flight not found"

    # Admin create flight errors
    aircraft_id = _create_aircraft(client, admin_token, rows=2, seats_per_row=2)

    r = client.post(
        "/api/v1/admin/flights",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"time_slot_id": 99, "aircraft_id": aircraft_id, "departure_date": str(today)},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Slot not found"

    r = client.post(
        "/api/v1/admin/flights",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"time_slot_id": 0, "aircraft_id": str(uuid.uuid4()), "departure_date": str(today)},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Aircraft not found"

    flight_id = _create_flight(client, admin_token, slot_id=0, aircraft_id=aircraft_id, departure=today)

    # Flight already exists
    r = client.post(
        "/api/v1/admin/flights",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"time_slot_id": 0, "aircraft_id": aircraft_id, "departure_date": str(today)},
    )
    assert r.status_code == 409
    assert r.json()["message"] == "Flight already exists"

    # Update flight not found
    r = client.patch(
        f"/api/v1/admin/flights/{uuid.uuid4()}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"gate": "C3"},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Flight not found"

    # Public flight list + detail
    r = client.get(f"/api/v1/flights?date={today}", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200
    assert len(r.json()) == 1

    r = client.get(f"/api/v1/flights/{flight_id}", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200
    assert r.json()["flight_id"] == flight_id

    # Flight not found for seat map
    r = client.get(
        f"/api/v1/flights/{uuid.uuid4()}/seats",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Flight not found"

    # Seat not found by code
    r = client.get(
        f"/api/v1/flights/{flight_id}/seats/99Z",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Seat not found"

    # Booking failures
    r = client.post(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"flight_id": str(uuid.uuid4()), "seat_id": str(uuid.uuid4())},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Flight not found"

    r = client.post(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"flight_id": flight_id, "seat_id": str(uuid.uuid4())},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Seat not found"

    # Book a seat successfully, then test filters + ownership
    r = client.get(
        f"/api/v1/flights/{flight_id}/seats/first-available",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    seat_id = r.json()["seat_id"]

    r = client.post(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"flight_id": flight_id, "seat_id": seat_id},
    )
    booking_id = r.json()["booking_id"]

    # Booking not found
    r = client.get(
        f"/api/v1/bookings/{uuid.uuid4()}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Booking not found"

    # Booking ownership
    other_token = _register_and_login(client, email="other@example.com")
    r = client.get(
        f"/api/v1/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert r.status_code == 403
    assert r.json()["message"] == "Booking does not belong to account"

    # Cancel booking not found
    r = client.delete(
        f"/api/v1/bookings/{uuid.uuid4()}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Booking not found"

    # Cancel booking ownership
    r = client.delete(
        f"/api/v1/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert r.status_code == 403
    assert r.json()["message"] == "Booking does not belong to account"

    # Filters
    r = client.get(
        f"/api/v1/bookings?status=confirmed",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    assert r.json()["total"] == 1

    r = client.get(
        f"/api/v1/bookings?date={today}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    assert r.json()["total"] == 1

    # Cancel + filter cancelled
    r = client.delete(
        f"/api/v1/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200

    r = client.get(
        f"/api/v1/bookings?status=cancelled",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    assert r.json()["total"] == 1

    # Deactivate flight and verify it disappears from public flight detail & slots output
    r = client.patch(
        f"/api/v1/admin/flights/{flight_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"gate": "C3", "is_active": False},
    )
    assert r.status_code == 200
    assert r.json()["gate"] == "C3"
    assert r.json()["is_active"] is False

    r = client.get(
        f"/api/v1/flights/{flight_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Flight not found"

    r = client.get(
        f"/api/v1/slots?date={today}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    slot0 = r.json()[0]
    assert slot0["flight_id"] is None
    assert slot0["available_seats"] == 0

    # Manifest not found
    r = client.get(
        f"/api/v1/admin/flights/{uuid.uuid4()}/manifest",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 404
    assert r.json()["message"] == "Flight not found"


def test_no_available_seats_handler(client):
    admin_token = _register_and_login(client, email="admin@example.com", full_name="Admin")
    user_token = _register_and_login(client, email="user@example.com")

    aircraft_id = _create_aircraft(client, admin_token, rows=1, seats_per_row=1)
    flight_id = _create_flight(client, admin_token, slot_id=3, aircraft_id=aircraft_id, departure=date.today())

    # Book the only seat
    r = client.get(
        f"/api/v1/flights/{flight_id}/seats/first-available",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    seat_id = r.json()["seat_id"]

    r = client.post(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"flight_id": flight_id, "seat_id": seat_id},
    )
    assert r.status_code == 201

    # Now first-available should fail
    r = client.get(
        f"/api/v1/flights/{flight_id}/seats/first-available",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 409
    assert r.json()["message"] == "No available seats"
