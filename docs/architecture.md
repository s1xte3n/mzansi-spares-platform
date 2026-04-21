# Architecture

## Overview

The platform is designed as a split-service monorepo with shared packages for types, logging, authorization utilities, DB helpers, events, and UI primitives.

Primary goals:

1. Enforce multi-tenant boundaries across all services.
2. Keep core writes consistent in PostgreSQL.
3. Allow business operations teams to update reference/configuration data at runtime.
4. Keep integrations (auth, billing, email, analytics, monitoring) modular.

## Service Topology (Initial)

- `apps/api-gateway`: edge API, request composition, rate limiting, auth context propagation.
- `apps/identity-service`: user/org identity sync and authorization context hydration.
- `apps/tenant-service`: tenant configuration, tenant lifecycle, tenant business settings.
- `apps/vendor-service`: vendor profiles, vendor-user management, vendor operational data.
- `apps/catalog-service`: product catalog, fitment models, compatibility rules.
- `apps/inventory-service`: stock pool, movements, availability projections.
- `apps/order-service`: order submission and lifecycle state transitions.
- `apps/billing-service`: tenant SaaS subscription and billing state (Stripe).
- `apps/notification-service`: email/event notifications (Resend + queued processing).
- `apps/search-sync-service`: projection updates to search indexes.
- `apps/fastapi-service`: optional Python-heavy workloads over time.
- `apps/web`: React/Vite web app for platform + tenant + vendor users.

## Data Architecture

- **System of record**: PostgreSQL.
- **Cache and queues**: Redis for queues, rate limiting, and cache invalidation only.
- **Search**: PostgreSQL first; Meilisearch optional as a projection read model.
- **Reference/settings data**: stored in PostgreSQL and editable at runtime.

## Multi-Tenancy and Authorization Model

- Authentication handled by Clerk.
- Authorization context resolved from database-backed roles, policies, tenant membership, and vendor links.
- Gateway and downstream services propagate `tenant_id`, actor identity, and role claims in verified context envelopes.

## Runtime Configuration Principles

- Prefer DB-driven feature flags, lookups, and business settings over static env-only configuration.
- Changes to editable business settings should become effective without process restarts.
- Audit trails must exist for sensitive setting changes.

## Cross-Cutting Integrations

- Auth: Clerk.
- Billing: Stripe (tenant SaaS subscriptions only).
- Email: Resend.
- Analytics: PostHog.
- Monitoring/Error tracking: Sentry.

## Initial PostgreSQL Schema Overview

The initial schema is migration-managed and centered on tenant isolation with `tenant_id` present on operational domain tables.

### Core entity groups

- **Identity and access**: `app_user`, `tenant_membership`, `vendor_user_membership`
- **Tenant and vendor**: `tenant`, `vendor`, `tenant_setting`
- **Catalog and fitment**: `category`, `part_brand`, `product`, `product_variant`, `product_media`, `vehicle_make`, `vehicle_model`, `vehicle_derivative`, `product_fitment`
- **Ordering and payments**: `customer_record`, `marketplace_order`, `order_item`, `order_status_history`, `payment_record`
- **Stock and auditability**: `inventory_adjustment`, `audit_log`, `webhook_event`, `support_note`

### Key business alignment

- **Multi-tenant isolation**: all tenant-owned rows carry `tenant_id`.
- **Multi-vendor orders**: each `order_item` references a `vendor_id`, allowing one order to span multiple vendors.
- **Single stock pool per variant**: inventory is modeled as append-only `inventory_adjustment` rows keyed by `product_variant_id`.
- **Runtime-editable settings and reference data**: `tenant_setting` and automotive reference entities are persisted in PostgreSQL.
- **Fitment-aware products**: `product_fitment` maps variants to make/model/derivative records.
- **Search support**: indexes are created for SKU/OEM/aftermarket and key brand/vehicle names.

### Service ownership boundaries on one cluster

A single PostgreSQL cluster is used for local simplicity, but ownership remains domain-driven:

- **identity-service**: identity/membership tables
- **tenant-service**: tenant + tenant settings
- **vendor-service**: vendor + vendor memberships
- **catalog-service**: category/product/variant/media/fitment + automotive references
- **inventory-service**: inventory adjustments
- **order-service**: customer/order/order items/status history
- **billing-service**: payment records + billing-related webhook handling
- **shared/platform concerns**: audit logs, support notes, generic webhook events

## Authentication and Internal Authorization Context (Initial)

- **Frontend (web)** uses Clerk for sign-in and session management. Protected routes are gated with Clerk `SignedIn`/`SignedOut` components.
- **API gateway** verifies Clerk authentication on protected endpoints and requests normalized auth context from identity-service.
- **identity-service** maps Clerk user ID to `app_user`, resolves `tenant_membership` + `vendor_user_membership`, and returns a normalized context payload.
- **Downstream services** consume propagated auth context (active tenant/vendor and accessible scopes) through gateway middleware.

### Normalized auth context shape

```json
{
  "user": { "id": "...", "clerkUserId": "...", "isPlatformStaff": false },
  "tenants": [{ "tenantId": "...", "role": "tenant_admin" }],
  "vendors": [{ "tenantId": "...", "vendorId": "...", "role": "vendor_admin" }],
  "activeTenantId": "...",
  "activeVendorId": "...",
  "scopes": { "isPlatformStaff": false, "tenantIds": ["..."], "vendorIds": ["..."] }
}
```
