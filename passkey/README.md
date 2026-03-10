# passkey

Standalone Next.js workspace for Squads Grid passkey WebAuthn proxy flow on a custom domain.

## What this workspace owns

- Passkey session endpoints proxying (`create`, `authorize`, `submit`)
- Passkey account endpoints proxying (`create`, `find`, `get`)
- Minimal browser ceremony pages for `create` and `auth`
- Custom-domain forwarding requirements (cookies/origin passthrough)

## Environment

Copy `.env.example` to `.env.local`:

```bash
PASSKEY_GRID_ENVIRONMENT=sandbox
PASSKEY_CUSTOM_DOMAIN_BASE_URL=https://passkey.example.com
PASSKEY_GRID_API_BASE_URL=https://grid.squads.xyz
PASSKEY_APP_NAME=askloyal
```

Optional:

```bash
PASSKEY_GRID_API_KEY=<grid_api_key>
```

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
