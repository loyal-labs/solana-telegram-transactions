# loyal-admin

## Online

https://loyal-admin-zeta.vercel.app/

Auth credentials are stored in 1Password (`loyal-admin`).

## Local Development

1. From repo root: `bun i`
2. Set `DATABASE_URL`, `ADMIN_USER`, and `ADMIN_PASSWORD` in `admin/.env.local`
3. Start admin:
   - from root: `bun run admin:dev`
   - or from `admin/`: `bun dev`

## Database Schema

This workspace uses shared monorepo schema and Neon DB adapter packages:
- `@loyal-labs/db-core/schema`
- `@loyal-labs/db-adapter-neon`

Do not add local generated schema files under `admin/src/lib/generated`.
There is no admin `/schema` UI route; schema is sourced directly from shared packages.

## Vercel Deploy

For monorepo deploys:
- Repository: `loyal-labs/loyal-app`
- Root Directory: `admin`
- Config: `admin/vercel.json`
