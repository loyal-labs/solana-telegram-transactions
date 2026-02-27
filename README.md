# loyal-admin

## Online

https://loyal-admin-zeta.vercel.app/

Auth credentials are stored in 1Password (`loyal-admin`).

## Local Development

1. `bun i`
2. Set `DATABASE_URL` in `.env.local` (use 1Password or Vercel env values for `solana-telegram-transactions`)
3. `bun dev`

## Sync DB Schema

Use Drizzle pull to generate an up-to-date schema snapshot from the live database.

Prerequisite:
- `DATABASE_URL` must be set in your environment (typically `.env.local`)

Commands:
- `bun run db:schema:pull`
- `bunx drizzle-kit pull --config=drizzle.config.ts`

Generated output:
- `src/lib/generated/*`

Note:
- `bun run db:schema:pull` regenerates the authoritative runtime schema in `src/lib/generated/schema.ts`.
- `src/lib/generated/schema.ts` is the source of truth for DB shape and should be used by app code.
