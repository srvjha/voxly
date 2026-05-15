# Voxly

A real-time polling platform. Sign in, build a poll in a 3-step wizard, share one link, watch responses stream in live, then publish the final results back to the same link for the whole world to see.

This repository was built as a hackathon submission against the brief reproduced at the bottom of this document. Every rule in that brief is mapped to a concrete piece of the codebase in the [Requirements Checklist](#requirements-checklist).


---
Live : https://voxly.srvjha.in
## What Voxly does

Voxly is a full-stack web app with two distinct surfaces:

**Creator surface (authenticated)**
- Sign in with Clerk.
- Create a poll through a three-step wizard: Details, Questions, Review.
- Each question is single-choice with two or more options.
- Mark each question as mandatory or optional.
- Choose between anonymous responses and authenticated-only responses for the poll as a whole.
- Set an expiry time. Once that time passes, the poll automatically flips to the `expired` state and the backend stops accepting submissions.
- Share one URL: `/p/:id`. The same URL renders the response form while the poll is active and the published results once you publish them.
- Watch a live analytics dashboard while responses come in (totals, per-question breakdowns, leading options, regional distribution).
- Publish the poll. From that moment on, anyone with the link sees the final results.

**Respondent surface (public)**
- Open the shared link, see the questions.
- Submit answers anonymously or signed in, depending on the poll's mode.
- The frontend enforces mandatory questions before allowing submit. The backend re-validates and rejects bad payloads. One response per signed-in account, one response per anon token (per browser) for anonymous polls.
- After submission the same URL turns into a "thank you" view; after the creator publishes, the same URL renders public results.

Everything writes to a normalised Postgres schema and broadcasts a `poll:update` Socket.io event when a new response lands so every creator dashboard subscribed to that poll redraws tallies without polling.

---

## Requirements Checklist

The hackathon brief is at the end of this README. Each rule is implemented as follows.

| Requirement | Where it lives |
| --- | --- |
| Logged-in user can create polls with multiple questions | `frontend/src/pages/PollBuilder.tsx`, `backend/src/app/polls/polls.service.ts#createPoll` |
| Questions can be marked mandatory or optional | `questions.is_mandatory` column + zod schema in `polls.schema.ts` + checkbox in the wizard |
| Anonymous or authenticated response modes | `polls.is_anonymous` column + `loadOptionalDbUser` middleware + anon-token branch in `submitResponse` |
| Per-poll expiry time auto-deactivates the poll | `polls.expires_at` + `maybeExpire` in `polls.service.ts` (lazy expiry on read) + 410 response on submit |
| Single-option questions only | Schema constrains one row in `question_answers` per `(response, question)` via a unique index |
| Respondents open public link, answer, submit | Public route `GET /polls/:id` + `POST /polls/:id/responses`, UI in `frontend/src/pages/PollPublic.tsx` |
| Analytics dashboard: totals, per-question summaries, option counts, participation | `frontend/src/pages/Analytics.tsx` with recharts + `computeTallies` on the backend |
| Publish final results, anyone can view them on the same link | `polls.status = 'published'` + `publishedAt` + the public route returns tallies once published |
| Real-time updates via WebSockets / Socket.io | `backend/src/realtime/io.ts` rooms keyed by `poll:<id>` + `frontend/src/lib/socket.ts` + `usePollRoom` hook |
| Auth + protected routes | Clerk middleware (`@clerk/express`), `ProtectedRoute` component in the frontend |
| Dynamic React forms + validation | `react-hook-form` + `zod` schemas shared in spirit between client and server |
| Database schema design | Drizzle ORM, 6 tables, foreign keys with cascade rules, unique indexes for invariants |
| Express APIs + response collection | All routes under `backend/src/app/polls/polls.routes.ts` |
| Frontend + backend both implemented | Two folders: `frontend/` (React 19 + Vite + Tailwind v4) and `backend/` (Express 5 + Drizzle + Postgres) |

---

## Tech Stack

**Frontend** (`/frontend`)
- React 19 with TypeScript
- Vite 8
- Tailwind CSS v4 (with a custom `dark:` variant wired to `data-theme="dark"`)
- React Router 7
- Clerk React SDK for auth
- react-hook-form + @hookform/resolvers + zod for the poll wizard
- axios for HTTP
- recharts for the analytics charts (bar + donut)
- socket.io-client for live updates
- Zustand for theme state
- lucide-react for icons, inline SVG for brand icons and the Voxly mark

**Backend** (`/backend`)
- Node.js + Express 5 with TypeScript (ESM)
- Drizzle ORM on PostgreSQL (Supabase-friendly connection string)
- @clerk/express for Clerk JWT verification and session-activity lookups
- Svix for verifying Clerk webhook signatures
- socket.io for the realtime channel
- geoip-lite for IP-to-country resolution of anonymous responses
- zod for request validation, express-rate-limit on the response endpoint
- uuid + cors + dotenv

---

## Architecture at a glance

```
                  Browser (React + Vite)
                  ───────────────────────
                   |              |
                   |  HTTPS/REST  |  Socket.io (WS)
                   v              v
            ┌───────────────────────────────┐
            │   Express 5 (TypeScript)      │
            │  ─ Clerk auth middleware      │
            │  ─ Routes:  /auth, /polls     │
            │  ─ Realtime: poll:<id> rooms  │
            │  ─ Geo-IP enrichment          │
            └────────────┬──────────────────┘
                         │ Drizzle ORM
                         v
                  ┌──────────────┐
                  │  PostgreSQL  │
                  └──────────────┘
```

Two important non-obvious choices:

1. **Geo-IP for analytics.** Each `poll_responses` row stores the client IP. For *signed-in* respondents the analytics aggregator calls Clerk's Backend SDK for the latest session activity's country (geo-resolved server-side by Clerk). For *anonymous* respondents (or Clerk misses) we fall back to `geoip-lite` on the stored IP. Both paths feed the same "Regional Participation" card.
2. **Trust proxy.** Express sets `trust proxy = true` so behind ngrok / a reverse proxy `req.ip` returns the real client IP via `X-Forwarded-For`, not the loopback. Without this the geo-IP lookup would always say "Unknown" in development.

---

## Database Schema

Six tables under one `public` schema. All primary keys are UUIDs.

```
users
├── id           uuid pk
├── clerk_id     varchar unique
├── email        varchar unique
├── name         varchar
└── created_at   timestamp

polls
├── id           uuid pk
├── creator_id   uuid -> users.id  (cascade)
├── title        varchar(500)
├── description  text
├── status       enum(draft, active, expired, published)
├── is_anonymous boolean
├── expires_at   timestamp
├── published_at timestamp
├── created_at   timestamp
└── updated_at   timestamp

questions
├── id           uuid pk
├── poll_id      uuid -> polls.id (cascade)
├── text         text
├── is_mandatory boolean
├── order_index  integer
└── created_at   timestamp

options
├── id           uuid pk
├── question_id  uuid -> questions.id (cascade)
├── text         text
└── order_index  integer

poll_responses
├── id            uuid pk
├── poll_id       uuid -> polls.id (cascade)
├── respondent_id uuid -> users.id (set null)
├── anon_token    varchar
├── ip_address    varchar
├── submitted_at  timestamp
└── UNIQUE(poll_id, respondent_id) WHERE respondent_id IS NOT NULL
       — one response per signed-in user per poll

question_answers
├── id          uuid pk
├── response_id uuid -> poll_responses.id (cascade)
├── question_id uuid -> questions.id      (cascade)
├── option_id   uuid -> options.id        (cascade)
└── UNIQUE(response_id, question_id)
       — single choice enforced at the DB level
```

The schema lives in `backend/src/db/schema.ts`. Use `pnpm db:push` to sync it to your database.

---

## API Reference

All routes are mounted under their group prefix. JSON in, JSON out. `Authorization: Bearer <clerk-jwt>` is expected on protected routes.

### Auth
- `POST /auth/webhook` — Clerk webhook receiver (user.created / user.updated / user.deleted), verified with Svix.
- `GET  /auth/me` — Returns the current user row (creates one on first call if it doesn't exist yet).

### Polls — Creator surface (protected)
- `POST   /polls`                  Create a poll (draft state). Body validated against zod.
- `GET    /polls`                  List polls the current user created.
- `GET    /polls/participated`     List polls the current user has *responded to* (signed-in submissions only).
- `PATCH  /polls/:id`              Edit a draft poll. Locks once responses exist.
- `POST   /polls/:id/activate`     Move a draft to `active` and make it shareable.
- `POST   /polls/:id/publish`      Publish final results. Same URL now renders results to anyone.
- `DELETE /polls/:id`              Delete a poll and its cascaded data.
- `GET    /polls/:id/analytics`    Aggregated tallies + regional breakdown for the creator.

### Polls — Public / mixed surface
- `GET  /polls/:id`                Fetch the poll. Body shape varies by status:
  - `draft`     — 404 unless requester is the creator.
  - `active`    — Returns the form structure (no tallies leaked).
  - `expired`   — 410 unless requester is the creator.
  - `published` — Returns the form structure plus tallies for everyone.
- `POST /polls/:id/responses`      Submit a response. Mandatory question check + expiry check + duplicate check (per user or per anon token). Rate-limited.

### Realtime
- Socket.io endpoint shares the same HTTP server.
- Client emits `poll:subscribe <pollId>` to join a room.
- Server emits `poll:update { pollId }` after every accepted response. The client refetches analytics on receipt.

---

## Project Structure

```
voxly/
├── backend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/                   Clerk webhooks + me endpoint
│   │   │   └── polls/                  Poll CRUD, responses, analytics
│   │   ├── db/                         Drizzle schema + client
│   │   ├── middleware/                 Common middleware
│   │   ├── realtime/io.ts              Socket.io server + room broadcast
│   │   ├── utils/                      env loader, helpers
│   │   ├── validation.ts               zod request validator
│   │   ├── http-error.ts               typed HttpError class
│   │   ├── app.ts                      Express assembly (cors, clerk, routes, error handler)
│   │   └── index.ts                    Entrypoint: http.createServer + initIO
│   ├── drizzle.config.ts
│   └── package.json
│
├── frontend/
│   ├── public/favicon.svg              Voxly mandala mark
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx              Floating-pill navbar with scroll collapse
│   │   │   ├── HeroBackground.tsx      Mandala, paisley blobs, jali strip
│   │   │   ├── VoxlyMark.tsx           Shared brand mark
│   │   │   ├── BrandIcons.tsx          Inline X / LinkedIn / GitHub SVGs
│   │   │   ├── ProtectedRoute.tsx      Clerk-aware guard
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── ui/                     shadcn-style primitives (Card, Button, Input, …)
│   │   ├── lib/
│   │   │   ├── api.ts                  axios client + useApi hook
│   │   │   ├── socket.ts               socket.io-client + usePollRoom hook
│   │   │   ├── anonToken.ts            per-poll anon token in localStorage
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx                Landing page (hero, features, how-it-works, CTA, footer)
│   │   │   ├── Dashboard.tsx           Tabs: Created by me / I responded to
│   │   │   ├── PollBuilder.tsx         3-step wizard + live preview
│   │   │   ├── PollManage.tsx          Activate / publish / delete controls
│   │   │   ├── PollPublic.tsx          Public response form + published results view
│   │   │   └── Analytics.tsx           KPIs, bar charts, donut, regional, insights
│   │   ├── stores/theme.ts             Zustand-backed light/dark store
│   │   ├── types.ts                    Shared TypeScript types
│   │   ├── index.css                   Tailwind v4 tokens, dark variant override
│   │   ├── App.tsx                     Route table
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
│
└── README.md   (this file)
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 10+ (`corepack enable` if you have Node 20+ but no pnpm)
- A PostgreSQL database (Supabase works out of the box, the project ships with a Supabase connection string format)
- A Clerk application (free tier) with the **Backend API Key**, **Publishable Key**, and a configured **Webhook signing secret**

### 1. Clone

```bash
git clone <repo-url> voxly
cd voxly
```

### 2. Backend

```bash
cd backend
pnpm install
cp .env.example .env   # or create one — see Environment Variables below
pnpm db:push           # sync Drizzle schema to your database
pnpm dev               # tsc-watch + node, hot-reloads on save
```

Backend starts on `PORT` (default `8080`).

### 3. Frontend

```bash
cd ../frontend
pnpm install
cp .env.example .env   # see below
pnpm dev               # Vite on http://localhost:5173
```

### 4. Wire Clerk
- Add `http://localhost:5173` to **Allowed origins** in your Clerk dashboard.
- Add a webhook endpoint pointing to `<backend-url>/auth/webhook` with the `user.created`, `user.updated`, `user.deleted` events.
- Copy the webhook signing secret into the backend env.

### 5. Open the app
Go to `http://localhost:5173`, sign up, hit **Create Poll**, and you are off.

---

## Environment Variables

### Backend (`backend/.env`)

```ini
# Postgres connection (Supabase Pooler URL works fine)
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# CORS — comma-separated allowlist for the frontend origins
CORS_ORIGINS=http://localhost:5173

# Optional
PORT=8080
```

### Frontend (`frontend/.env`)

```ini
VITE_API_BASE_URL=http://localhost:8080
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## Real-time Layer

`backend/src/realtime/io.ts` initialises a typed `socket.io` server that shares the HTTP server. Clients join a room keyed by `poll:<pollId>` via `poll:subscribe`. After every accepted response the service layer calls `broadcastPollUpdate(pollId)` which fans out a `poll:update` event to that room.

The frontend listens through a tiny `usePollRoom(pollId, onUpdate)` hook. The Analytics page subscribes to its own poll and refetches tallies on every event — no polling, no extra REST traffic.

CORS for the Socket.io upgrade is honoured via the same `CORS_ORIGINS` env list as the HTTP layer.

---

## Notable Implementation Notes

- **Trust proxy.** `app.set("trust proxy", true)` is mandatory in any environment where the backend sits behind a tunnel/proxy (ngrok in dev, Vercel Edge / Cloudflare in prod). Without it `req.ip` is the loopback and geo-IP always reports Unknown.
- **ngrok free-tier interstitial.** The axios client sends `ngrok-skip-browser-warning: true` so requests don't get redirected to ngrok's HTML splash page during development.
- **Single-choice invariant in the DB.** The `question_answers` table has a unique index on `(response_id, question_id)`, so even if the API were misused, the database refuses a second answer for the same question on a single response.
- **One response per signed-in user.** Partial unique index on `poll_responses(poll_id, respondent_id) WHERE respondent_id IS NOT NULL`. Anonymous duplicates are prevented by an `anonToken` written to `localStorage` per poll.
- **Lazy expiry.** Rather than running a cron, polls in the `active` state are checked on read: if their `expires_at` is in the past, the row is flipped to `expired` inside the same request. Submissions on expired polls return HTTP 410.
- **Draft is editable, anything else is frozen.** The update endpoint rejects edits on non-draft polls and also rejects edits on polls that already have responses, so the analytics dashboard never becomes structurally inconsistent.
- **Tailwind v4 dark variant.** Tailwind's default `dark:` follows `prefers-color-scheme`. Voxly uses a custom variant pinned to `data-theme="dark"` so the in-app theme toggle drives everything (`@custom-variant dark (...)` at the top of `index.css`).
- **Three-step wizard, not a single sprawling form.** react-hook-form's `trigger()` is used per step so we never let the user reach Review with invalid data; the indicator at the top is clickable but only for steps already validated past.
- **Clerk-driven country for signed-in respondents.** Where Clerk has session-activity data, we prefer its IP-geolocated `country` (more accurate than a self-rolled lookup). The `geoip-lite` path is the fallback for anonymous and for users whose Clerk session has no activity yet.

---

## Scripts

### Backend
- `pnpm dev` — tsc-watch + node, hot reload
- `pnpm build` — TypeScript compile
- `pnpm start` — Run the compiled `dist/index.js`
- `pnpm db:push` — Sync Drizzle schema directly to the database
- `pnpm db:generate` — Generate SQL migrations from the schema
- `pnpm db:migrate` — Run pending SQL migrations
- `pnpm db:studio` — Open Drizzle Studio

### Frontend
- `pnpm dev` — Vite dev server
- `pnpm build` — Type-check then build for production
- `pnpm preview` — Serve the built bundle
- `pnpm lint` — ESLint

---

## Deployment Notes

- **Frontend**: Any static host (Vercel, Netlify, Cloudflare Pages). Build with `pnpm build`, serve `frontend/dist`. Set the two `VITE_*` env vars on the host.
- **Backend**: Any Node host with a long-lived process (Render, Railway, Fly.io, a VPS). Build with `pnpm build`, start `node dist/index.js`. Socket.io requires sticky sessions if you run multiple instances; for a hackathon a single instance is fine.
- **Database**: Supabase Pooler or any Postgres. Run `pnpm db:push` once on first deploy.
- **Clerk**: Add the deployed frontend origin to Allowed Origins. Update the webhook endpoint to the deployed backend URL.

---

## Out of Scope / What we'd add next

- Multi-choice questions (the data model supports it; the form/aggregator does not yet).
- Email export of results to non-creators.
- A geoip database upgrade (paid MaxMind tier) for sub-country resolution.
- Per-respondent demographic capture as an opt-in onboarding step stored in Clerk `publicMetadata`.
- Code-splitting `Analytics.tsx` behind `React.lazy` (recharts adds ~190 KB gzipped to the main bundle today).
- Choropleth map for "Regional Participation" using react-simple-maps.

## License

For hackathon judging and educational use.
