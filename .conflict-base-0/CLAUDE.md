# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Solana Telegram Transactions enables users to deposit SOL for any Telegram username, which can later be claimed by the verified account owner. It integrates Solana smart contracts with a Telegram mini-app interface.

## Commands

### Frontend (run from `/app`)

```bash
bun dev                    # Start dev server (turbopack)
bun build                  # Production build
bun lint                   # ESLint
bun db:generate            # Generate Drizzle migrations from schema
bun db:migrate             # Apply migrations
bun db:studio              # Open Drizzle Studio GUI
```

### Smart Contracts (run from root)

```bash
anchor build               # Compile programs
anchor deploy --provider.cluster devnet     # Deploy to devnet
anchor deploy --provider.cluster localnet   # Deploy to localnet
```

### Testing Smart Contracts

Requires 3 terminals running simultaneously:

```bash
# Terminal 1: Start validator
mb-test-validator --reset

# Terminal 2: Start ephemeral validator
RUST_LOG=info ephemeral-validator \
    --accounts-lifecycle ephemeral \
    --remote-cluster development \
    --remote-url http://127.0.0.1:8899 \
    --remote-ws-url ws://127.0.0.1:8900 \
    --rpc-port 7799

# Terminal 3: Run tests
EPHEMERAL_PROVIDER_ENDPOINT="http://localhost:7799" \
EPHEMERAL_WS_ENDPOINT="ws://localhost:7800" \
anchor test --provider.cluster localnet --skip-local-validator --skip-build --skip-deploy
```

### Root Level

```bash
npm run lint               # prettier --check
npm run lint:fix           # prettier -w
```

## Architecture

### Directory Structure

- **`/programs`** - Anchor smart contracts (Rust)
  - `telegram-transfer` - Deposit/claim/refund SOL transfers
  - `telegram-verification` - On-chain Ed25519 Telegram signature verification
- **`/app`** - Next.js 15 frontend + API routes
- **`/sdk/transactions`** - Publishable `@loyal-labs/transactions` NPM package
- **`/tests`** - Anchor test suite (Mocha/Chai)
- **`/docs`** - Project documentation

### Program Addresses

| Program | Address |
|---------|---------|
| `telegram-transfer` | `4ewpzEPF5xrVAHeRkoe7XS1yKFGQBekD7PgFwEz9SaxY` |
| `telegram-verification` | `9yiphKYd4b69tR1ZPP8rNwtMeUwWgjYXaXdEzyNziNhz` |

### Frontend Library Structure (`/app/src/lib`)

| Module | Purpose |
|--------|---------|
| `core/` | HTTP utilities, Neon PostgreSQL + Drizzle ORM |
| `solana/rpc/` | RPC connections (Helius for mainnet/devnet, localhost for localnet) |
| `solana/wallet/` | Keypair management via Telegram Cloud Storage |
| `solana/deposits/` | Deposit/claim/refund logic with PDAs |
| `solana/verification/` | On-chain Telegram signature verification |
| `telegram/mini-app/` | Client-side SDK wrappers, Cloud Storage, auth |
| `telegram/bot-api/` | Server-side bot API (grammy) |
| `magicblock/` | SOL/USD price feed via Pyth oracle |
| `redpill/` | AI chat summaries |

### Key Patterns

- **PDAs**: Deposit accounts and vault use Program Derived Addresses with seeds `"deposit"`, `"vault"`, `"tg_session"`
- **Keypair Storage**: User keypairs stored in Telegram Cloud Storage (not localStorage)
- **Environment Selection**: `NEXT_PUBLIC_SOLANA_ENV` controls RPC endpoint (`mainnet`, `devnet`, `localnet`)

## Tooling

- **Package Manager**: Bun (preferred)
- **Anchor Version**: 0.32.1
- **Solana Version**: 2.1.0
- **ESLint**: Enforces alphabetical imports via `eslint-plugin-simple-import-sort`

## Environment Variables

Required for frontend (in `/app/.env.local`):

```env
NEXT_PUBLIC_TELEGRAM_BOT_ID=<bot_id>
NEXT_PUBLIC_SOLANA_ENV=devnet  # mainnet, devnet, or localnet
ASKLOYAL_TGBOT_KEY=<bot_token>
REDPILL_AI_API_KEY=<api_key>
DATABASE_URL=postgresql://...
```

Optional:
- `NEXT_PUBLIC_SERVER_HOST` - API base URL
- `DEPLOYMENT_PK` - Gasless transaction keypair (base58)
- `NEXT_PUBLIC_GAS_PUBLIC_KEY` - Gasless payer public key
