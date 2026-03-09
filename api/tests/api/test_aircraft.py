from __future__ import annotations


def _register_and_login(client, *, email: str, full_name: str = "User"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": full_name},
    )
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return r.json()["access_token"]


def test_list_aircraft_requires_auth(client):
    r = client.get("/api/v1/aircraft")
    assert r.status_code == 401


def test_list_aircraft_returns_created_aircraft(client):
    admin_token = _register_and_login(client, email="admin@example.com", full_name="Admin")

    r = client.post(
        "/api/v1/admin/aircraft",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"model": "Test Plane", "total_rows": 1, "seats_per_row": 1},
    )
    assert r.status_code == 201

    user_token = _register_and_login(client, email="user@example.com")
    r = client.get("/api/v1/aircraft", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200
    assert any(a["model"] == "Test Plane" for a in r.json())
