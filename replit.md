# Famme Performance

A Next.js 14 fitness/performance tracking web app in a yarn monorepo.

## Project Structure

- `apps/web/` — Next.js 14 app (App Router, TypeScript)
- `apps/mobile/` — Expo React Native mobile app
- Root monorepo managed with yarn workspaces

## Running the App

The web app runs via the "Start application" workflow:
- Command: `yarn workspace @famme/web dev`
- Port: **5000** (bound to 0.0.0.0 for Replit compatibility)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database ORM**: Prisma + PostgreSQL
- **Auth**: JWT (jose) with access + refresh tokens
- **AI**: Anthropic Claude SDK
- **Payments**: Stripe
- **Integrations**: Garmin webhooks

## Environment Variables Required

See `apps/web/.env.example` for all required variables:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET` — JWT signing secret (generate with `openssl rand -base64 64`)
- `JWT_REFRESH_SECRET` — JWT refresh signing secret
- `ANTHROPIC_API_KEY` — Anthropic Claude API key
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook secret
- `STRIPE_PRICE_PRO` — Stripe price ID for Pro plan
- `STRIPE_PRICE_ELITE` — Stripe price ID for Elite plan
- `GARMIN_WEBHOOK_SECRET` — Garmin HMAC webhook secret
- `NEXT_PUBLIC_APP_URL` — Public URL of the app

## Replit Compatibility Notes

- `output: "standalone"` removed from next.config.mjs (not needed for dev server)
- Dev/start scripts updated to bind to port 5000 on 0.0.0.0
- Yarn monorepo with workspaces for web + mobile apps
