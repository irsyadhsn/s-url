# surlvibe

> one-liner: URL shortener with custom aliases, expiry, click analytics, plans
> (badges optional: TS, Express, React, Postgres, Redis)

## Features — bullet list: shorten+custom alias, expiry,

                          Redis-cached 302 redirect, click analytics (per-day),
                          free/premium plans + quota, admin panel, JWT auth

## Tech Stack — two-column table (server / client):

                          Express 5 + TS + Drizzle + ioredis + Zod + bcrypt/JWT
                          React 19 + Vite + Router 7 + Tailwind 4 + Zod

## Architecture — the ASCII flow diagram (client → server layers →

                          PG/Redis) + cache-aside + Redis→PG click pipeline note
                          (reuse what we built in this session)

## Project Structure — trimmed tree: server/src/{modules,middleware,db,jobs},

                          client/src/{pages,components,hooks,services,context}

## Getting Started

### Prerequisites — Node ≥20, Docker

### 1. Clone & env — cp server/.env.example server/.env (⚠️ don't touch

                          other projects' containers; compose file is server/docker-compose.yml)

### 2. Start DB — docker compose -f server/docker-compose.yml up -d

                          (surlvibe-postgres :5433, surlvibe-redis :6380)

### 3. Migrate & seed — npm run db:migrate; optional db:seed:admin / db:seed:demo

### 4. Run dev — server: npm run dev (:3000) | client: npm run dev (:5173)

### 5. Bootstrap admin — npm run admin:promote -- <email> admin

## Environment Variables — table from .env.example (key → purpose → default),

                          secrets marked "generate: openssl rand -hex 64"

## API Overview — table of endpoints (method, path, auth, purpose)

                          ~25 routes across auth/links/redirect/stats/billing/admin
                          + error envelope { error: { message, code, details? } }

## How It Works — short sections with the flows we walked through:

### Creating a short link (form → Zod → JWT → service → PG → 201)

### Redirect & cache (cache-aside, 302, 410/expired page)

### Click tracking (Redis INCR → 1s flush → urls.clicks + click_daily)

## Database — table list (users, urls, click_daily, plans, payments)

                          + key constraint: urls_short_code_unique

## Scripts & Quality Gates — npm scripts tables (server + client),

                          typecheck / lint / build commands

## Documentation — link to docs/SERVICE_FLOWS.md

## License — ? (none exists; omit or ask)
