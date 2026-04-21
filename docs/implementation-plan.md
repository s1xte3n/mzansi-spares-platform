# Implementation plan (scaffold phase)

## Scope for this PR

1. Create a monorepo-first directory layout for apps, shared packages, infra, and docs.
2. Add root workspace scripts for `dev`, `lint`, `typecheck`, and `test`.
3. Add minimal per-workspace placeholders only (no business logic).
4. Include a Docker-first local infra starting point (PostgreSQL + Redis).

## Planned increments after scaffold

1. **Tooling baseline**
   - Decide package manager lock-in (npm/pnpm), formatting, linting, and TS build tooling.
   - Add CI matrix for workspace commands.
2. **Frontend bootstrapping**
   - Initialize React + Vite + Tailwind + shadcn/ui in `apps/web`.
3. **Service foundations**
   - Add Express skeletons for Node services with health endpoints.
   - Add service-specific env schemas.
4. **Platform integrations**
   - Wire Clerk auth at gateway and web.
   - Stripe test mode (billing service), Resend (notification), PostHog, and Sentry.
5. **Data and messaging**
   - Establish PostgreSQL migration strategy and shared DB utilities.
   - Introduce queue/event contracts (Redis-backed workers where needed).
6. **Search strategy**
   - Start with PostgreSQL search indexes; keep Meilisearch optional behind feature flags.
