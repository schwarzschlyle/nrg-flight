# Postman testing guide (NRG Flight API)

This repository includes a ready-to-import **Postman collection** and **environment** that exercise **every API endpoint**.

## Files

- `api/postman_collection.json` – Postman Collection v2.1
- `api/postman_environment_local.json` – Local environment variables

## Pre-requisites

1. API is running locally (default URL expected by Postman env):
   - `http://localhost:8000`
2. Your backend `.env` includes an admin email matching Postman’s admin user:
   - `ADMIN_EMAILS=admin@example.com`
3. Database migrated and ready.

If you changed any of the above (host/port/admin email), update the Postman environment variables accordingly.

## Import into Postman

1. Open Postman.
2. **Import** → select:
   - `api/postman_environment_local.json`
   - `api/postman_collection.json`
3. Choose the environment **“NRG Flight API - Local”** (top-right environment selector).

## Recommended end-to-end flow (the order in the collection)

Run the collection (or run folders in order):

1. **00 - Init**
   - Calls `GET /health` and sets dynamic variables:
     - `departureDate` (today)
     - `userEmail` (randomized so the run is repeatable)
     - clears any old IDs/tokens

2. **01 - Auth**
   - Registers + logs in:
     - Admin (`admin@example.com`) → stores `adminAccessToken`
     - User (random email) → stores `userAccessToken` and `refreshToken`
   - Validates the session with `/auth/me`
   - Exercises refresh token rotation with `/auth/refresh`

3. **02 - Admin Setup**
   - Creates an aircraft template
   - Creates a flight for `departureDate + slotId`
     - If a flight already exists, `Admin - Get Flight By Slot` will still resolve it and populate `flightId`.
   - Updates the flight gate via `PATCH /admin/flights/{flightId}`

4. **03 - Flights & Slots (User)**
   - Lists all 24 hourly time slots for the date
   - Resolves the flight by slot
   - Lists flights and fetches a flight detail

5. **04 - Seats (User)**
   - Pulls the seat map for the flight
   - Finds the first available seat
   - Fetches a seat by its code (e.g. `1A`) to validate the “pick a specific seat” behavior

6. **05 - Bookings (User)**
   - Books the first available seat
   - Verifies admin manifest includes the passenger
   - Attempts to double-book the same seat (expects `409 Seat already booked`)
   - Lists/get bookings
   - Cancels the booking (**current implementation releases the seat**) and verifies the seat becomes available again

7. **99 - Cleanup**
   - Logs out (clears refresh cookie)

## Feature-focused endpoint sequences (Seats)

This section maps your 3 requested seat features directly to the **exact endpoints** that implement them.

### Preconditions (applies to Feature 01/02/03)

1. **User authentication**
   - `POST /api/v1/auth/register`
   - `POST /api/v1/auth/login` → get `access_token`

2. **A flight must exist for the chosen date + slot**
   - If `GET /api/v1/slots?date=...` shows `flight_id: null` for a slot, there is **no flight to book** yet.
   - Admin creates it with:
     - `POST /api/v1/admin/aircraft`
     - `POST /api/v1/admin/flights`

3. **User chooses date + time slot (hourly)**
   - `GET /api/v1/slots?date=YYYY-MM-DD` → 24 slots
   - Pick a slot, then resolve the concrete flight:
     - `GET /api/v1/slots/{slot_id}/flight?date=YYYY-MM-DD` → returns `flight_id`, `flight_number`, `gate`

---

### Feature 01 — “Print a flight/airplane with available seating”

Goal: display an aircraft seating layout and mark each seat as available/booked.

1. Resolve the `flight_id` (see Preconditions).
2. Fetch flight details (optional, but useful to show counts and metadata):
   - `GET /api/v1/flights/{flight_id}` → includes `total_seats` and `available_seats`
3. Fetch the seat map:
   - `GET /api/v1/flights/{flight_id}/seats`

The response contains a `seats[]` array of `SeatResponse` objects:

- `seat_code` (ex: `"1A"`)
- `is_booked` (frontend should disable seat buttons where `true`)

---

### Feature 02 — “Assign the first available seat”

Goal: auto-assign a seat (lowest row, then seat letter) and then book it.

1. Resolve the `flight_id` (see Preconditions).
2. Request the first available seat:
   - `GET /api/v1/flights/{flight_id}/seats/first-available`
   - Response includes: `seat_id`, `seat_code`, `is_booked=false`
3. Book that seat:
   - `POST /api/v1/bookings`
   - Body:
     ```json
     {
       "flight_id": "<flight_id>",
       "seat_id": "<seat_id>"
     }
     ```
4. Verify it’s now booked (optional validation):
   - `GET /api/v1/flights/{flight_id}/seats` and confirm that seat is now `is_booked=true`

Expected error cases:

- If no seats remain: `409 {"message":"No available seats"}`
- If someone else books it first: `409 {"message":"Seat already booked"}`

---

### Feature 03 — “Assign a seat for a specific passenger (ex: 1A)”

Goal: user chooses a specific `seat_code` and the backend resolves it to a `seat_id` for booking.

1. Resolve the `flight_id` (see Preconditions).
2. Show the seat UI grid:
   - `GET /api/v1/flights/{flight_id}/seats`
   - User picks a `seat_code` where `is_booked=false`.
