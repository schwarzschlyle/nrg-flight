from __future__ import annotations

from datetime import date


def _register_and_login(client, *, email: str, full_name: str = "User"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": full_name},
    )
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return r.json()["access_token"]


def _create_aircraft_and_flight(client, admin_token: str):
    r = client.post(
        "/api/v1/admin/aircraft",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"model": "Boeing 737-800", "total_rows": 2, "seats_per_row": 2},
    )
    aircraft_id = r.json()["id"]
    r = client.post(
        "/api/v1/admin/flights",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"time_slot_id": 1, "aircraft_id": aircraft_id, "departure_date": str(date.today())},
    )
    return r.json()["flight_id"]


def test_slots_flight_seats_booking_cancel_flow(client):
    admin_token = _register_and_login(client, email="admin@example.com", full_name="Admin")
    flight_id = _create_aircraft_and_flight(client, admin_token)

    user_token = _register_and_login(client, email="user@example.com")

    # Slots
    r = client.get(
        f"/api/v1/slots?date={date.today()}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    assert len(r.json()) == 24

    # Resolve flight by slot
    r = client.get(
        f"/api/v1/slots/1/flight?date={date.today()}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    assert r.json()["flight_id"] == flight_id

    # Seat map
    r = client.get(
        f"/api/v1/flights/{flight_id}/seats",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    seats = r.json()["seats"]
    assert len(seats) == 4
    assert seats[0]["is_booked"] is False

    # Specific seat lookup (Requirement 03)
    seat_code = seats[0]["seat_code"]
    r = client.get(
        f"/api/v1/flights/{flight_id}/seats/{seat_code}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    assert r.json()["seat_code"] == seat_code

    # First available
    r = client.get(
        f"/api/v1/flights/{flight_id}/seats/first-available",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    seat_id = r.json()["seat_id"]

    # Book it
    r = client.post(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"flight_id": flight_id, "seat_id": seat_id},
    )
    assert r.status_code == 201
    booking_id = r.json()["booking_id"]

    # Double-booking fails
    r = client.post(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"flight_id": flight_id, "seat_id": seat_id},
    )
    assert r.status_code == 409

    # List bookings
    r = client.get(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    assert r.json()["total"] == 1

    # Get booking
    r = client.get(
        f"/api/v1/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200

    # Cancel (seat becomes available again)
    r = client.delete(
        f"/api/v1/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    assert r.json()["message"] == "Booking cancelled"

    # Seat is now available
    r = client.get(
        f"/api/v1/flights/{flight_id}/seats",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert r.status_code == 200
    seats = r.json()["seats"]
    assert any(s["seat_id"] == seat_id and s["is_booked"] is False for s in seats)
