# NRG Flight API (FastAPI)

Backend API for an airplane ticketing service.

## Requirements

- Python 3.12+
- Poetry
- PostgreSQL (Neon compatible)

## Setup

1. Create a `.env` file in this `api/` directory.
   Use `.env.example` as a template.

2. Install dependencies:

```bash
poetry install
```

3. Run migrations:

```bash
poetry run alembic upgrade head
```

4. Run the API:

```bash
poetry run uvicorn app.main:app --reload
```

The API is served under:

- `http://localhost:8000/api/v1`

Swagger UI:

- `http://localhost:8000/docs`

## Health endpoint

`GET /health` returns a **production-grade health payload** including:

- machine metrics (CPU count, load average, memory, disk)
- process metrics (pid, uptime, RSS, open file descriptors)
- readiness checks (database ping + latency)

## Postman

Import:

- `api/postman_collection.json`
- `api/postman_environment_local.json`

Full flow + per-endpoint testing notes: **`api/POSTMAN.md`**

## Test suite (100% coverage gate)

The project is configured to **fail CI** if coverage drops below 100%.

```bash
poetry run pytest
```

## Core user flow (API)

1. Register + login
   - `POST /api/v1/auth/register`
   - `POST /api/v1/auth/login` (sets refresh token cookie)

2. Pick date/time slot (24 hourly slots)
   - `GET /api/v1/slots?date=YYYY-MM-DD`
   - `GET /api/v1/slots/{slot_id}/flight?date=YYYY-MM-DD`

3. Seat picking
   - `GET /api/v1/flights/{flight_id}`
   - `GET /api/v1/flights/{flight_id}/seats`
   - Auto-assign first available: `GET /api/v1/flights/{flight_id}/seats/first-available`
   - Validate a specific seat code: `GET /api/v1/flights/{flight_id}/seats/{seat_code}`

4. Book + cancel
   - `POST /api/v1/bookings`
   - `DELETE /api/v1/bookings/{booking_id}` (releases the seat)

## Admin flow

Admin users are controlled via `ADMIN_EMAILS`.

- Create an aircraft template: `POST /api/v1/admin/aircraft`
- Create a flight for a date+slot (auto-generates seat rows): `POST /api/v1/admin/flights`
- Update gate / deactivate flight: `PATCH /api/v1/admin/flights/{flight_id}`
- Passenger manifest: `GET /api/v1/admin/flights/{flight_id}/manifest`

## Database migrations (Alembic)

See: `MIGRATIONS.md`
