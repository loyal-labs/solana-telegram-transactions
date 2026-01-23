# Environment Variables

All environment variables used by `/app/src/lib/`.

## Required

| Variable | Used By | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_TELEGRAM_BOT_ID` | `constants.ts` | Telegram bot ID |
| `NEXT_PUBLIC_SOLANA_ENV` | `solana/rpc/` | `"mainnet"` or `"devnet"` (defaults to devnet) |
| `ASKLOYAL_TGBOT_KEY` | `telegram/bot-api/` | Telegram bot token from BotFather |
| `REDPILL_AI_API_KEY` | `redpill/` | API key for RedPill AI service |
| `DATABASE_URL` | `core/database.ts` | Neon PostgreSQL connection string |

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

# Solana
NEXT_PUBLIC_SOLANA_ENV=devnet

# AI
REDPILL_AI_API_KEY=your_api_key

# Database
DATABASE_URL=postgresql://user:password@ep-xxx.aws.neon.tech/dbname?sslmode=require

# Optional - API host
NEXT_PUBLIC_SERVER_HOST=https://your-api.com
```
