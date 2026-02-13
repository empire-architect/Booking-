# MASTER BUILD PROMPT (LiteAPI Booking Platform)

Copy everything below into your coding agent (Cursor/Codespaces AI/etc.):

---

You are a senior full-stack engineer. Build a production-ready hotel booking web app in this repository.

## Product Goal
Build a modern booking platform inspired by ZZZello (clean, premium UI) and powered by LiteAPI.
Core user flow:
1) Search by destination OR “search by vibe” (AI search)
2) Select dates + guests
3) View hotel results
4) Open hotel details and view grouped room offers
5) Choose offer and prebook
6) Enter guest details
7) Pay via LiteAPI Payment SDK
8) Complete booking and show confirmation

## Tech Stack (required)
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Zod for request validation
- Server-only LiteAPI integration via Next API routes (NO direct client key usage)

## Critical Security Rules
- Never expose LiteAPI key in client code.
- All LiteAPI requests must be server-side only.
- Read API key from environment variables only.
- Add robust error handling and safe user-facing messages.

## Environment Variables
Create `.env.example` with:
- `LITEAPI_KEY=`
- `LITEAPI_ENV=sandbox` (or `live`)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

## API Flow (must implement)
Use LiteAPI wiring exactly:
- Places autocomplete: `GET /v3.0/data/places`
- Rates search: `POST /v3.0/hotels/rates`
  - mode A: by `placeId`
  - mode B: by `aiSearch`
- Prebook: `POST https://book.liteapi.travel/v3.0/rates/prebook`
- Payment SDK: use `secretKey` + env-matched mode
- Book: `POST https://book.liteapi.travel/v3.0/rates/book`
- Hotel details: `GET /v3.0/data/hotel`

## Required App Pages / Routes
Implement these pages:
- `/` search page
- `/results` hotel result list
- `/hotel/[hotelId]` hotel details + grouped offers
- `/checkout` guest details + payment initiation
- `/booking/confirm` final confirmation page

Implement these internal API routes (Next handlers):
- `/api/places`
- `/api/rates/search`
- `/api/rates/prebook`
- `/api/rates/book`
- `/api/hotels/[hotelId]`

## UX Requirements
- Search mode toggle: Destination vs Vibe Search
- Date range + guests selector
- Hotel cards with: image, name, location, rating, starting price
- In hotel page: group offers by `mappedRoomId` and display room name + first image
- Display cancellation type (`RFN` / `NRFN`) clearly
- Checkout form fields: firstName, lastName, email
- Payment area with clear sandbox test card hint when sandbox mode

## Data/State Requirements
- Persist selected offer and prebook data safely between pages (server-safe session or signed storage)
- Store `prebookId`, `transactionId`, and `secretKey` after prebook
- On confirmation, call `book` with `TRANSACTION_ID` payment method

## Error Handling Requirements
- Handle empty search results gracefully
- Handle prebook failures with retry option
- Handle payment redirect edge cases (missing transactionId/prebookId)
- Handle booking failures with actionable user instructions

## Project Structure (target)
- `app/` pages + route handlers
- `components/` UI blocks
- `lib/liteapi/` API client + schemas + mappers
- `lib/validation/` zod schemas
- `types/` shared types
- `README.md` with setup + run instructions

## Implementation Quality Bar
- Strict TypeScript (no `any` unless justified)
- Reusable service layer for LiteAPI calls
- Clean separation of UI vs server logic
- Minimal but polished styling
- Ready to deploy

## Deliverables
1) Complete codebase in this repo
2) Updated `README.md` with:
   - setup
   - env vars
   - run steps
   - booking flow explanation
3) A short “Known limitations / next improvements” section

## Execution Plan (do in order)
1. Scaffold Next.js app + Tailwind + base layout
2. Build LiteAPI server client and typed wrappers
3. Build search UI and results page
4. Build hotel details + offer grouping
5. Build prebook + checkout + payment integration
6. Build booking confirmation flow
7. Add robust error handling + loading states
8. Update docs and ensure app runs end-to-end

Do not ask for more instructions. Start building now and complete the full MVP.

---

End of prompt.