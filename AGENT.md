# AGENT.md

This file provides guidance to Codex-style coding agents when working with code in this repository.

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
bun run lint               # prettier --check
bun run lint:fix           # prettier -w
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
| `telegram/` | User service, bot thread service, bot API handlers |
| `magicblock/` | SOL/USD price feed via Pyth oracle |
| `redpill/` | AI chat summaries |

### Key Patterns

- **PDAs**: Deposit accounts and vault use Program Derived Addresses with seeds `"deposit"`, `"vault"`, `"tg_session"`
- **Keypair Storage**: User keypairs stored in Telegram Cloud Storage (not localStorage)
- **Environment Selection**: `NEXT_PUBLIC_SOLANA_ENV` controls RPC endpoint (`mainnet`, `devnet`, `localnet`)

### Database Patterns

Schema conventions used in `/app/src/lib/core/schema.ts`:

- **Primary Keys**: UUID with `defaultRandom()` for all tables
- **Telegram IDs**: Use `bigint` with `{ mode: "bigint" }` for Telegram user/chat IDs
- **Timestamps**: Always use `timestamp("...", { withTimezone: true })` with `.defaultNow().notNull()`
- **Typed JSONB**: Use `.$type<T>()` for type-safe JSONB columns:
  ```typescript
  topics: jsonb("topics").$type<{ title: string; content: string }[]>().notNull()
  encryptedContent: jsonb("encrypted_content").$type<EncryptedMessageContent>().notNull()
  ```
- **Relations**: Define separately from tables using `relations()`, enables type-safe `with:` queries
- **Type Exports**: Export both `Table` (select) and `InsertTable` (insert) types using `$inferSelect`/`$inferInsert`
- **Indexes**: Use `uniqueIndex` for unique constraints, `index` for query optimization

Service layer patterns:

- **getOrCreate Pattern**: Use `onConflictDoNothing` for race-condition-safe idempotent operations:
  ```typescript
  const result = await db.insert(table).values({...}).onConflictDoNothing().returning({ id: table.id });
  if (result.length === 0) { /* query existing record */ }
  ```
- **Transactions**: Use `db.transaction()` when multiple operations must be atomic
- **Query Builder**: Prefer `db.query.table.findFirst()` with `with:` for relations over raw SQL

### Code Patterns

- **Encryption**: Use `@/lib/encryption` for sensitive data (bot messages, personal info):
  ```typescript
  import { encrypt, decrypt } from "@/lib/encryption";
  const encrypted = await encrypt(JSON.stringify(data)); // returns { ciphertext, iv }
  const decrypted = await decrypt(encrypted); // returns plaintext or null
  ```
- **Drizzle Queries**: Use the query builder for type-safe operations:
  ```typescript
  const user = await db.query.users.findFirst({
    where: eq(users.telegramId, telegramId),
    with: { communityMemberships: true },
  });
  ```
- **Idempotent Operations**: Use `onConflictDoNothing` or `onConflictDoUpdate` to handle duplicate inserts gracefully

## Git Worktree Workflow

### Branch Naming Convention

All branches MUST follow the Linear format: `<issue-number-title>`

Example: `ask-328-fix-wrong-token-history-processing`

To find the correct branch name for a Linear issue, use the issue identifier (e.g., ASK-123).

### Creating a Worktree

When asked to work on a new issue/branch:

1. Create the worktree from the repo root:

```bash
git worktree add ../solana-telegram-transactions-ASK-123 -b ASK-123-short-description main
```

   - Worktrees live as sibling directories to the main repo
   - Always branch from `main` (or ask if unclear)

2. `cd` into the new worktree directory before doing any work

### Listing Worktrees

```bash
git worktree list
```

### Removing a Worktree

When done with a branch:

```bash
git worktree remove ../solana-telegram-transactions-ASK-123
```

Or if already deleted the directory:

```bash
git worktree prune
```

### Important Rules

- NEVER switch branches in the main worktree to work on issues, always create a new worktree
- Each tmux session / coding agent instance should operate in its own worktree
- Run `git worktree list` if unsure which worktrees exist
- After merging a PR, clean up the worktree

## Commit Conventions

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) via `commitlint` with `@commitlint/config-conventional`. A CI workflow (`.github/workflows/commit-style.yml`) validates all commit messages in a PR and the PR title itself.

### Format

```
type(scope): description
```

**Allowed types**: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`

**Scope** is optional but encouraged, use the area of the codebase being changed (e.g., `wallet`, `ui`, `og`, `sdk`, `ci`, `telegram`).

### Examples

```
feat(wallet): show SPL token transfers in activity
fix(sdk): restore delegation PDA helpers
chore(ci): enforce conventional commit style with commitlint
docs(sdk): refresh README for PER + auth usage
refactor(ui): extract pill button component
```

### Rules

- NEVER add `Co-Authored-By` trailers or any co-author attribution to commits
- Keep the subject line under 100 characters
- Use imperative mood in the description ("add", not "added" or "adds")
- Do not end the subject line with a period
- Validate locally before pushing: `bun run commitlint:head`

## Pull Requests

- PR titles MUST follow the same conventional commit format: `type(scope): description`
- PR body should be a simple one-two sentence summary of the changes, no templates or checklists

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
MESSAGE_ENCRYPTION_KEY=<base64-32-bytes>  # For encrypted bot messages
```

Optional:
- `NEXT_PUBLIC_SERVER_HOST` - API base URL
- `DEPLOYMENT_PK` - Gasless transaction keypair (base58)
- `NEXT_PUBLIC_GAS_PUBLIC_KEY` - Gasless payer public key
