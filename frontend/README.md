# Loyal

Fully private, on-chain AI platform built on Solana.

## What is Loyal?

Loyal is a web application that provides AI chat capabilities with end-to-end encryption and on-chain data storage. Every message is encrypted and facilitated on-chain with AI running in confidential compute environments. Neither Loyal developers nor compute node owners can access your data.

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v2/monitor/29j20.svg)](https://uptime.betterstack.com/?utm_source=status_badge)

## Key Features

- **Fully Private AI**: Messages encrypted client-side, processed in confidential VMs
- **On-Chain Storage**: Conversation state anchored to Solana PDAs
- **Solana Wallet Integration**: Sign in with Phantom, Solflare, and other Solana wallets
- **User-Owned Data**: Your wallet = your data, no centralization
- **Automated Workflows**: AI-powered task automation on Solana

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Blockchain**: Solana (web3.js, Anchor)
- **Encryption**: WebCrypto API, Nillion integration
- **Storage**: Irys (Arweave)
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
├── lib/              # Core libraries
│   ├── loyal/       # Loyal-specific logic (encryption, chat)
│   └── proto/       # gRPC protocol definitions
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
