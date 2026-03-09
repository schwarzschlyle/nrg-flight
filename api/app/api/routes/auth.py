from __future__ import annotations

import uuid

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_current_active_account, get_db
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.exceptions.base import AccountInactiveError
from app.schemas.auth import AccountResponse, LoginRequest, RegisterRequest, TokenResponse
from app.schemas.common import MessageResponse


router = APIRouter(prefix="/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        max_age=max_age,
        path="/",
        **settings.cookie_params(),
    )


def _clear_refresh_cookie(response: Response) -> None:
    params = settings.cookie_params()
    response.delete_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        path="/",
        secure=params["secure"],
        samesite=params["samesite"],
        httponly=params["httponly"],
    )


@router.post("/register", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> AccountResponse:
    account = await crud.create_account(db, email=str(payload.email), password=payload.password, full_name=payload.full_name)
    return AccountResponse.model_validate(account)


@router.post("/login", response_model=TokenResponse)
async def login(response: Response, payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    account = await crud.authenticate_account(db, email=str(payload.email), password=payload.password)
    if not account.is_active or account.deleted_at is not None:
        raise AccountInactiveError("Account is inactive")

    is_admin = account.email.lower() in settings.admin_emails
    access_token, expires_in = create_access_token(subject=str(account.id), is_admin=is_admin)
    refresh_token = create_refresh_token(subject=str(account.id), is_admin=is_admin)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access_token, expires_in=expires_in)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=settings.REFRESH_TOKEN_COOKIE_NAME),
) -> TokenResponse:
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        account_id = uuid.UUID(subject)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    account = await crud.get_account_by_id(db, account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not found")
    if not account.is_active or account.deleted_at is not None:
        raise AccountInactiveError("Account is inactive")

    is_admin = account.email.lower() in settings.admin_emails
    access_token, expires_in = create_access_token(subject=str(account.id), is_admin=is_admin)

    # Rotate refresh token
    new_refresh_token = create_refresh_token(subject=str(account.id), is_admin=is_admin)
    _set_refresh_cookie(response, new_refresh_token)

    return TokenResponse(access_token=access_token, expires_in=expires_in)


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response) -> MessageResponse:
    _clear_refresh_cookie(response)
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=AccountResponse)
async def me(account=Depends(get_current_active_account)) -> AccountResponse:
    return AccountResponse.model_validate(account)
