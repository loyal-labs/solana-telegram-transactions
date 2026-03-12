# @loyal-labs/shared

Small cross-workspace types that are not specific to one integration domain.

## What belongs here

- summary DTOs shared by `app` and `mobile`
- other generic cross-app types that do not deserve their own package

## What does not belong here

- Grid SDK wrappers
- passkey auth helpers
- browser/WebAuthn flow utilities
- server config or framework-specific code

Grid-specific code now lives in `@loyal-labs/grid-core`.
