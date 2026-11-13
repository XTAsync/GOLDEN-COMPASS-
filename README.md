<p align="center">
  <img src="assets/logo.svg" alt="GOLDEN-COMPASS- logo" width="180" />
</p>

# Golden Compass

Kenya-focused retail investment platform by Axiom. Analyse + Demo mode: real payments and real investing stay disabled until compliance sign-off.

## Stack

- TanStack Start (React 19, Vite, Nitro), deployed on Vercel
- Supabase (Postgres, Auth, Realtime) in our own account
- M-Pesa Daraja (STK push, B2C), Finnhub / mystocks.africa for market data
- Gemini for the education assistant (off until safety tests pass)

No third-party app builder or hosted backend sits between us and the code. The database is plain Postgres, so `pg_dump` moves it anywhere.

## Setup

```bash
npm install
cp .env.example .env      # fill in Supabase keys, GEMINI_API_KEY, M-Pesa sandbox keys
npm run dev
```

Checks: `npm run typecheck`, `npm test`, `npm run test:sql`, `npm run build`.

## Database

All schema lives in `supabase/migrations/` (apply in filename order). Money moves only through atomic SECURITY DEFINER functions with row locks and an audit ledger. SQL tests are in `supabase/tests/`.

## Docs

- `roadmap.md`: ordered upgrade checkpoints
- `docs/PRODUCTION_READINESS.md`: audit and resumable checklist
- `docs/GO_LIVE_CHECKLIST.md`: owner actions before real money
