# Golden Compass loop queue (reconciled with docs/PRODUCTION_READINESS.md and roadmap.md, 2026-11-26)
# Format: - [ ] ID | title | acceptance criteria | risk:low|high [max-files:N]
# The LOOP SCRIPT ticks [x] done / [!] blocked. risk:high stops the loop for a human.
# Humans: tick a risk:high task yourself ([x]) after doing it, or move it down the list.

- [x] T01 | Fix the 5 existing eslint errors (Sparkline conditional useId hook; explicit any in kyc.tsx, money-client.ts, useNotifications.tsx, Sparkline.tsx) | eslint errors 5 -> 0; typecheck, tests, build pass; no behaviour change | risk:low max-files:6
- [x] T02 | Unit tests for fee and limit math (fees.server.ts, limits.server.ts) without editing them | new *.test.ts files only; cover boundaries, zero, rounding of Math.floor payout | risk:low max-files:6
- [x] T03 | Unit tests for money-client and phone helpers edge cases | new tests only; no source change | risk:low max-files:6
- [x] T04 | Roadmap 3: shared accessible UI primitives audit: focus rings, aria labels, contrast tokens on buttons, inputs, dialogs | no new dependency; tests or a11y assertions added where practical | risk:low max-files:30
- [x] T05 | Roadmap 5: tested chart indicators (SMA, EMA, RSI, MACD, Bollinger, VWAP, ATR, stochastic) as pure functions | src/lib/indicators.ts plus tests; no UI wiring | risk:low max-files:8
- [x] T06 | Roadmap 4: market data provider interface + mock provider + watchlist types | interfaces and mock only, no network calls | risk:low max-files:10
- [x] T10 | P1: durable rate limiter for money endpoints (replace in-memory Map) | needs DB design + human review | risk:high
- [x] T11 | P1: server-side audit log writes (remove browser audit insert in admin.kyc.tsx) | touches RLS and KYC flow | risk:high
- [x] T12 | Deposit race: store mpesa_checkout_id before STK push; reconciliation job for stuck processing/pending rows | money flow | risk:high
- [ ] T13 | Decide net payout rounding (Math.floor leaves up to KES 0.99 unpaid) | product decision | risk:high
- [x] T14 | P2: untrack .env, add .env.example; delete stray npm-publish workflow | protected paths | risk:high
- [ ] T15 | M-Pesa go-live: set MPESA_CALLBACK_SECRET, Mike's compliance sign-off, broker credentials | owner actions | risk:high
