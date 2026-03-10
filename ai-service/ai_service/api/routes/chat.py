from __future__ import annotations

from typing import Literal
import json
import uuid

from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

from ai_service.core.security import try_get_account_id_from_bearer
from ai_service.graph.app import graph


router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class PendingBooking(BaseModel):
    departure_date: str | None = None
    slot_id: int | None = None
    seat_code: str | None = None
    aircraft_id: str | None = None
    aircraft_model: str | None = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)
    pending_booking: PendingBooking | None = None


def _to_langchain_messages(history: list[ChatMessage], new_user_message: str) -> list[BaseMessage]:
    out: list[BaseMessage] = []
    for m in history:
        if m.role == "user":
            out.append(HumanMessage(content=m.content))
        elif m.role == "assistant":
            out.append(AIMessage(content=m.content))
        else:
            out.append(SystemMessage(content=m.content))
    out.append(HumanMessage(content=new_user_message))
    return out


def _sse(event: str, data: object) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("")
async def chat(payload: ChatRequest, authorization: str | None = Header(default=None)):
    account_id = try_get_account_id_from_bearer(authorization)
    request_id = str(uuid.uuid4())

    async def stream():
        state = await graph.ainvoke(
            {
                "messages": _to_langchain_messages(payload.history, payload.message),
                "pending_booking": payload.pending_booking.model_dump() if payload.pending_booking else None,
                "account_id": str(account_id) if account_id else None,
            },
        )

        last = state["messages"][-1]
        text = getattr(last, "content", "") or ""

        yield _sse("meta", {"request_id": request_id})

        chunk_size = 24
        for i in range(0, len(text), chunk_size):
            yield _sse("delta", {"text": text[i : i + chunk_size]})

        yield _sse("state", {"pending_booking": state.get("pending_booking")})

    return StreamingResponse(stream(), media_type="text/event-stream")
