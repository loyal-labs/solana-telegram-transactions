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
- `DATABASE_URL` (required for `sync:once`)

## Optional environment variables

- `TELEGRAM_USERBOT_ACCOUNT_KEY` (default: `primary`)
- `USERBOT_STORAGE_DIR` (default: `/var/data/userbot`)
- `TELEGRAM_USERBOT_PHONE` (used by `auth:bootstrap` as default phone)
- `TELEGRAM_USERBOT_BOT_TOKEN` (preferred bot auth token)
- `ASKLOYAL_TGBOT_KEY` (fallback bot auth token, compatible with app env)

## Commands

Run from `workers/userbot`.

```bash
bun install
bun run auth:bootstrap
bun run auth:status
bun run auth:clear
bun run sync:once
bun run start
```

`auth:bootstrap` auto-selects login mode:

- If `TELEGRAM_USERBOT_BOT_TOKEN` (or `ASKLOYAL_TGBOT_KEY`) is set, it signs in as a bot without phone/code prompts.
- Otherwise, it uses interactive user login (phone/code/2FA).

`sync:once` supports optional recovery flags:

- `--parser-types=userbot` (default)
- `--parser-types=bot,userbot` (include activated bot-parser communities)
- `--lookback-days=2` (scan history for previous full UTC days)
- `--chat-ids=-100123,-100456` (scope to specific chat IDs)
- `--dialog-sync-only` (or `--dialogue-sync-only`) to run discovery/import only and skip message ingestion

`sync:once` also auto-discovers group/supergroup dialogs when running in user auth mode.
Missing chats are inserted into `communities` with `parserType=userbot` and inactive defaults:
`isActive=false`, `isPublic=false`, `summaryNotificationsEnabled=false`,
`summaryNotificationTimeHours=null`, `summaryNotificationMessageCount=null`.

## Render operational flow

1. Mount persistent disk and set `USERBOT_STORAGE_DIR=/var/data/userbot`.
2. Run one-time `bun run auth:bootstrap` in the worker service environment.
3. Start service with `bun run start`.
4. Keep replicas at `1` per `TELEGRAM_USERBOT_ACCOUNT_KEY`.

## Notes

- Session files are account-scoped: `mtcute-<account-key>.sqlite`.
- `auth:clear` removes `sqlite`, `-wal`, `-shm`, and `-journal` files for the active account key.
