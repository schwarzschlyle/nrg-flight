## NRG Flight — AI Service

FastAPI + LangGraph service that provides a streaming chatbot endpoint backed by the same PostgreSQL database as the main `api/` service.

### What it does

- Chats with the user using **ChatOpenAI** (LangChain)
- Can **query real flight/seat/booking data** via LangGraph tools
- Can **book a seat** (DB write) with a **human-in-the-loop confirmation** step
- Streams tokens from the backend to the frontend (chunked HTTP response)

### Run

This repo does not run commands automatically, but the intended dev command is:

```bash
poetry install
poetry run uvicorn ai_service.main:app --host 0.0.0.0 --port 3000 --reload
```

#### LangGraph tool runtime notes

This service is pinned to `langchain-core >=0.3.x` + `langgraph 0.2.x`. In these versions,
tools no longer receive a `ToolRuntime` object.

If a tool needs access to the graph state or the current tool call id, use:

- `state: Annotated[dict, langgraph.prebuilt.InjectedState]`
- `tool_call_id: Annotated[str, langchain_core.tools.InjectedToolCallId]`

### Environment

Copy `.env.example` to `.env` and fill in values.

Notes:

- `DATABASE_URL` should point to the same DB used by `api/`.
- `SECRET_KEY` must match the `api/` service secret if you want the AI service to decode the same JWTs.
