# Havely (LiteAPI Booking MVP)

A Next.js + TypeScript booking platform MVP inspired by ZZZello and powered by LiteAPI.

## Features

- Search hotels by **destination** (`placeId`) or **vibe search** (`aiSearch`)
- Date range + guest selection
- Results page with hotel cards and starting rates
- Hotel details page with offers grouped by `mappedRoomId`
- Checkout with guest details
- Prebook flow + LiteAPI Payment SDK integration
- Booking confirmation flow
- Secure server-side LiteAPI calls (API key never exposed to browser)

---

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Zod validation
- Server-side API route layer for LiteAPI

---

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Required:

- `LITEAPI_KEY` (single LiteAPI server key, e.g. `sand_...` or production key)
- `LITEAPI_ENV` (`sandbox` or `live`)
- `NEXT_PUBLIC_LITEAPI_ENV` (must match `LITEAPI_ENV`)
- `SESSION_SECRET`

> LiteAPI does **not** use a Stripe-style public/secret key pair for this integration — only one server-side `LITEAPI_KEY` is needed.

### 3) Run dev server

```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

---

## Booking Flow

1. **Search** (`/`)  
   - destination mode: `/api/places` + `/api/rates/search`
   - vibe mode: `/api/rates/search` with `aiSearch`

2. **Browse Results** (`/results`)  
   Displays hotels + starting rates.

3. **Hotel Details** (`/hotel/[hotelId]`)  
   Loads hotel info (`/api/hotels/[hotelId]`) and groups offers by room.

4. **Checkout** (`/checkout`)  
   - Collect guest details
   - Calls `/api/rates/prebook`
   - Creates a server-side booking session + signed cookie containing only session id
   - Mounts LiteAPI Payment SDK

5. **Confirm** (`/booking/confirm`)  
   Calls `/api/rates/book` using secure booking session context and shows confirmation details.
   Repeated clicks are idempotent within session TTL (returns cached booking result).

---

## Internal API Routes

- `GET /api/places`
- `POST /api/rates/search`
- `POST /api/rates/prebook`
- `POST /api/rates/book`
- `GET /api/hotels/[hotelId]`

All LiteAPI requests are executed server-side.

---

## Production Notes

- Do **not** commit real LiteAPI keys
- Keep `SESSION_SECRET` strong and private
- Ensure `NEXT_PUBLIC_LITEAPI_ENV` and `LITEAPI_ENV` are aligned
- Keep server session storage on persistent volume or move to Redis/Postgres
- In production, set HTTPS and secure cookies

---

## Known Limitations / Next Improvements

1. **Session store durability**
   - Current implementation uses a local file store for booking sessions/idempotency.
   - For scale/high availability, migrate to Redis/Postgres-backed session store.

2. **Rate refresh before final book**
   - Add re-validation step before payment/book to reduce stale-offer risk.

3. **Auth + user accounts**
   - Add user login, booking history, and cancellation management.

4. **Observability**
   - Add structured logs, tracing, and alerting for prebook/book failures.

5. **Testing**
   - Add unit tests (service + validation) and end-to-end tests for booking flow.
