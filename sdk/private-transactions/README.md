# @loyal-labs/private-transactions

SDK for Telegram-based private SPL token deposits and transfers using MagicBlock Private Ephemeral Rollups (PER). This wraps the `telegram-private-transfer` Anchor program and provides helpers for permissions, delegation, private transfers, and undelegation.

## Installation

```bash
bun add @loyal-labs/private-transactions
# or
npm install @loyal-labs/private-transactions
```

### Peer Dependencies

```bash
bun add @coral-xyz/anchor @solana/web3.js @solana/spl-token @magicblock-labs/ephemeral-rollups-sdk
```

## Quick Start

```ts
import { Connection, PublicKey } from "@solana/web3.js";
import {
  LoyalPrivateTransactionsClient,
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
} from "@loyal-labs/private-transactions";

const connection = new Connection("https://api.devnet.solana.com");
const client = LoyalPrivateTransactionsClient.from(connection, myKeypair);

const tokenMint = new PublicKey("<mint>");

// Initialize a user deposit
await client.initializeDeposit({
  tokenMint,
  user: myKeypair.publicKey,
  payer: myKeypair.publicKey,
});

// Move tokens into the private deposit vault
await client.modifyBalance({
  tokenMint,
  amount: 1_000_000,
  increase: true,
  user: myKeypair.publicKey,
  payer: myKeypair.publicKey,
});

// Create permission + delegate deposit to the PER validator
await client.createPermission({
  tokenMint,
  user: myKeypair.publicKey,
  payer: myKeypair.publicKey,
});
await client.delegateDeposit({
  tokenMint,
  user: myKeypair.publicKey,
  payer: myKeypair.publicKey,
  validator: new PublicKey("<validator>")
});

// Use the PER API for operations on delegated accounts
const perClient = await LoyalPrivateTransactionsClient.fromEphemeral({
  signer: myKeypair,
  rpcEndpoint: "http://127.0.0.1:7799",
  wsEndpoint: "ws://127.0.0.1:7800",
});

// Ensure the destination username deposit exists (and is delegated on PER)
// e.g. via depositForUsername + createUsernamePermission + delegateUsernameDeposit.
await perClient.transferToUsernameDeposit({
  tokenMint,
  username: "alice",
  amount: 100_000,
  user: myKeypair.publicKey,
  payer: myKeypair.publicKey,
  sessionToken: null,
});

// Undelegate and commit back to the base chain
await perClient.undelegateDeposit({
  tokenMint,
  user: myKeypair.publicKey,
  payer: myKeypair.publicKey,
  magicProgram: MAGIC_PROGRAM_ID,
  magicContext: MAGIC_CONTEXT_ID,
});
```

## PER Authentication

When using MagicBlock hosted PER endpoints, you must attach an auth token. The SDK can fetch it automatically.

```ts
const perClient = await LoyalPrivateTransactionsClient.fromEphemeral({
  signer: walletAdapter,
  rpcEndpoint: "https://tee.magicblock.app",
  wsEndpoint: "wss://tee.magicblock.app",
  useAuth: true,
  // If your signer does not expose signMessage, pass authToken or signMessage explicitly.
  // signMessage: walletAdapter.signMessage,
});
```

You can also pre-fetch the token:

```ts
import { getAuthToken } from "@loyal-labs/private-transactions";

const { token } = await getAuthToken(
  "https://tee.magicblock.app",
  wallet.publicKey,
  wallet.signMessage
);

const perClient = await LoyalPrivateTransactionsClient.fromEphemeral({
  signer: wallet,
  rpcEndpoint: "https://tee.magicblock.app",
  wsEndpoint: "wss://tee.magicblock.app",
  authToken: token,
});
```

## API Overview

### Factory Methods

- `fromProvider(provider)`
- `from(connection, signer)`
- `fromWallet(connection, wallet)`
- `fromKeypair(connection, keypair)`
- `fromEphemeral({ signer, rpcEndpoint, wsEndpoint, useAuth, authToken })`

### Core Actions

- `initializeDeposit`
- `modifyBalance`
- `depositForUsername`
- `claimUsernameDeposit`
- `createPermission`
- `createUsernamePermission`
- `delegateDeposit`
- `delegateUsernameDeposit`
- `transferDeposit`
- `transferToUsernameDeposit`
- `undelegateDeposit`
- `undelegateUsernameDeposit`

### Queries

- `getDeposit(user, tokenMint)`
- `getUsernameDeposit(username, tokenMint)`

### PDA Helpers

- `findDepositPda(user, tokenMint)`
- `findUsernameDepositPda(username, tokenMint)`
- `findVaultPda(tokenMint)`

## Development

```bash
bun install
bun run typecheck
bun test --timeout 60000
```
