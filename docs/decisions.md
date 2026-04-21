# Architecture Decision Records (ADRs)

## ADR-001: Split Services Early

- **Status**: Accepted
- **Date**: 2026-04-20
- **Decision**: Start with domain-oriented service boundaries from the beginning rather than a modular monolith.
- **Rationale**: Domains (catalog, inventory, orders, billing, tenants, vendors) have different scaling, release cadence, and ownership needs.
- **Consequences**:
  - Clear team ownership and deployment paths.
  - Added operational complexity (service discovery, contracts, observability).

## ADR-002: Clerk for Authentication + DB-Driven Authorization Context

- **Status**: Accepted
- **Date**: 2026-04-20
- **Decision**: Use Clerk for identity/authentication; keep authorization context in platform DB.
- **Rationale**: Externalized auth reduces undifferentiated work, while DB-driven roles/membership supports tenant/vendor-specific rules.
- **Consequences**:
  - Need robust identity sync and claim/context hydration.
  - Authorization logic remains under product control.

## ADR-003: PostgreSQL as Source of Truth

- **Status**: Accepted
- **Date**: 2026-04-20
- **Decision**: Persist core business state in PostgreSQL.
- **Rationale**: Strong transactional guarantees and mature tooling support fitment, stock, and order consistency needs.
- **Consequences**:
  - Must invest in schema governance, indexing, migrations, and query performance.

## ADR-004: Meilisearch as Projection Only

- **Status**: Accepted
- **Date**: 2026-04-20
- **Decision**: Treat Meilisearch as a derived projection, not authoritative storage.
- **Rationale**: Avoid dual-write consistency issues and keep source-of-truth semantics clear.
- **Consequences**:
  - Search sync and rebuild tooling required.
  - Temporary search lag is tolerated with defined SLOs.

## ADR-005: Single Stock Pool Inventory Model

- **Status**: Accepted
- **Date**: 2026-04-20
- **Decision**: Use a single stock pool model per tenant for initial releases.
- **Rationale**: Reduces complexity and accelerates operational rollout for most target shops.
- **Consequences**:
  - Advanced multi-warehouse allocation deferred.
  - Must preserve extension points for later stock segmentation.

## ADR-006: Stripe Only for Tenant SaaS Billing

- **Status**: Accepted
- **Date**: 2026-04-20
- **Decision**: Use Stripe solely for tenant subscription billing in platform SaaS context.
- **Rationale**: Keeps billing domain focused and avoids scope creep into marketplace payment processing.
- **Consequences**:
  - Revenue and subscription logic centralized in billing service.
  - Non-SaaS payment flows remain out of scope unless explicitly approved.

## ADR-007: Runtime-Editable Reference Data and Settings in PostgreSQL

- **Status**: Accepted
- **Date**: 2026-04-20
- **Decision**: Store business reference data/settings in PostgreSQL and expose admin workflows for runtime updates.
- **Rationale**: Business users need to adapt fitment, pricing rules, and operational settings without deployments.
- **Consequences**:
  - Requires validation, audit logging, and safe rollout semantics.
  - Cache invalidation/eventing must reflect setting changes promptly.
