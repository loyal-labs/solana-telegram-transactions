# @loyal-labs/private-transactions

SDK for private SPL token deposits and transfers using MagicBlock Private Ephemeral Rollups (PER). This package wraps the `telegram-private-transfer` Anchor program and provides helpers for permissions, delegation, private transfers, claims, and undelegation.

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
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  ER_VALIDATOR,
  LoyalPrivateTransactionsClient,
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
} from "@loyal-labs/private-transactions";

const signer = Keypair.fromSecretKey(Uint8Array.from([...secretBytes]));
const tokenMint = new PublicKey("<mint>");

const client = await LoyalPrivateTransactionsClient.fromConfig({
  signer,
  baseRpcEndpoint: "https://api.devnet.solana.com",
  ephemeralRpcEndpoint: "https://tee.magicblock.app",
  ephemeralWsEndpoint: "wss://tee.magicblock.app",
  commitment: "confirmed",
});

await client.initializeDeposit({
  tokenMint,
  user: signer.publicKey,
  payer: signer.publicKey,
});

await client.modifyBalance({
  tokenMint,
  user: signer.publicKey,
  payer: signer.publicKey,
  userTokenAccount: new PublicKey("<sender-ata>"),
  amount: 1_000_000,
  increase: true,
});

await client.createPermission({
  tokenMint,
  user: signer.publicKey,
  payer: signer.publicKey,
});

await client.delegateDeposit({
  tokenMint,
  user: signer.publicKey,
  payer: signer.publicKey,
  validator: ER_VALIDATOR,
});

// Destination username deposit must already exist and be delegated.
await client.transferToUsernameDeposit({
  tokenMint,
  username: "alice_user",
  amount: 100_000,
  user: signer.publicKey,
  payer: signer.publicKey,
  sessionToken: null,
});

await client.undelegateDeposit({
  tokenMint,
  user: signer.publicKey,
  payer: signer.publicKey,
  sessionToken: null,
  magicProgram: MAGIC_PROGRAM_ID,
  magicContext: MAGIC_CONTEXT_ID,
});
```

## PER Authentication

For hosted PER endpoints (`tee.magicblock.app`), the SDK can request auth tokens automatically.

If you need explicit control, fetch token externally and pass it through `authToken`:

```ts
import { getAuthToken } from "@magicblock-labs/ephemeral-rollups-sdk";

const authToken = await getAuthToken(
  "https://tee.magicblock.app",
  wallet.publicKey,
  wallet.signMessage
);

const client = await LoyalPrivateTransactionsClient.fromConfig({
  signer: wallet,
  baseRpcEndpoint: "https://api.devnet.solana.com",
  ephemeralRpcEndpoint: "https://tee.magicblock.app",
  ephemeralWsEndpoint: "wss://tee.magicblock.app",
  authToken,
});
```

## API Overview

### Factory Method

- `fromConfig({ signer, baseRpcEndpoint, ephemeralRpcEndpoint, ... })`

### Core Actions

- `initializeDeposit`
- `initializeUsernameDeposit`
- `modifyBalance`
- `depositForUsername`
- `claimUsernameDeposit`
- `claimUsernameDepositToDeposit`
- `createPermission`
- `createUsernamePermission`
- `delegateDeposit`
- `delegateUsernameDeposit`
- `transferDeposit`
- `transferToUsernameDeposit`
- `undelegateDeposit`
- `undelegateUsernameDeposit`

### Queries

- `getBaseDeposit`
- `getEphemeralDeposit`
- `getBaseUsernameDeposit`
- `getEphemeralUsernameDeposit`

### Accessors

- `publicKey`
- `getBaseProgram()`
- `getEphemeralProgram()`
- `getProgramId()`

### PDA Helpers

- `findDepositPda`
- `findUsernameDepositPda`
- `findVaultPda`

## Development

```bash
bun install
bun run typecheck
bun test --timeout 60000
```
