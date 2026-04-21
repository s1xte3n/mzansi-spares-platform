# Architecture overview (initial)

## Product context

- Multi-tenant SaaS marketplace admin system for South African car spares shops.
- Roles: platform admin, tenant admin/staff, vendor admin/staff.

## Core domains

- Tenants, vendors, catalog, fitment, inventory, orders, billing, notifications, search.

## Services (early split)

- `api-gateway`: request routing and cross-cutting concerns.
- Domain services: identity, tenant, vendor, catalog, inventory, order, billing, notification.
- `search-sync-service`: keeps search projections/indexes in sync.
- `fastapi-service`: Python-heavy capabilities (optional/gradual).

## Data and infra

- PostgreSQL primary data store.
- Redis limited to queues/rate limiting/cache invalidation.
- Search starts in PostgreSQL; Meilisearch remains optional.