3. Resolve the seat by code (server-side validation for codes like `"1A"`):
   - `GET /api/v1/flights/{flight_id}/seats/{seat_code}`
   - Response includes `seat_id` and `is_booked`.
   - If the seat doesn’t exist: `404 {"message":"Seat not found"}`.
4. Book the seat:
   - `POST /api/v1/bookings` with that `seat_id`.

Expected error cases:

- Seat already taken: `409 {"message":"Seat already booked"}`
- Invalid `seat_code`: `404 {"message":"Seat not found"}`


## Per-endpoint documentation (what each request tests)

### Health

- **GET** `{{baseUrl}}/health`
  - **Auth:** none
  - **Expected:** `200` JSON payload including:
    - `status` ("ok" | "error")
    - `system` (CPU, load average, memory, disk)
    - `process` (pid, uptime, RSS, open fds)
    - `checks.database` (status + latency)

### Auth

- **POST** `/api/v1/auth/register`
  - **Auth:** none
  - **Body:** `{email, password, full_name}`
  - **Expected:**
    - `201` on first creation
    - `409` if the email already exists (admin register is intentionally idempotent)

- **POST** `/api/v1/auth/login`
  - **Auth:** none
  - **Body:** `{email, password}`
  - **Expected:** `200` + JSON `{access_token, token_type, expires_in}`
  - **Also sets:** `Set-Cookie: refresh_token=...` which the collection captures into `refreshToken`.

- **GET** `/api/v1/auth/me`
  - **Auth:** Bearer `{{userAccessToken}}`
  - **Expected:** `200` with the logged-in account object

- **POST** `/api/v1/auth/refresh`
  - **Auth:** none
  - **Cookie:** `refresh_token={{refreshToken}}`
  - **Expected:** `200` with a new access token, and a rotated refresh cookie.

- **POST** `/api/v1/auth/logout`
  - **Auth:** none
  - **Expected:** `200 {"message":"Logged out"}` (refresh cookie cleared)

### Admin

All admin endpoints require a Bearer token for an account whose email is in `ADMIN_EMAILS`.

- **POST** `/api/v1/admin/aircraft`
  - **Auth:** Bearer `{{adminAccessToken}}`
  - **Body:** `{model, total_rows, seats_per_row}`
  - **Expected:** `201` with `AircraftResponse` (collection stores `aircraftId`).

- **POST** `/api/v1/admin/flights`
  - **Auth:** Bearer `{{adminAccessToken}}`
  - **Body:** `{time_slot_id, aircraft_id, departure_date}`
  - **Expected:**
    - `201` creates the flight + seats
    - `409` if a flight already exists for the same `(departure_date, time_slot_id)`

- **GET** `/api/v1/admin/flights/{flightId}/manifest`
  - **Auth:** Bearer `{{adminAccessToken}}`
  - **Expected:** `200` array of passengers (confirmed bookings).

- **PATCH** `/api/v1/admin/flights/{flightId}`
  - **Auth:** Bearer `{{adminAccessToken}}`
  - **Body:** `{gate?, is_active?}`
  - **Expected:** `200` updated flight.

### Slots & Flights

All non-admin “business” endpoints require a valid Bearer token.

- **GET** `/api/v1/slots?date=YYYY-MM-DD`
  - **Expected:** 24 items, one per hourly slot.

- **GET** `/api/v1/slots/{slotId}/flight?date=YYYY-MM-DD`
  - **Expected:** resolves the unique flight for that date + slot.

- **GET** `/api/v1/flights?date=YYYY-MM-DD`
  - **Expected:** list of active flights.

- **GET** `/api/v1/flights/{flightId}`
  - **Expected:** flight detail including `total_seats` and `available_seats`.

### Seats

- **GET** `/api/v1/flights/{flightId}/seats`
  - **Expected:** seat map with `is_booked` flags.

- **GET** `/api/v1/flights/{flightId}/seats/first-available`
  - **Expected:** first available seat by row/letter order.

- **GET** `/api/v1/flights/{flightId}/seats/{seatCode}`
  - **Expected:** a seat object (used by the UI to validate a user-selected seat code like `1A`).

### Bookings

- **POST** `/api/v1/bookings`
  - **Body:** `{flight_id, seat_id}`
  - **Expected:** `201` booking created.
  - **Concurrency:** a double-book attempt should return `409 Seat already booked`.

- **GET** `/api/v1/bookings`
  - **Optional query:** `status`, `date`, `limit`, `offset`
  - **Expected:** `{items: [...], total: N}`

- **GET** `/api/v1/bookings/{bookingId}`
  - **Expected:** booking detail.

- **DELETE** `/api/v1/bookings/{bookingId}`
  - **Expected:** `200 {"message":"Booking cancelled"}`.
  - **Note:** current implementation releases the seat (`is_booked=false`).

## Troubleshooting

### 403 on admin endpoints

Ensure your backend has:

```env
ADMIN_EMAILS=admin@example.com
```

### 409 Flight already exists

Change one of these in your Postman environment:

- `slotId` (0–23)
- `departureDate`

### 409 No available seats

This means all seats on that flight are booked. Create a new flight (different slot or date), or cancel existing bookings.
