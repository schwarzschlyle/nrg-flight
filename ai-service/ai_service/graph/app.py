from __future__ import annotations

from datetime import datetime

from langchain_core.messages import AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from ai_service.core.config import settings
from ai_service.graph.state import GraphState
from ai_service.tools.book_seat import book_seat
from ai_service.tools.query_available_flights_for_date import query_available_flights_for_date
from ai_service.tools.query_available_time_slots_for_date import query_available_time_slots_for_date
from ai_service.tools.query_passenger_count_for_flight import query_passenger_count_for_flight
from ai_service.tools.query_window_seats_available import query_window_seats_available


SYSTEM_PROMPT = """You are NRG Flight's booking assistant.

You have tools to query the real booking database and (with confirmation) book seats.

Rules:
- Prefer asking clarifying questions if the user request is missing a required detail (date, slot/time, flight, seat).
- Before any database write (booking a seat), you must confirm with the user.
- If `pending_booking` exists in state and the user confirms (e.g., 'confirm', 'yes, book it'), call `book_seat` with confirm=true.
- For queries, call the appropriate query tools.
- If the user is not logged in, you may still answer read-only questions, but you must not attempt to book.
"""


tools = [
    query_available_flights_for_date,
    query_available_time_slots_for_date,
    query_passenger_count_for_flight,
    query_window_seats_available,
    book_seat,
]


llm_with_tools = None
if settings.openai_enabled:
    llm = ChatOpenAI(
        openai_api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_MODEL,
        temperature=0.2,
    )
    llm_with_tools = llm.bind_tools(tools)


async def chatbot_node(state: GraphState) -> GraphState:
    if llm_with_tools is None:
        return {
            "messages": [
                AIMessage(
                    content=(
                        "AI chat is currently disabled because OPENAI_API_KEY is not set. "
                        "Set OPENAI_API_KEY in ai-service/.env and restart the container."
                    )
                )
            ]
        }

    messages = state.get("messages", [])

    # Provide the model with a reliable "today" context to interpret relative dates.
    now_local = datetime.now().astimezone()
    today_context = (
        "Today's date is "
        f"{now_local.strftime('%Y-%m-%d')} "
        f"({now_local.strftime('%A')}) "
        f"in timezone {now_local.tzname() or 'local'} (ISO: {now_local.isoformat(timespec='seconds')})."
    )

    sys = [SystemMessage(content=SYSTEM_PROMPT), SystemMessage(content=today_context)]
    pending = state.get("pending_booking")
    if pending:
        sys.append(
            SystemMessage(
                content=(
                    "A booking request is currently pending confirmation. "
                    f"pending_booking={pending}. "
                    "If the user confirms, call book_seat(confirm=true) without re-asking for details."
                )
            )
        )
    if not state.get("account_id"):
        sys.append(SystemMessage(content="User is not authenticated (account_id is missing)."))

    response = await llm_with_tools.ainvoke([*sys, *messages])
    return {"messages": [response]}



builder = StateGraph(GraphState)
builder.add_node("chatbot", chatbot_node)
builder.add_node("tools", ToolNode(tools, handle_tool_errors=True))

builder.add_edge(START, "chatbot")
builder.add_conditional_edges("chatbot", tools_condition)
builder.add_edge("tools", "chatbot")

graph = builder.compile()
