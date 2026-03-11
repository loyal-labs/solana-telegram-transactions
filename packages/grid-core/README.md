# @loyal-labs/grid-core

Runtime-agnostic Grid helpers for Loyal apps.

## What belongs here

- Grid server client construction
- auth-domain URL/client helpers
- shared Grid request contracts
- normalized error parsing

## What does not belong here

- WebAuthn ceremony code
- Grid redirect/query parsing
- browser Grid singletons
- host/RP resolution
- framework-specific route handlers

Those passkey-flow concerns stay in the `passkey` workspace.

## Public interfaces

- `@loyal-labs/grid-core`
- `@loyal-labs/grid-core/auth`
- `@loyal-labs/grid-core/server`
- `@loyal-labs/grid-core/types`

## Environment contract

This package never reads `process.env` directly.

Typical usage:

```ts
import { createGridAuthClient } from "@loyal-labs/grid-core/auth";
import { createGridServerClient } from "@loyal-labs/grid-core/server";

const authClient = createGridAuthClient({
  authBaseUrl: "https://auth.askloyal.com",
});

const serverClient = createGridServerClient({
  environment: "sandbox",
  apiKey: "server-api-key",
  baseUrl: "https://grid.squads.xyz",
});
```
