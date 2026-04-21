# Runbook

## Goal

Run the full MVP locally, validate health and happy paths, and quickly troubleshoot common failures.

## Prerequisites

- Docker + Docker Compose plugin
- Node.js 20+
- npm 10+

## Local Startup (MVP)

1. Copy env template:
   - `cp .env.docker.example .env.docker`
2. Install dependencies:
   - `npm install`
3. Start full stack:
   - `npm run stack:up`
4. Verify health:
   - API Gateway: `curl http://localhost:4000/health`
   - Identity: `curl http://localhost:4001/health`
   - Tenant: `curl http://localhost:4002/health`
   - Vendor: `curl http://localhost:4003/health`
   - Catalog: `curl http://localhost:4004/health`
   - Inventory: `curl http://localhost:4005/health`
   - Order: `curl http://localhost:4006/health`
   - Billing: `curl http://localhost:4007/health`
   - Notification: `curl http://localhost:4008/health`
   - Search: `curl http://localhost:4009/health`
5. Open supporting tools:
   - PostgreSQL: `localhost:5432`
   - Redis: `localhost:6379`
   - Meilisearch: `http://localhost:7700`
   - MailHog UI: `http://localhost:8025`

## Verification Commands (CI-equivalent)

- `npm run lint`
- `npm run typecheck`
- `npm run test`

## Common Failures & Troubleshooting

### 1) Identity/gateway auth calls fail (`403` / `503`)

- Symptoms: `/api/protected/*` returns `Authorization context denied` or `Identity service unavailable`.
- Checks:
  - `curl http://localhost:4001/health`
  - confirm `IDENTITY_SERVICE_URL` is reachable from gateway container.
- Fix:
  - `npm run stack:down && npm run stack:up`
  - inspect logs: `npm run stack:logs | grep -E "api-gateway|identity-service"`.

### 2) Rate limiting on sensitive gateway routes (`429`)

- Symptoms: `/api/protected/me` or tenant/vendor protected endpoints get `429`.
- Cause: sensitive-route limiter in gateway.
- Fix:
  - reduce request burst in clients/tests,
  - or tune `GATEWAY_SENSITIVE_RATE_LIMIT` in `.env.docker` for local load testing.

### 3) Billing webhook sync does not update tenant state

- Symptoms: webhook returns success but tenant billing state unchanged.
- Checks:
  - `INTERNAL_SERVICE_TOKEN` is consistent across billing + tenant services.
  - `TENANT_SERVICE_URL` points to tenant service.
- Fix:
  - restart billing + tenant services,
  - replay webhook in local tests or via `curl`.

### 4) Notification jobs stuck or failing retries

- Symptoms: jobs remain `retrying`/`failed`.
- Checks:
  - Local mode: `MAIL_SINK_URL` reachable (optional).
  - Resend mode: `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` present.
- Fix:
  - use local mode for development (`EMAIL_PROVIDER=local`),
  - inspect `/notifications/jobs/:jobId` for attempts/error.

### 5) Search results empty in local demos

- Symptoms: `/search` returns empty groups.
- Checks:
  - ensure seed data loaded,
  - tenant ID matches seeded tenant context.
- Fix:
  - rerun migrations + seed: `npm run db:migrate && npm run db:seed`.

## Operational Notes

- Sentry wiring is placeholder-enabled through env (`SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`) and intentionally safe when unset.
- Correlation IDs are propagated via `x-correlation-id` by gateway middleware for request tracing.
- Seed data includes two SA demo shops, multiple vendors, fitment-rich catalog records, low-stock examples, multi-vendor orders, billing states, and notification/audit traces.
