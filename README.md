# s-url

A full-stack URL shortener: custom aliases, expiry, Redis-cached redirects, per-day click analytics, free/premium plans, and an admin panel.

**Stack:** Express 5 · TypeScript · Drizzle ORM · PostgreSQL · Redis · React 19 · Vite · Tailwind CSS 4 · Zod

---

## Features

- **Shorten URLs** — random codes or custom aliases (`3–32 chars: a-z A-Z 0-9 - _`), with quota enforcement (free: 5 custom aliases, premium: unlimited)
- **Alias reuse** — an expired alias can be revived **only by its owner**, in place (keeps id and click history)
- **Expiry** — per-link expiry; expired links 302 to a friendly `/expired` page (or return `410` JSON in API-only mode)
- **Fast redirects** — cache-aside Redis lookup (24h TTL), Postgres fallback, `302` to the original URL
- **Click analytics** — counters buffered in Redis, flushed to Postgres every 1s; per-UTC-day buckets power 7/14/30-day charts, KPIs, and top links
- **Auth** — JWT (Bearer), register/login/`me`, bcrypt password hashing
- **Plans** — free/premium ($9.99 · 30 days, simulated checkout), payment history, 402 quota gating
- **Admin panel** — user/link lists, role management (guarded: no self-demote, last-admin protection), overview stats
- **Roles** — admin bootstrap via CLI script only (no API route), per-request role re-checks on `/api/admin/*`

---

## Tech Stack

| Layer      | Server (`server/`)          | Client (`client/`)             |
| ---------- | --------------------------- | ------------------------------ |
| Runtime    | Node ≥ 20                   | Browser                        |
| Framework  | Express 5                   | React 19 + Vite 8              |
| Language   | TypeScript                  | TypeScript                     |
| Data       | Drizzle ORM → PostgreSQL 17 | —                              |
| Cache      | ioredis → Redis (Alpine)    | —                              |
| Validation | Zod 4                       | Zod 4 (mirrored schemas)       |
| Routing    | Express Router              | React Router 7                 |
| Styling    | —                           | Tailwind CSS 4                 |
| Auth       | jsonwebtoken + bcrypt       | Bearer token in `localStorage` |
| Lint/Test  | `tsc --noEmit`              | oxlint                         |

---

## Architecture

```
┌────────────────────────── BROWSER (React) ──────────────────────────┐
│  Page → Form (client Zod) / useLinks·useStats (hooks, 3s polling)   │
│         services/*.service.ts → services/api.ts (fetch + JWT)       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP/JSON  (Authorization: Bearer)
                               ▼
┌──────────────────────── SERVER (Express 5) ─────────────────────────┐
│  app.ts ─ helmet / cors / express.json(1mb)                         │
│    /api/auth  /api/links  /api/billing  /api/stats  /api/admin      │
│    /:code (public redirect, mounted last)                           │
│         │                                                           │
│    routes → authenticate → validate (Zod) → controller → service    │
│                                                              │      │
│    service = business rules (quota 402, conflicts 409, expiry,      │
│               cache-aside resolve, flush-before-read)               │
│         repository = SQL only (Drizzle)                             │
│         errorHandler → { error: { message, code, details? } }       │
└────────────┬──────────────────────────────────┬─────────────────────┘
             ▼                                  ▼
┌── PostgreSQL (:5433) ─────────────┐  ┌── Redis (:6380) ──────────────┐
│ users       auth, role, plan      │  │ redirect:{code}  read-through │
│ urls        shortCode UNIQUE,     │  │                  cache (24h)  │
│             originalUrl, clicks,  │  │ clicks:{code}:{day} counters  │
│             expiresAt             │  │                  (→ PG every  │
│ click_daily  per-UTC-day buckets  │  │                   1s by job)  │
│ payments    billing records       │  └───────────────────────────────┘
└───────────────────────────────────┘
```

**Key flows:**

- **Create:** form → client Zod → `POST /api/links` → JWT verify → Zod → controller → service (quota/conflict rules) → repository → `INSERT` → `201 { link }` → toast + list reload
- **Redirect:** `GET /:code` → Redis hit? **yes** → 302 · **no** → Postgres → cache set (24h) → 302; parallel `INCR` click counter
- **Clicks:** Redis counters → background job (1s) atomically claims them → one transaction bumps `urls.clicks` + `click_daily` (restored to Redis on DB failure — no clicks lost)

**Invariants:** client never touches the DB; controllers never do SQL; repositories never hold business rules; Redis is always an accelerator, never the source of truth.

