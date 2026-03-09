from __future__ import annotations

from datetime import date


def _register_and_login(client, *, email: str):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": "Admin"},
    )
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return r.json()["access_token"]


def test_admin_aircraft_and_flight_and_manifest(client):
    token = _register_and_login(client, email="admin@example.com")

    # Create aircraft
    r = client.post(
        "/api/v1/admin/aircraft",
        headers={"Authorization": f"Bearer {token}"},
        json={"model": "Boeing 737-800", "total_rows": 2, "seats_per_row": 2},
    )
    assert r.status_code == 201
    aircraft_id = r.json()["id"]

    # Create flight
    r = client.post(
        "/api/v1/admin/flights",
        headers={"Authorization": f"Bearer {token}"},
        json={"time_slot_id": 0, "aircraft_id": aircraft_id, "departure_date": str(date.today())},
    )
    assert r.status_code == 201
    flight_id = r.json()["flight_id"]
    assert r.json()["total_seats"] == 4

    # Manifest is empty
    r = client.get(
        f"/api/v1/admin/flights/{flight_id}/manifest",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json() == []


def test_admin_manifest_with_passenger(client):
    admin_token = _register_and_login(client, email="admin@example.com")

    r = client.post(
        "/api/v1/admin/aircraft",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"model": "Test Plane", "total_rows": 1, "seats_per_row": 1},
    )
    assert r.status_code == 201
    aircraft_id = r.json()["id"]

    r = client.post(
        "/api/v1/admin/flights",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"time_slot_id": 5, "aircraft_id": aircraft_id, "departure_date": str(date.today())},
    )
    assert r.status_code == 201
    flight_id = r.json()["flight_id"]

    # Passenger books a seat
    client.post(
        "/api/v1/auth/register",
        json={"email": "passenger@example.com", "password": "password123", "full_name": "Passenger"},
    )
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "passenger@example.com", "password": "password123"},
    )
    passenger_token = r.json()["access_token"]

    r = client.get(
        f"/api/v1/flights/{flight_id}/seats/first-available",
        headers={"Authorization": f"Bearer {passenger_token}"},
    )
    seat_id = r.json()["seat_id"]

    r = client.post(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {passenger_token}"},
        json={"flight_id": flight_id, "seat_id": seat_id},
    )
    assert r.status_code == 201

    # Manifest now has one passenger
    r = client.get(
        f"/api/v1/admin/flights/{flight_id}/manifest",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["email"] == "passenger@example.com"
    assert items[0]["seat_code"] == "1A"
