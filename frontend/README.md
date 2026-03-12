# Loyal

Fully private, on-chain AI platform built on Solana.

## What is Loyal?

Loyal is a web application that provides AI chat capabilities with wallet-aware identity and private compute infrastructure. The desktop frontend currently focuses on the live chat experience rather than persisted on-chain conversation storage.

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v2/monitor/29j20.svg)](https://uptime.betterstack.com/?utm_source=status_badge)

## Key Features

- **Private AI UX**: Wallet-aware chat experience backed by Loyal services
- **Solana Wallet Integration**: Sign in with Phantom, Solflare, and other Solana wallets
- **Automated Workflows**: AI-powered task automation on Solana

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Blockchain**: Solana (web3.js, Anchor)
- **Styling**: Tailwind CSS, Framer Motion
- **Code Quality**: Ultracite (Biome preset)

## Getting Started

### Prerequisites

- Node.js 20+
- Bun, npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

Create a `.env.local` file with required API keys (see `.env.example`).

For Grid auth integrations, set `NEXT_PUBLIC_GRID_AUTH_BASE_URL` to the shared
passkey domain, typically `https://auth.askloyal.com`.

## Grid auth integration

This frontend treats Grid auth as a shared cookie-backed auth session.

- Email sign-in and passkey sign-in both hydrate the same auth session model.
- Passkey sign-in is implemented in the sign-in modal without duplicating
  WebAuthn logic in this workspace.
- The modal starts passkey sign-in against `NEXT_PUBLIC_GRID_AUTH_BASE_URL`,
  loads the returned `/continue` URL in an iframe, and refreshes the shared
  auth session when the auth domain posts `authz_complete`.

Implementation note:

- browser passkey orchestration stays in the `passkey` workspace
- reusable contracts and auth-client helpers live in `packages/grid-core`
- this workspace owns only the modal UI state and session refresh behavior

## Development

```bash
# Development server
bun dev

# Build for production
bun run build

# Start production server
bun start

# Lint code
bun run ultracite
```

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/              # Core libraries and transport helpers
├── hooks/           # React hooks
└── data/            # Static data and content
```

## Links

- **Website**: [askloyal.com](https://askloyal.com)
- **Docs**: [docs.askloyal.com](https://docs.askloyal.com)
- **Discord**: [discord.askloyal.com](https://discord.askloyal.com)

## Status

⚠️ **Early Stage Product**: This is an open test version. Features may be incomplete or contain errors.

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE.md](LICENSE.md) file for details.

### What this means

- ✅ You can use, modify, and distribute this software
- ✅ If you run a modified version on a server, you must make the source code available to users
- ✅ Any modifications must also be licensed under AGPL-3.0
- ✅ This ensures the software remains free and open source