---

## Project Structure

```
s-url/
├── server/
│   ├── docker-compose.yml        # postgres:17 + redis, healthchecks
│   ├── migrations/               # Drizzle SQL migrations (0000–0003)
│   ├── scripts/                  # promoteAdmin, seedAdmin, seedDemo, seedClickHistory
│   └── src/
│       ├── app.ts                # createApp() — middleware + router mounts
│       ├── index.ts              # listen + graceful shutdown + clickSync job
│       ├── config/env.ts         # Zod-validated environment
│       ├── db/                   # drizzle client, redis client, schema, errors
│       ├── jobs/clickSync.ts     # periodic Redis→PG click flush
│       ├── middleware/           # authenticate, validate, requireAdmin, errorHandler
│       ├── modules/              # auth | links | redirect | stats | billing | admin
│       │   └── <module>/         # routes → controller → service → repository → schemas
│       └── utils/                # ApiError, jwt, shortCode
└── client/
    └── src/
        ├── pages/                # Landing, Dashboard, Account, Pricing, Checkout, Admin…
        ├── components/           # links/ stats/ admin/ auth/ layout/ ui/
        ├── hooks/                # useLinks, useStats, useAuth, useToast
        ├── services/             # api.ts (fetch wrapper) + one file per API area
        ├── context/              # AuthContext, ToastProvider
        ├── schemas/              # Zod mirrors of server schemas
        └── lib/                  # error mapping, datetime helpers
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Docker (PostgreSQL + Redis)

### 1. Environment

```bash
cp server/.env.example server/.env
# edit server/.env — DATABASE_URL must match the POSTGRES_* values
```

> **Containers:** this project uses `surl-postgres` (host port **5433**) and `surl-redis` (host port **6380**). Don't reuse another project's containers on 5432/6379.

### 2. Start the databases

```bash
docker compose -f server/docker-compose.yml up -d
docker compose -f server/docker-compose.yml ps   # both should be healthy
```

### 3. Migrate (and optionally seed)

```bash
cd server
npm install
npm run db:migrate

# optional demo data
npm run db:seed:demo                       # demo users + links + clicks
npm run db:seed:admin -- admin@example.com change-me
```

### 4. Bootstrap the first admin

Registration always creates `role: "user"` — promoting the first admin is **CLI-only** (by design; there is no API route that can grant admin):

```bash
cd server
npm run admin:promote -- you@example.com admin
```

### 5. Run in dev (two terminals)

```bash
cd server && npm run dev    # API → http://localhost:3000
cd client && npm run dev    # UI → http://localhost:5173
```

Health check: `curl http://localhost:3000/healthz` → `{"status":"ok"}`

---

## Environment Variables

Defined in `server/.env` (see `server/.env.example` for inline docs).

| Key                                                   | Purpose                               | Notes                                 |
| ----------------------------------------------------- | ------------------------------------- | ------------------------------------- |
| `NODE_ENV`                                            | `development` / `test` / `production` | default `development`                 |
| `PORT`                                                | API port                              | default `3000`                        |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Compose container credentials         | must match `DATABASE_URL`             |
| `POSTGRES_PORT`                                       | Host port → container 5432            | `5433` here                           |
| `DATABASE_URL`                                        | Drizzle connection string             | required                              |
| `DATABASE_SSL` / `DATABASE_POOL_MAX`                  | Pool behavior                         | pool default `10`                     |
| `REDIS_PASSWORD` / `REDIS_PORT` / `REDIS_URL`         | Redis auth + address                  | `6380` here                           |
| `CLICK_SYNC_INTERVAL_MS`                              | Redis→PG click flush cadence          | default `1000`, min `1000`            |
| `JWT_SECRET`                                          | Token signing key                     | required; `openssl rand -hex 64`      |
| `JWT_EXPIRES_IN`                                      | Token lifetime                        | e.g. `1h`, `7d`                       |
| `SHORT_URL_BASE`                                      | Base for returned `shortUrl`          | e.g. `http://localhost:3000`          |
| `FRONTEND_URL`                                        | Where expired links redirect          | `/expired?code=…`; unset → `410` JSON |

Env is validated with Zod at boot (`server/src/config/env.ts`) — the server exits immediately on missing/invalid config.

---

## API Overview

Base URL: `http://localhost:3000`. Auth: `Authorization: Bearer <token>` (from `POST /api/auth/login`).

### Auth — `/api/auth`

