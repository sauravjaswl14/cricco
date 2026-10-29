# Cricket Impact

A Next.js app for managing cricket players, recording match results and ranking players by a custom **Cricket Impact Score**.

**Stack:** Next.js (App Router) · React · TypeScript · PostgreSQL + Prisma · JWT in HTTP-only cookies (`jose`) · Tailwind CSS · Vitest · Zod · Sonner (toasts)

## Getting started

```bash
npm install
cp .env.example .env        # then edit DATABASE_URL and JWT_SECRET
npx prisma migrate deploy   # creates the tables
npm run db:seed             # optional: demo admin + sample players
npm run dev
```

- `JWT_SECRET` must be at least 32 characters (the app refuses to sign tokens otherwise).
- Seeded login: `admin@example.com` / `password123` (development only).
- The **first account registered becomes ADMIN**; every account after that is a VIEWER (read-only).
- Tests: `npm test` · Type check: `npx tsc --noEmit` · Lint: `npm run lint`

## Why PostgreSQL + Prisma

- The data is relational: players have many match performances, matches belong to a recorder. Foreign keys, unique constraints (a player appears once per match) and transactions are first-class in Postgres.
- Recording a match updates several rows (match, performances, every player's career totals). That has to be all-or-nothing, so it runs in a real transaction (`src/lib/matches.ts`).
- Prisma gives typed queries and a migration history that lives in git, so the schema, the TypeScript types and the validation stay in sync. Enums (`PlayerRole`, `UserRole`) are enforced by the database as well as by TypeScript.
- SQLite would have been simpler locally, but it has no native enums and a weaker story for concurrent writes, so Postgres is the better fit for a multi-user admin tool.

## Database schema

| Model | Purpose | Key fields |
| --- | --- | --- |
| `User` | Login accounts | `email` (unique), `passwordHash` (bcrypt), `role` (`ADMIN` / `VIEWER`) |
| `Player` | A cricketer and career totals | `name`, `role` (`BATSMAN` / `BOWLER` / `ALL_ROUNDER` / `WICKETKEEPER`), `basePrice`, `matchesPlayed`, `totalRuns`, `totalWickets` |
| `Match` | One recorded game | `teamA`, `teamB`, optional `winner`, `playedAt`, `recordedById` -> `User` |
| `PlayerPerformance` | One player's numbers in one match | `matchId`, `playerId`, `runs`, `wickets`, **unique `(matchId, playerId)`** |

Design notes:

- **Career totals are stored on `Player`** and incremented when a match is recorded, rather than summed from performances on every read. The leaderboard then only needs one cheap query. The trade-off is that totals can drift if rows are edited by hand, which is why match recording is transactional and is the only code path that touches them besides the admin edit form.
- The **Impact Score is not stored.** It is derived from the stats each time, so a change to the formula never leaves stale numbers in the database.
- `PlayerPerformance` cascades on delete; `Match.recordedById` is `RESTRICT` so a user who recorded matches cannot be deleted by accident.

## Authentication

I used **hand-rolled JWT sessions stored in an HTTP-only cookie** (`jose` + `bcryptjs`) instead of NextAuth.js:

- The brief requires JWT in HTTP-only cookies, and for a single email/password credential flow that is a small amount of code that is easy to reason about end to end (`src/lib/jwt.ts`, `src/lib/session.ts`).
- `jose` uses Web Crypto, so the same `verifySessionToken` runs in `middleware.ts` on the Edge runtime. Libraries that need Node-only crypto cannot.
- The cookie is `HttpOnly` (JavaScript cannot read it, which removes the usual XSS token-theft route), `SameSite=Lax` (blocks cross-site POSTs, covering most CSRF), and `Secure` in production. The token is **never** returned in a JSON body.
- Passwords are hashed with bcrypt. Login runs a bcrypt compare even for unknown emails so response time does not reveal which accounts exist.
- Authorisation is checked in three places: `middleware.ts` (redirects `/dashboard/*` to `/login`), the dashboard layout, and again inside every API route and Server Action (`requireSession` / `getSession`), because Server Actions are public endpoints and must never rely on the page having been protected.

Note: Next.js 16 deprecates the `middleware.ts` file convention in favour of `proxy.ts` (same behaviour, new name). The brief asks for `middleware.ts`, which still works and prints a deprecation warning. Migrating is `npx @next/codemod@canary middleware-to-proxy .`.

## The Cricket Impact Score

All of the logic lives in `src/lib/impact-score.ts`.

```
effectiveRuns    = totalRuns    x 1.3  (Batsman only, otherwise x 1)
effectiveWickets = totalWickets x 1.5  (Bowler only,  otherwise x 1)
base             = effectiveRuns x 1.2 + effectiveWickets x 20
experience       = -50 if matchesPlayed < 5, +100 if matchesPlayed > 20, else 0
score            = base + experience + 30 (Wicketkeeper only)
```

Interpretation choices (the brief is slightly open here):

- "Multiply their Wickets by 1.5 **before** adding to the base score" is implemented as scaling the wickets count first, then applying the weight of 20. The Batsman run multiplier works the same way with the weight of 1.2.
- Exactly 5 matches and exactly 20 matches are **neutral**: the penalty is for _fewer than_ 5 and the bonus for _more than_ 20.
- The result is rounded to 2 decimals because `1.3 * 1.2 * 100` is `156.00000000000003` in floating point, which would otherwise leak into the UI and sorting.
- Negative or fractional inputs throw a `RangeError`.

**Wicketkeeper rule, enforced by the type system.** `ROLE_MODIFIERS` is typed so each role's modifiers are conditional literal types:

```ts
wicketsFactor: R extends "BOWLER" ? 1.5 : 1;
```

so assigning `wicketsFactor: 1.5` to `WICKETKEEPER` is a compile error. A test uses `@ts-expect-error` to prove the compiler rejects it, and the runtime test asserts the value is `1`.

Worked example (Wicketkeeper, 25 matches, 1000 runs, 4 wickets): `1000 x 1.2 = 1200`, `4 x 20 = 80` (no 1.5x), veteran `+100`, keeper `+30` -> **1410**.

## API

All routes except register/login require the session cookie. Mutations require an ADMIN. Errors are JSON: `{ "error": "...", "fields": { "totalRuns": "Total runs cannot be negative" } }`.

| Method | Route | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | Creates the account and signs in (first user = ADMIN) |
| POST | `/api/auth/login` | Verifies credentials; the JWT is set via `Set-Cookie` (HttpOnly) |
| POST | `/api/auth/logout` | Clears the cookie |
| GET / POST | `/api/players` | List (with `impactScore`) / create |
| GET / PUT | `/api/players/[id]` | Read one / update details and stats |
| POST | `/api/matches` | `{ teamA, teamB, winner?, performances: [{ playerId, runs, wickets }] }`; increments each player's matches, runs and wickets in one transaction |
| GET | `/api/leaderboard` | Ranked by impact score, highest first (ties broken by name) |

## Where the brief's "strict rules" are met

- **Server Actions:** the add/edit player forms submit through `createPlayerAction` / `updatePlayerAction` (`src/app/dashboard/players/actions.ts`) with `useActionState`.
- **React Server Components:** `src/app/dashboard/leaderboard/page.tsx` is an async Server Component that queries Prisma and ranks on the server.
- **Negative runs -> toast:** the player form has `noValidate` so a value like `-25` reaches the server action; the Zod schema rejects it ("Total runs cannot be negative"), and the form shows a Sonner toast plus an inline error while keeping what was typed. The same rule also applies in the JSON API (HTTP 400).
- **Unit tests:** `src/lib/impact-score.test.ts` (8 tests: Bowler with 0 matches, Wicketkeeper with high runs, Batsman multiplier, 4/5/20/21 match boundaries, float noise, invalid input, type-level guard) and `src/lib/validation.test.ts` (5 tests).

## Bugs found and fixed while building

1. **Every dashboard page threw "encountered uncached data during prerendering".** The starter template enabled Next 16 _Cache Components_ (`cacheComponents: true`). In that mode any request-time data (here, `cookies()` and database reads) outside a `<Suspense>` boundary is an error. All dashboard pages depend on the signed-in user, so there is nothing static to prerender; I disabled it in `next.config.ts` (commit `fix(config)`).
2. **Invalid dummy bcrypt hash in login.** The first version compared against a hand-typed placeholder hash, which is not a valid bcrypt string and so would skip the real work. It is now generated with `bcrypt.hashSync` so the timing is genuinely equalised.
3. **Float noise in scores** (`156.00000000000003`) is caught by a dedicated test and the 2-decimal rounding.
4. **Toasts covered the header** when positioned top-right; moved to bottom-right.

## Notes

- The initial migration (`prisma/migrations/20261029000000_init`) was written by hand to match `schema.prisma` because the environment this was built in could not download Prisma's migration engine. Run `npx prisma migrate dev` once on your machine to confirm there is no drift; if Prisma reports any, regenerate the migration.
- Production: set a strong random `JWT_SECRET`, serve over HTTPS (cookies are `Secure` when `NODE_ENV=production`), and run `prisma migrate deploy` as part of the release.
