# mzansi-spares-platform

Multi-tenant SaaS platform for car spares shops in South Africa.

## What this repository contains

This is a production-style monorepo intended for contractor-friendly, incremental delivery.

- `apps/` deployable applications and services
- `packages/` shared internal libraries
- `infra/` docker/aws infrastructure scaffolding
- `docs/` Vibe Coder project docs and delivery guidance

## Local Docker-first development

1. Copy env template:
   - `cp .env.docker.example .env.docker`
2. Start stack:
   - `npm run stack:up`
3. View logs:
   - `npm run stack:logs`
4. Stop stack:
   - `npm run stack:down`

## Workspace scripts

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

## Documentation index

- `docs/context.md`
- `docs/architecture.md`
- `docs/decisions.md`
- `docs/runbook.md`
- `docs/tasks.md`

## Database migrations and seed

Set `DATABASE_URL` first (example in `.env.docker.example`), then run:

- `npm run db:migrate`
- `npm run db:seed`

## Auth proof-of-concept endpoints

- `GET /api/protected/me` (gateway)
- `GET /api/protected/tenant/:tenantId` (tenant scope enforcement)
- `GET /api/protected/vendor/:vendorId` (vendor scope enforcement)

For local non-production testing, gateway accepts `x-dev-clerk-user-id` in development mode.
