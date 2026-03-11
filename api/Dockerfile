## API (FastAPI)
##
## Runs: uvicorn app.main:app --host 0.0.0.0 --port 8000
##
## Environment variables should be provided at runtime (e.g. docker compose env_file).

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VIRTUALENVS_CREATE=false

WORKDIR /app

# System dependencies (kept minimal; helps in case wheels aren't available)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir poetry==1.8.3

# Install Python deps first (better caching)
COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-interaction --no-ansi

# Copy app code
COPY app ./app
COPY alembic.ini MIGRATIONS.md POSTMAN.md README.md ./
COPY app/alembic ./app/alembic

# The application config also points to /app/.env; create an empty file so
# pydantic-settings doesn't fail if the file isn't mounted.
RUN touch /app/.env

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --retries=10 CMD curl -fsS http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
