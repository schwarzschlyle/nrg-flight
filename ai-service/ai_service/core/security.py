from __future__ import annotations

import uuid
from typing import Any

from jose import JWTError, jwt

from ai_service.core.config import settings


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def try_get_account_id_from_bearer(authorization: str | None) -> uuid.UUID | None:
    if not authorization:
        return None
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    raw = parts[1].strip()
    try:
        payload = decode_token(raw)
    except JWTError:
        return None

    if payload.get("type") != "access":
        return None

    subject = payload.get("sub")
    if not subject:
        return None
    try:
        return uuid.UUID(str(subject))
    except ValueError:
        return None