| Method | Path        | Auth | Description                             |
| ------ | ----------- | ---- | --------------------------------------- |
| POST   | `/register` | —    | Create account (returns user, no token) |
| POST   | `/login`    | —    | Returns `{ token, user }`               |
| GET    | `/me`       | ✔    | Current user (incl. `plan`)             |

### Links — `/api/links` _(all require auth)_

| Method | Path                | Description                                                |
| ------ | ------------------- | ---------------------------------------------------------- |
| POST   | `/`                 | Create short link — alias conflicts → `409`, quota → `402` |
| GET    | `/?page=&pageSize=` | Paginated list (`pageSize` ≤ 100)                          |
| PUT    | `/:id`              | Update target/expiry (invalidates cache)                   |
| DELETE | `/:id`              | Delete link (invalidates cache)                            |

### Redirect — `/` _(public)_

| Method | Path     | Description                                                             |
| ------ | -------- | ----------------------------------------------------------------------- |
| GET    | `/:code` | `302` to target · expired → `302` `/expired` or `410` · unknown → `404` |

### Stats — `/api/stats` _(all require auth)_

| Method | Path               | Description                                     |
| ------ | ------------------ | ----------------------------------------------- |
| GET    | `/overview?days=`  | Totals + zero-filled daily series + top 5 links |
| GET    | `/links/:id?days=` | Per-link detail (ownership enforced)            |

### Billing — `/api/billing`

| Method | Path            | Auth | Description                                    |
| ------ | --------------- | ---- | ---------------------------------------------- |
| GET    | `/plans`        | —    | Plan catalog                                   |
| GET    | `/subscription` | ✔    | Plan, expiry, alias usage/limit                |
| POST   | `/checkout`     | ✔    | Simulated purchase → extends `plan_expires_at` |
| GET    | `/payments`     | ✔    | Payment history                                |

### Admin — `/api/admin` _(all require `role: "admin"`, re-checked per request)_

| Method | Path                   | Description                                               |
| ------ | ---------------------- | --------------------------------------------------------- |
| GET    | `/users?search=&page=` | Paginated users                                           |
| PATCH  | `/users/:id`           | Set role — guards: `CANNOT_CHANGE_OWN_ROLE`, `LAST_ADMIN` |
| DELETE | `/users/:id`           | Delete user + links (guard: `LAST_ADMIN`)                 |
| GET    | `/links?search=&page=` | All links                                                 |
| DELETE | `/links/:id`           | Delete any link (cache invalidated)                       |
| GET    | `/overview?days=`      | Global stats                                              |

**Error envelope** (all non-2xx):

```json
{
  "error": {
    "message": "Human-readable",
    "code": "MACHINE_CODE",
    "details": []
  }
}
```

Codes the client maps to UI: `VALIDATION_ERROR` → field errors, `ALIAS_TAKEN` / `ALIAS_LIMIT_REACHED` → alias field, `UNAUTHORIZED`, `LINK_EXPIRED`, `LAST_ADMIN`, …

---

## Database

| Table         | Purpose                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `users`       | Accounts: email, bcrypt hash, `role` (`user`/`admin`), `plan`, `plan_expires_at`                                |
| `urls`        | Short links: `short_code` (**UNIQUE**), `original_url`, FK `user_id`, `clicks`, `is_custom_alias`, `expires_at` |
| `click_daily` | `(url_id, day)` buckets — chart source; upserted during flush                                                   |
| `payments`    | Checkout records: amount, status, resulting `plan_expires_at`                                                   |

Schema: `server/src/db/schema.ts` · migrations: `server/migrations/` (Drizzle, `npm run db:generate` / `db:migrate`)

---

## Scripts & Quality Gates

### Server (`server/`)

| Command                                                     | Purpose                                    |
| ----------------------------------------------------------- | ------------------------------------------ |
| `npm run dev`                                               | API with watch (`tsx watch`)               |
| `npm run typecheck`                                         | `tsc --noEmit` — **run before committing** |
| `npm run build` / `start`                                   | Compile / run `dist/`                      |
| `npm run db:generate`                                       | Generate migration from schema diff        |
| `npm run db:migrate`                                        | Apply migrations                           |
| `npm run db:check`                                          | Migration drift check                      |
| `npm run db:seed:demo` / `db:seed:admin` / `db:seed:clicks` | Demo data                                  |
| `npm run admin:promote`                                     | Set a user's role from the CLI             |

### Client (`client/`)

| Command         | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `npm run dev`   | Vite dev server (:5173)                            |
| `npm run lint`  | oxlint                                             |
| `npm run build` | `tsc -b && vite build` — **run before committing** |

---
