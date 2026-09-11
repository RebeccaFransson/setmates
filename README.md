# Setmates

A shared gym-progress tracker for a small, closed group — a couple, or a few training
partners. Log your sessions, see what you lifted last time before you type, and see your
partner's training in a feed.

Expo (React Native) + Supabase.

## Status

Building **Milestone 1 (MVP)** — see [`docs/SPEC-MVP.md`](docs/SPEC-MVP.md).
The eventual product is described in [`docs/SPEC-FULL.md`](docs/SPEC-FULL.md); nothing in
that file is in scope yet.

## Getting started

```bash
npm install
cp .env.example .env          # fill in the two Expo public vars below
supabase start                # local Postgres + Auth on Docker
supabase db reset             # applies migrations + seeds the global exercise library
npx expo start
```

Environment variables:

| Name                            | Where to find it                                    |
| ------------------------------- | --------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | `supabase status` locally, or the project dashboard |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | same                                                |
| `SUPABASE_SERVICE_ROLE_KEY`     | optional, only needed for `npm run seed:demo`       |

## Tests

```bash
npm test               # unit tests — lib/metrics.ts
supabase test db       # row-level security policies
npm run lint
npm run typecheck
```

The RLS suite is the important one: it is the only thing standing between one group's
training data and another's.

## Seeding

- `supabase db reset` loads the schema migrations and runs [`supabase/seed/001_global_exercises.sql`](supabase/seed/001_global_exercises.sql).
- `npm run seed:demo` is an optional helper that expects a local Supabase stack plus a service-role key; it prints guidance when those are missing.

## Layout

```text
app/         Expo Router routes
components/  presentational and workout input components
lib/         metrics.ts (all stats maths), supabase.ts, units.ts
supabase/    migrations, seed data, RLS tests
docs/        SPEC-MVP.md (build this) · SPEC-FULL.md (context only)
```
