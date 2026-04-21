# Backlog (Completed vs Remaining)

## Completed in MVP production-readiness pass

- [x] Baseline workspace lint/format/test automation and CI wiring.
- [x] Health endpoints across all core services.
- [x] Gateway structured request logging + correlation IDs.
- [x] Gateway sensitive-route rate limiting.
- [x] Sentry wiring placeholders/config pattern for safe opt-in.
- [x] Runtime-editable tenant settings + fitment reference management.
- [x] PostgreSQL-first search endpoints + Meilisearch projection scaffold.
- [x] Notification templates with retryable async job flow and local/Resend adapters.
- [x] Stripe test-mode SaaS subscription billing flow with idempotent webhook handling.
- [x] Rich South African seed data for realistic demos.
- [x] MVP happy-path end-to-end integration test coverage.

## Remaining (post-MVP hardening)

### Platform & Security

- [ ] Centralized secrets management policy and rotation runbook.
- [ ] Service-to-service auth hardening beyond shared internal token.
- [ ] Formal API versioning + backward-compatibility policy.

### Data & Reliability

- [ ] Transactional outbox + durable queues for cross-service side effects.
- [ ] Strong idempotency keys for all write-heavy public endpoints.
- [ ] DB migration rollback drills and backup/restore rehearsal.

### Observability

- [ ] Real Sentry SDK integration in each service with uniform tags.
- [ ] Metrics/alerts (latency, error rate, queue retries, webhook lag).
- [ ] Distributed tracing beyond correlation IDs.

### Product Workflows

- [ ] Full order state machine service implementation (beyond scaffold).
- [ ] Buyer checkout/payments domain separation from SaaS billing.
- [ ] Notification preferences and delivery analytics.

### Quality & Delivery

- [ ] Broader E2E matrix (negative paths, failure injection, retries/timeouts).
- [ ] Performance/load test baseline for gateway + catalog/search.
- [ ] Staging environment parity checklist and release gates.
