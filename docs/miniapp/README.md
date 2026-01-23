# Mini App Library Structure

Quick reference for `/app/src/lib/`.

## Folder Overview

| Folder | Purpose | Key Exports |
|--------|---------|-------------|
| `/core` | HTTP utilities | `fetchJson()`, `resolveEndpoint()` |
| `/solana` | Blockchain integration | RPC connections, wallet, deposits |
| `/telegram` | Telegram SDK integration | Mini app utils, bot API |
| `/magicblock` | SOL/USD price feed | `fetchSolUsdPrice()` |
| `/redpill` | AI chat summaries | `chatCompletion()` |

## Root Files

| File | Purpose |
|------|---------|
| `constants.ts` | App-wide constants (storage keys, PDA seeds, Telegram keys, pricing) |
| `utils.ts` | Tailwind CSS helper (`cn()` function) |

## Quick Links

- [Environment Variables](./environment-vars.md) - Required setup
- [Folder Reference](./folder-reference.md) - Detailed breakdown
