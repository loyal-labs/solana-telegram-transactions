# Environment Variables

All environment variables used by `/app/src/lib/`.

## Required

| Variable | Used By | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_TELEGRAM_BOT_ID` | `constants.ts` | Telegram bot ID |
| `NEXT_PUBLIC_SOLANA_ENV` | `solana/rpc/` | `"mainnet"`, `"devnet"`, or `"localnet"` (defaults to devnet) |
| `ASKLOYAL_TGBOT_KEY` | `telegram/bot-api/` | Telegram bot token from BotFather |
| `REDPILL_AI_API_KEY` | `redpill/` | API key for RedPill AI service |
| `DATABASE_URL` | `core/database.ts` | Neon PostgreSQL connection string |
| `MESSAGE_ENCRYPTION_KEY` | `encryption/` | Base64-encoded 32-byte key for AES-256-GCM |

## Optional

| Variable | Used By | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SERVER_HOST` | `core/api.ts` | Base URL for API endpoints |
| `DEPLOYMENT_PK` | `solana/wallet/` | Deployment keypair for gasless transactions (base58) |
| `NEXT_PUBLIC_GAS_PUBLIC_KEY` | `solana/wallet/` | Public key for gasless payer |

## Example `.env.local`

```env
# Telegram
NEXT_PUBLIC_TELEGRAM_BOT_ID=your_bot_id
ASKLOYAL_TGBOT_KEY=your_bot_token

# Solana - use "mainnet", "devnet", or "localnet"
NEXT_PUBLIC_SOLANA_ENV=devnet

# AI
REDPILL_AI_API_KEY=your_api_key

# Database
DATABASE_URL=postgresql://user:password@ep-xxx.aws.neon.tech/dbname?sslmode=require

# Encryption - generate with: openssl rand -base64 32
MESSAGE_ENCRYPTION_KEY=your_base64_key

# Optional - API host
NEXT_PUBLIC_SERVER_HOST=https://your-api.com
```

## Localnet Setup

To use localnet for local testing:

```bash
# Terminal 1 - Start local validator
solana-test-validator

# Terminal 2 - Run app with localnet
NEXT_PUBLIC_SOLANA_ENV=localnet bun dev
```

| Environment | RPC Endpoint | WebSocket |
|-------------|--------------|-----------|
| `mainnet` | Helius mainnet | Helius WSS |
| `devnet` | Helius devnet | Helius WSS |
| `localnet` | `http://127.0.0.1:8899` | `ws://127.0.0.1:8900` |

Note: On localnet, MagicBlock price feeds fall back to devnet.
