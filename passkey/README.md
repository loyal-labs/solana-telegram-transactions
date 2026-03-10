# passkey

Standalone Next.js workspace for Squads Grid passkey WebAuthn flows shared across
`askloyal.com` and all `*.askloyal.com` subdomains.

## What this workspace owns

- Passkey session endpoints proxying (`create`, `authorize`, `submit`)
- Passkey account endpoints proxying (`create`, `find`, `get`)
- Browser ceremony pages for `/continue`, `/create`, and `/auth`
- Request-host-aware Grid forwarding (origin/cookie passthrough)
- Explicit WebAuthn RP ID resolution for shared subdomain credentials

## Environment

Copy `.env.example` to `.env.local`:

```bash
PASSKEY_GRID_ENVIRONMENT=sandbox
PASSKEY_ALLOWED_PARENT_DOMAIN=askloyal.com
PASSKEY_ALLOW_LOCALHOST=true
NEXT_PUBLIC_PASSKEY_RP_ID=askloyal.com
PASSKEY_GRID_API_BASE_URL=https://grid.squads.xyz
PASSKEY_APP_NAME=askloyal
```

Optional:

```bash
PASSKEY_GRID_API_KEY=<grid_api_key>
```

## Host and RP behavior

- `askloyal.com` and any `*.askloyal.com` host are allowed.
- All allowed `askloyal.com` hosts share the RP ID `askloyal.com`, so one
  passkey can be reused across those subdomains.
- `localhost` is supported as a separate dev-only passkey realm when
  `PASSKEY_ALLOW_LOCALHOST=true`.
- `localhost` passkeys do not work on `askloyal.com`, and `askloyal.com`
  passkeys do not work on `localhost`.
- Unrelated root domains and `127.0.0.1` are not supported by this workspace.

The proxy derives `baseUrl` from the incoming request origin for allowed hosts,
so `app.askloyal.com` and `admin.askloyal.com` each get their own callback base
URL while still sharing the same WebAuthn RP ID.

## Commands

```bash
bun dev
bun run build
bun run lint
bun test
```

## API Surface

- `POST /api/passkeys/session/create`
- `POST /api/passkeys/session/authorize`
- `POST /api/passkeys/session/submit`
- `POST /api/passkeys/account/create`
- `POST /api/passkeys/account/find`
- `GET /api/passkeys/account/:passkeyAddress`
