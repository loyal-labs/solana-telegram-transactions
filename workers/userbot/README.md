# Userbot Worker (mtcute)

Standalone worker package for Telegram userbot foundations.

## What this package does

- Uses `@mtcute/bun`.
- Persists session state in local SQLite storage.
- Targets Render persistent disk (recommended mount: `/var/data/userbot`).
- Provides script-driven auth/bootstrap primitives.
- Runs a minimal long-lived worker with graceful shutdown.

## Required environment variables

- `TELEGRAM_USERBOT_API_ID`
- `TELEGRAM_USERBOT_API_HASH`

## Optional environment variables

- `TELEGRAM_USERBOT_ACCOUNT_KEY` (default: `primary`)
- `USERBOT_STORAGE_DIR` (default: `/var/data/userbot`)
- `TELEGRAM_USERBOT_PHONE` (used by `auth:bootstrap` as default phone)

## Commands

Run from `workers/userbot`.

```bash
bun install
bun run auth:bootstrap
bun run auth:status
bun run auth:clear
bun run start
```

## Render operational flow

1. Mount persistent disk and set `USERBOT_STORAGE_DIR=/var/data/userbot`.
2. Run one-time `bun run auth:bootstrap` in the worker service environment.
3. Start service with `bun run start`.
4. Keep replicas at `1` per `TELEGRAM_USERBOT_ACCOUNT_KEY`.

## Notes

- Session files are account-scoped: `mtcute-<account-key>.sqlite`.
- `auth:clear` removes `sqlite`, `-wal`, `-shm`, and `-journal` files for the active account key.
