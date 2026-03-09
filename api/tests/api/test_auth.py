from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app import crud


def test_register_login_me_refresh_logout(client):
    # Register
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "user@example.com", "password": "password123", "full_name": "User"},
    )
    assert r.status_code == 201
    assert r.json()["email"] == "user@example.com"

    # Login sets refresh cookie
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0
    assert "set-cookie" in r.headers

    access = data["access_token"]
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 200
    assert r.json()["email"] == "user@example.com"

    # Refresh uses cookie
    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert "set-cookie" in r.headers

    # Logout clears cookie
    r = client.post("/api/v1/auth/logout")
    assert r.status_code == 200
    assert r.json()["message"] == "Logged out"


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    payload = r.json()
    assert payload["status"] in {"ok", "error"}
    assert "system" in payload
    assert "process" in payload
    assert "checks" in payload
    assert "database" in payload["checks"]


def test_register_duplicate_email(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "dup@example.com", "password": "password123", "full_name": "Dup"},
    )
    assert r.status_code == 201

    r = client.post(
        "/api/v1/auth/register",
        json={"email": "dup@example.com", "password": "password123", "full_name": "Dup"},
    )
    assert r.status_code == 409
    assert r.json()["message"]


def test_register_validation_error(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "bad@example.com", "password": "short", "full_name": "Bad"},
    )
    assert r.status_code == 422
    assert r.json()["message"] == "Validation error"


def test_refresh_missing_cookie(client):
    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 401
    assert r.json()["message"] == "Missing refresh token"


def test_refresh_invalid_refresh_token(client):
    client.cookies.set(settings.REFRESH_TOKEN_COOKIE_NAME, "invalid")
    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid refresh token"


def test_refresh_invalid_token_type(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "password": "password123", "full_name": "User2"},
    )
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "user2@example.com", "password": "password123"},
    )
    access = r.json()["access_token"]

    # Put an access token in the refresh cookie
    client.cookies.set(settings.REFRESH_TOKEN_COOKIE_NAME, access)
    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid token type"


def test_refresh_missing_subject(client):
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "type": "refresh",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=5)).timestamp()),
            "jti": "test-jti",
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    client.cookies.set(settings.REFRESH_TOKEN_COOKIE_NAME, token)
    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid token"


def test_refresh_invalid_signature(client):
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "type": "refresh",
            "sub": str(uuid.uuid4()),
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=5)).timestamp()),
            "jti": "test-jti",
        },
        "wrong-secret",
        algorithm=settings.ALGORITHM,
    )
    client.cookies.set(settings.REFRESH_TOKEN_COOKIE_NAME, token)
    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid refresh token"


def test_refresh_invalid_subject_uuid(client):
    token = create_refresh_token(subject="not-a-uuid", is_admin=False)
    client.cookies.set(settings.REFRESH_TOKEN_COOKIE_NAME, token)
    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid token"


def test_refresh_account_not_found(client):
    token = create_refresh_token(subject=str(uuid.uuid4()), is_admin=False)
    client.cookies.set(settings.REFRESH_TOKEN_COOKIE_NAME, token)
    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 401
    assert r.json()["message"] == "Account not found"


def test_refresh_inactive_account(client, session_maker, event_loop):
    client.post(
        "/api/v1/auth/register",
        json={"email": "inactive-refresh@example.com", "password": "password123", "full_name": "Inactive"},
    )
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive-refresh@example.com", "password": "password123"},
    )
    assert r.status_code == 200

    async def _deactivate() -> None:
        async with session_maker() as session:
            account = await crud.get_account_by_email(session, "inactive-refresh@example.com")
            assert account is not None
            account.is_active = False
            await session.commit()

    event_loop.run_until_complete(_deactivate())

    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 403
    assert r.json()["message"] == "Account is inactive"


def test_login_inactive_account(client, session_maker, event_loop):
    client.post(
        "/api/v1/auth/register",
        json={"email": "inactive@example.com", "password": "password123", "full_name": "Inactive"},
    )

    async def _deactivate() -> None:
        async with session_maker() as session:
            account = await crud.get_account_by_email(session, "inactive@example.com")
            assert account is not None
            account.is_active = False
            await session.commit()

    event_loop.run_until_complete(_deactivate())

    r = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@example.com", "password": "password123"},
    )
    assert r.status_code == 403
    assert r.json()["message"] == "Account is inactive"


def test_login_invalid_credentials(client):
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "password123"},
    )
    assert r.status_code == 401
    assert r.json()["message"]


def test_login_wrong_password(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpw@example.com", "password": "password123", "full_name": "WrongPW"},
    )
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpw@example.com", "password": "password124"},
    )
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid credentials"


def test_me_invalid_token(client):
    r = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid"})
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid token"


def test_me_invalid_signature(client):
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "type": "access",
            "sub": str(uuid.uuid4()),
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=5)).timestamp()),
            "jti": "test-jti",
            "adm": False,
        },
        "wrong-secret",
        algorithm=settings.ALGORITHM,
    )
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid token"


def test_me_wrong_token_type(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "me@example.com", "password": "password123", "full_name": "Me"},
    )
    account_id = r.json()["id"]
    refresh_token = create_refresh_token(subject=account_id, is_admin=False)
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {refresh_token}"})
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid token type"


def test_me_missing_subject(client):
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "type": "access",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=5)).timestamp()),
            "jti": "test-jti",
            "adm": False,
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid token"


def test_me_invalid_subject_uuid(client):
    token, _ = create_access_token(subject="not-a-uuid", is_admin=False)
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid token"


def test_me_account_not_found(client):
    token, _ = create_access_token(subject=str(uuid.uuid4()), is_admin=False)
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
    assert r.json()["message"] == "Account not found"


def test_me_inactive_account(client, session_maker, event_loop):
    client.post(
        "/api/v1/auth/register",
        json={"email": "inactive2@example.com", "password": "password123", "full_name": "Inactive"},
    )
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive2@example.com", "password": "password123"},
    )
    token = r.json()["access_token"]

    async def _deactivate() -> None:
        async with session_maker() as session:
            account = await crud.get_account_by_email(session, "inactive2@example.com")
            assert account is not None
            account.is_active = False
            await session.commit()

    event_loop.run_until_complete(_deactivate())

    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403
    assert r.json()["message"] == "Account is inactive"
