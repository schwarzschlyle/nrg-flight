# NRG Flight

End-to-end demo app for an airline-style ticketing/seat booking flow:

- **client/** — React + TypeScript + Vite frontend
- **api/** — FastAPI backend (auth, admin, flights, seats, bookings)
- **ai-service/** — FastAPI + LangGraph AI service (streaming chatbot as a tool-calling agent)

---

## Quick startup

### 1) Create env files

Copy templates and fill in the values:

```bash
cp api/.env.example api/.env
cp ai-service/.env.example ai-service/.env
cp client/.env.example client/.env
```

### 2) Pull + run

```bash
docker-compose pull
docker-compose up
```

URLs:

- Client: http://localhost:5173
- API Health Check: http://localhost:8000/health
- AI Service Health Check: http://localhost:3000/health

---

## GitHub Actions image publishing (GHCR)

On every push to the `main` branch, GitHub Actions builds and pushes 3 images:

- `ghcr.io/schwarzschlyle/nrg-flight-client:latest`
- `ghcr.io/schwarzschlyle/nrg-flight-api:latest`
- `ghcr.io/schwarzschlyle/nrg-flight-ai-service:latest`

It also publishes an immutable tag for traceability:

- `:sha-<gitsha>`

Workflow file:

- `.github/workflows/publish-images.yml`

---

## Quick testing (UI walkthrough)

### 0) Enable your admin user

In `api/.env`, set `ADMIN_EMAILS` to a comma-separated list of admin emails, e.g.

```dotenv
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

This allows the email to be elevated to Admin level and allow access to the Admin panel for creation and scheduling of flights.


### 1) Register and login

1. Open http://localhost:5173/register
2. Register using an email that is in `ADMIN_EMAILS`.
3. After registration you’ll be logged in and redirected to the Booking page.

### 2) Create aircraft + schedule a flight (Admin)

1. Click **Admin** in the header.
2. Create an aircraft:
   - model
   - rows
   - seats per row
3. Schedule a flight for that aircraft:
   - select the newly-created aircraft
   - departure date
   - time slot

### 3) Book a seat (Booking)

1. Click **Booking** in the header.
2. Select the departure date that you used when scheduling the flight.
3. Choose the flight.
4. Select a seat.
5. Book the seat and wait for the booking process to complete.
6. Download the generated itinerary PDF.

### 4) Chatbot (AI service)

1. Open the chatbot assistant (lower right corner).
2. Try questions like:
   - “What flights exist on 2026-03-11?”
   - “Book me a window seat for tomorrow morning.”

If `OPENAI_API_KEY` is not set in `ai-service/.env`, the AI service will respond with a clear “disabled” message.

---

## Database schema (high level)

Defined in `api/app/models.py` (SQLAlchemy) and created by the initial Alembic migration.

Core tables:

- `account`
- `aircraft`
- `time_slot` (seeded with 24 hourly slots, ids 0–23)
- `flight` (unique by `(departure_date, time_slot_id)`)
- `seat` (unique by `(flight_id, seat_code)`)
- `booking_status` (seeded: pending/confirmed/cancelled)
- `booking` (ties account + flight + seat)

---

## Database migrations (Alembic)

See `api/MIGRATIONS.md`.

Typical commands (inside `api/`):

```bash
poetry run alembic upgrade head
poetry run alembic revision --autogenerate -m "your change"
```

---

## API endpoints (FastAPI)

Base path:

- `/api/v1`

Main groups:

- `GET /health`
- Auth: `/api/v1/auth/*`
- Flights/Slots/Seats/Bookings: `/api/v1/...`
- Admin: `/api/v1/admin/*`

For a complete, testable listing (with flows), see:

- `api/POSTMAN.md`
- Swagger: http://localhost:8000/docs

---

## AI service endpoints

Base path:

- `/api/v1`

Endpoints:

- `POST /api/v1/chat` — streaming SSE chat endpoint
- `GET /health`

---

## Auth & JWT (overview)

The API issues:

- **Access token** (JWT, returned in JSON)
- **Refresh token** (JWT, stored in an HttpOnly cookie)

Admin access is controlled by `ADMIN_EMAILS` in `api/.env`.

Both `api/` and `ai-service/` share:

- `SECRET_KEY`
- `ALGORITHM`

…so the AI service can decode the API’s JWTs when needed.

---

## Frontend structure (Atomic Design)

The React client uses an **atomic design** component organization:

- `atoms/` — small UI primitives
- `molecules/` — composed UI blocks
- `organisms/` — larger composed sections / widgets

You’ll see this pattern across pages, for example:

- `client/src/pages/BookingPage/components/...`
- `client/src/pages/AdminPage/components/...`

---

## Local development

Even though the default `docker-compose.yml` uses prebuilt GHCR images, you can build locally using:

```bash
docker-compose -f docker-compose.yml -f docker-compose.build.yml up --build
```
