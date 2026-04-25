# db-utils

Database utilities package for PostgreSQL schema management.

## Migration tool

This repo uses **node-pg-migrate** for SQL-first migration management in a Node-friendly monorepo workflow.

## Commands

From repo root (requires `DATABASE_URL`):

- `npm run db:migrate`
- `npm run db:migrate:down`
- `npm run db:seed`

Or directly from this package:

- `npm run db:migrate`
- `npm run db:migrate:down`
- `npm run db:seed`
