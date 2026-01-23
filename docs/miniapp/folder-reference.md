# Folder Reference

Detailed breakdown of `/app/src/lib/`.

---

## Root Files

### `constants.ts`

| Constant | Source | Purpose |
|----------|--------|---------|
| `PUBLIC_KEY_STORAGE_KEY` | Hardcoded | Cloud storage key: `"solana_public_key"` |
| `SECRET_KEY_STORAGE_KEY` | Hardcoded | Cloud storage key: `"solana_secret_key"` |
| `TELEGRAM_BOT_ID` | Env var | From `NEXT_PUBLIC_TELEGRAM_BOT_ID` |
| `TELEGRAM_PUBLIC_KEYS` | Hardcoded | Test + prod keys for signature verification |
| `DEPOSIT_SEED` | Hardcoded | PDA seed: `"deposit"` |
| `VAULT_SEED` | Hardcoded | PDA seed: `"vault"` |
| `SESSION_SEED` | Hardcoded | PDA seed: `"tg_session"` |
| `SOL_PRICE_USD` | Hardcoded | Fallback price (use MagicBlock for live) |
| `STARS_FEE_AMOUNT` | Hardcoded | `2000` Stars (testing value) |
| `STARS_TO_USD` | Hardcoded | `0.013` conversion rate |

### `utils.ts`

Single function for Tailwind CSS class merging:

```typescript
cn(...inputs) // Merges classes, resolves conflicts
```

---

## `/core`

HTTP utilities and database connections.

| File | Exports | Description |
|------|---------|-------------|
| `http.ts` | `fetchJson()`, `fetchStream()` | Typed fetch wrappers |
| `api.ts` | `resolveEndpoint()` | Builds URLs from `NEXT_PUBLIC_SERVER_HOST` |
| `database.ts` | `getDatabase()` | Neon PostgreSQL connection via Drizzle ORM |

---

## `/solana`

Solana blockchain integration.

### `/solana/rpc/`

RPC connection management using Helius endpoints.

| Constant | Source | Value |
|----------|--------|-------|
| `SECURE_MAINNET_RPC_URL` | Hardcoded | Helius mainnet endpoint |
| `SECURE_DEVNET_RPC_URL` | Hardcoded | Helius devnet endpoint |

Selected by `NEXT_PUBLIC_SOLANA_ENV` (defaults to `devnet`).

**Key exports:** `getConnection()`, `getWebsocketConnection()`

### `/solana/wallet/`

Wallet keypair management. Keypairs stored in **Telegram Cloud Storage** (not localStorage).

**Key exports:** `ensureWalletKeypair()`, `getWalletBalance()`, `sendSolTransaction()`

### `/solana/deposits/`

Deposit/claim logic using Anchor programs and PDAs.

**Key exports:** `getDeposit()`, `claimDeposit()`, `refundDeposit()`, `topUpDeposit()`

### `/solana/verification/`

On-chain Telegram signature verification using Ed25519.

**Key exports:** `verifyInitData()`, `storeInitData()`, `fetchSessionData()`

### `solana-helpers.ts`

Anchor program initialization and PDA derivation.

**Key exports:** `getTelegramTransferProgram()`, `getDepositPda()`, `getVaultPda()`

---

## `/telegram`

Telegram platform integration split into client and server.

### `/telegram/mini-app/` (Client-side)

For browser/mini app context.

| File | Purpose |
|------|---------|
| `index.ts` | SDK init, safe area handling |
| `cloud-storage.ts` | Telegram Cloud Storage wrapper |
| `tma-auth.ts` | Auth headers for API requests |
| `share-message.ts` | Message sharing |
| `verify-init-data.ts` | Client-side signature verification |

**Constant:** `CHANNEL_LINK = "https://t.me/loyal_tg"`

### `/telegram/bot-api/` (Server-side)

For API routes. Requires `ASKLOYAL_TGBOT_KEY` env var.

| Constant | Value |
|----------|-------|
| `CHANNEL_USERNAME` | `"@loyal_tg"` |
| `MINI_APP_LINK` | `"https://t.me/askloyal_tgbot/app"` |
| `CUSTOM_EMOJI_ID` | `"5361803602862052361"` |

**Key exports:** `getBot()`, `sendMessage()`, `createInvoiceLink()`

---

## `/magicblock`

MagicBlock integration for live SOL/USD price via Pyth Lazer oracle.

| Constant | Source | Value |
|----------|--------|-------|
| `MAGICBLOCK_DEVNET_RPC_URL` | Hardcoded | `https://devnet.magicblock.app` |
| `PRICE_PROGRAM_ID` | Hardcoded | Pyth price program address |
| `SOLANA_PYTH_LAZER_ID` | Hardcoded | `6` (SOL/USD feed) |

**Key export:** `fetchSolUsdPrice()` - Returns current SOL price in USD

---

## `/redpill`

AI/LLM integration via RedPill API for chat summarization.

| Constant | Source |
|----------|--------|
| `REDPILL_BASE_URL` | Hardcoded: `https://api.redpill.ai/v1` |
| API Key | Env var: `REDPILL_AI_API_KEY` |

**Key exports:** `chatCompletion()`, `chatCompletionStream()`

Used in `telegram/bot-api/summaries.ts` for generating chat summaries.
