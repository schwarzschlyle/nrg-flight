from __future__ import annotations

import base64
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

_BCRYPT_MAX_PASSWORD_BYTES = 72
_BCRYPT_DEFAULT_ROUNDS = 12


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_password_for_bcrypt(password: str) -> bytes:
    """Return a bcrypt-compatible byte string.

    The upstream `bcrypt` library enforces a 72-byte limit (to avoid silent
    truncation). To support longer passwords safely, we pre-hash with SHA-256
    (base64-encoded to avoid embedded NUL bytes in the digest).
    """

    pw = password.encode("utf-8")
    if len(pw) <= _BCRYPT_MAX_PASSWORD_BYTES:
        return pw

    digest = hashlib.sha256(pw).digest()
    return base64.b64encode(digest)


def hash_password(plain_password: str) -> str:
    pw = _normalize_password_for_bcrypt(plain_password)
    salt = bcrypt.gensalt(rounds=_BCRYPT_DEFAULT_ROUNDS)
    return bcrypt.hashpw(pw, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw = _normalize_password_for_bcrypt(plain_password)
        return bcrypt.checkpw(pw, hashed_password.encode("utf-8"))
    except ValueError:
        # Raised for invalid hash formats, etc.
        return False


def _create_token(*, subject: str, token_type: str, expires_delta: timedelta, claims: dict[str, Any]) -> str:
    now = utcnow()
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
        "jti": str(uuid.uuid4()),
    }
    payload.update(claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(*, subject: str, is_admin: bool) -> tuple[str, int]:
    expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = _create_token(subject=subject, token_type="access", expires_delta=expires, claims={"adm": is_admin})
    return token, int(expires.total_seconds())


def create_refresh_token(*, subject: str, is_admin: bool) -> str:
    expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(subject=subject, token_type="refresh", expires_delta=expires, claims={"adm": is_admin})


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        # We typically translate this to HTTP 401 in the dependency layer.
        raise exc
