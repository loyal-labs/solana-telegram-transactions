# passkey

Standalone Next.js workspace for Squads Grid passkey WebAuthn flows shared across
`askloyal.com` and all `*.askloyal.com` subdomains.

## What this workspace owns

- Passkey session endpoints proxying (`create`, `authorize`, `submit`)
- Passkey account endpoints proxying (`create`, `find`, `get`)
- Browser ceremony pages for `/continue`, `/create`, and `/auth`
- Embedded passkey modal flow used by `/frontend` via iframe + `postMessage`
- Request-host-aware Grid forwarding (origin/cookie passthrough)
- Explicit WebAuthn RP ID resolution for shared subdomain credentials
- Cookie-backed auth session issuance for both email and passkey sign-in

## Environment

Copy `.env.example` to `.env.local`:

```bash
GRID_ENVIRONMENT=sandbox
GRID_ALLOWED_PARENT_DOMAIN=askloyal.com
GRID_ALLOW_LOCALHOST=true
GRID_RP_ID=askloyal.com
NEXT_PUBLIC_GRID_RP_ID=askloyal.com
GRID_API_BASE_URL=https://grid.squads.xyz
GRID_APP_NAME=askloyal
```

Optional:

```bash
GRID_API_KEY=<grid_api_key>
```

## Host and RP behavior

- `askloyal.com` and any `*.askloyal.com` host are allowed.
- All allowed `askloyal.com` hosts share the RP ID `askloyal.com`, so one
  passkey can be reused across those subdomains.
- `localhost` is supported as a separate dev-only passkey realm when
  `GRID_ALLOW_LOCALHOST=true`.
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

## Auth session model

This workspace is the shared auth-domain for Loyal Grid sign-in.

- `/api/auth/session` returns a generic auth principal, not an email-only shape
- `/api/auth/logout` clears the shared auth session cookie
- `POST /api/passkeys/session/submit` writes the same auth session cookie after a
  successful passkey submit
- the cookie name remains `loyal_email_session` for backward compatibility, even
  though the session now supports both `authMethod: "email"` and
  `authMethod: "passkey"`

## Embedded modal flow

`/frontend` does not reimplement WebAuthn logic. Instead it:

1. starts passkey sign-in against this auth domain
2. loads the returned `/continue?...&embed=1&autostart=1` URL in an iframe
3. waits for a typed `postMessage` event from this workspace
4. refreshes `/api/auth/session` and closes the modal on success

In embed mode, `/continue` posts one of:

- `authz_complete`
- `authz_error`

## Package boundary

Reusable runtime-agnostic Grid contracts, error helpers, auth-domain client
helpers, and direct server-client construction now live in
[`packages/grid-core/`](../packages/grid-core). This workspace keeps only the
custom-domain auth boundary:

- request host allowlisting
- RP ID resolution
- browser WebAuthn ceremony pages
- embedded passkey orchestration for modal flows
- Grid upstream proxy handlers
- passkey redirect/query parsing
- auth flow orchestration
