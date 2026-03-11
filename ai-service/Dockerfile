## AI Service (FastAPI + LangGraph)
##
## Runs: uvicorn ai_service.main:app --host 0.0.0.0 --port 3000
##
## Environment variables should be provided at runtime (e.g. docker compose env_file).

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VIRTUALENVS_CREATE=false

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry==1.8.3

COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-interaction --no-ansi

COPY ai_service ./ai_service
COPY README.md ./

# The application config points to /app/.env; create an empty file so
# pydantic-settings doesn't fail if the file isn't mounted.
RUN touch /app/.env

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=10 CMD curl -fsS http://localhost:3000/health || exit 1

CMD ["uvicorn", "ai_service.main:app", "--host", "0.0.0.0", "--port", "3000"]
