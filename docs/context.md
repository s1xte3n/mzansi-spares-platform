# Project Context

## Purpose

`mzansi-spares-platform` is a multi-tenant SaaS platform built for car spares shops in South Africa. The platform provides operational tooling for platform operators, tenant businesses, and vendor partners.

## User Groups

- **Platform staff**: manage tenancy lifecycle, support operations, platform-level policy, and tenant billing oversight.
- **Tenant staff**: run day-to-day catalog, fitment, stock, ordering, and customer operations within their own tenant boundary.
- **Vendor users**: maintain vendor-managed catalog and inventory feeds, and collaborate on supply/order workflows.

## Core Product Capabilities

- Multi-tenant account and organization management.
- Fitment-aware catalog management (vehicles, variants, compatibility constraints).
- Inventory and stock visibility.
- Order lifecycle processing.
- Vendor management and vendor collaboration flows.
- Runtime-editable business settings and reference data.

## Operational Expectations

- Tenant-isolated data and authorization context are mandatory.
- Business data and settings must be editable in normal operation without service restarts.
- Service boundaries should support incremental scaling, ownership, and independent deployment.
- Data quality for fitment and inventory is a business-critical concern.

## Non-Goals (Current Phase)

- No deep business logic implementation in this scaffold phase.
- No hard dependency on specialized search infrastructure for initial releases.
