from __future__ import annotations

from fastapi import APIRouter

from ai_service.api.routes.chat import router as chat_router


api_router = APIRouter()
api_router.include_router(chat_router)
