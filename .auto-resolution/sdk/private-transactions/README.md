# @loyal-labs/private-transactions

SDK for private Solana token deposits using MagicBlock's Private Ephemeral Rollups (PER).

## Overview

This SDK enables confidential token transfers on Solana by leveraging MagicBlock's TEE-secured Ephemeral Rollups. It provides:

- **Private deposits** - Token deposits tied to Solana wallets or Telegram usernames
- **Delegation** - Account delegation to MagicBlock's Private Ephemeral Rollups
- **Confidential transfers** - Private state transitions within the TEE
- **Atomic settlement** - Commit and undelegate to finalize on Solana

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

### 1. Create Clients

```typescript
import { LoyalPrivateTransactionsClient } from '@loyal-labs/private-transactions';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

// Base layer client (Solana)
const connection = new Connection('https://api.devnet.solana.com');
const baseClient = LoyalPrivateTransactionsClient.from(connection, keypair);

// Ephemeral rollup client (MagicBlock PER)
const ephemeralClient = await LoyalPrivateTransactionsClient.fromEphemeral({
  signer: keypair,
  rpcEndpoint: 'http://localhost:7799',
  wsEndpoint: 'ws://localhost:7800',
});
```

### 2. Initialize and Fund a Deposit

```typescript
const tokenMint = new PublicKey('...');
const user = keypair.publicKey;

// Initialize deposit account
await baseClient.initializeDeposit({
  user,
  tokenMint,
  payer: user,
});

// Deposit tokens
await baseClient.modifyBalance({
  user,
  tokenMint,
  amount: 1_000_000,
  increase: true,
  payer: user,
  userTokenAccount,
});
```

### 3. Create Permission and Delegate to PER

```typescript
import { MAGIC_PROGRAM_ID, MAGIC_CONTEXT_ID } from '@loyal-labs/private-transactions';

// Create permission for PER access control
await baseClient.createPermission({
  user,
  tokenMint,
  payer: user,
});

// Delegate to ephemeral rollup
await baseClient.delegateDeposit({
  user,
  tokenMint,
  payer: user,
  validator: erValidatorPubkey, // MagicBlock validator
});
```

### 4. Execute Private Transfers

```typescript
// Private transfer on the ephemeral rollup
await ephemeralClient.transferToUsernameDeposit({
  username: 'alice_telegram',
  tokenMint,
  amount: 100_000,
  user,
  payer: user,
  sessionToken: null,
});
```

### 5. Commit and Undelegate

```typescript
// Finalize state on Solana
await ephemeralClient.undelegateDeposit({
  user,
  tokenMint,
  payer: user,
  magicProgram: MAGIC_PROGRAM_ID,
  magicContext: MAGIC_CONTEXT_ID,
});
```

## API Reference

### Factory Methods

| Method | Description |
|--------|-------------|
| `from(connection, signer)` | Create client from Connection and any signer type |
| `fromProvider(provider)` | Create client from AnchorProvider |
| `fromWallet(connection, wallet)` | Create client from wallet adapter |
| `fromKeypair(connection, keypair)` | Create client from Keypair |
| `fromEphemeral(config)` | Create client connected to ephemeral rollup |

### Deposit Operations

| Method | Description |
|--------|-------------|
| `initializeDeposit(params)` | Initialize a deposit account |
| `modifyBalance(params)` | Deposit or withdraw tokens |
| `depositForUsername(params)` | Deposit tokens for a Telegram username |
| `claimUsernameDeposit(params)` | Claim tokens from a username deposit |

### Permission Operations

| Method | Description |
|--------|-------------|
| `createPermission(params)` | Create access permission for PER |
| `createUsernamePermission(params)` | Create permission for username deposit |

### Delegation Operations

| Method | Description |
|--------|-------------|
| `delegateDeposit(params)` | Delegate account to ephemeral rollup |
| `delegateUsernameDeposit(params)` | Delegate username account to ER |
| `undelegateDeposit(params)` | Commit and undelegate from ER |
| `undelegateUsernameDeposit(params)` | Undelegate username account |

### Transfer Operations

| Method | Description |
|--------|-------------|
| `transferDeposit(params)` | Transfer between user deposits |
| `transferToUsernameDeposit(params)` | Transfer to a username deposit |

### Query Methods

| Method | Description |
|--------|-------------|
| `getDeposit(user, tokenMint)` | Get deposit account data |
| `getUsernameDeposit(username, tokenMint)` | Get username deposit data |

### PDA Helpers

| Method | Description |
|--------|-------------|
| `findDepositPda(user, tokenMint)` | Derive deposit PDA |
| `findUsernameDepositPda(username, tokenMint)` | Derive username deposit PDA |
| `findVaultPda(tokenMint)` | Derive vault PDA |

## Constants

```typescript
import {
  PROGRAM_ID,              // Telegram Private Transfer program
  DELEGATION_PROGRAM_ID,   // MagicBlock delegation program
  PERMISSION_PROGRAM_ID,   // MagicBlock permission program
  MAGIC_PROGRAM_ID,        // Magic program (for undelegation)
  MAGIC_CONTEXT_ID,        // Magic context account
} from '@loyal-labs/private-transactions';
```

## PDA Seeds

| Constant | Value | Description |
|----------|-------|-------------|
| `DEPOSIT_SEED` | `"deposit"` | User deposit accounts |
| `USERNAME_DEPOSIT_SEED` | `"username_deposit"` | Username-based deposits |
| `VAULT_SEED` | `"vault"` | Token vault accounts |
| `PERMISSION_SEED` | `"permission"` | PER permission accounts |

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐
│  Solana (Base)  │     │  MagicBlock PER      │
│                 │     │  (TEE-secured)       │
├─────────────────┤     ├──────────────────────┤
│ • Initialize    │────▶│ • Private transfers  │
│ • Fund deposit  │     │ • Confidential state │
│ • Create perm   │     │ • Sub-50ms latency   │
│ • Delegate      │     │                      │
│                 │◀────│ • Commit state       │
│ • Settlement    │     │ • Undelegate         │
└─────────────────┘     └──────────────────────┘
```

## Delegation Lifecycle

1. **Initialize**: Create deposit account on Solana
2. **Fund**: Transfer tokens to the deposit
3. **Permission**: Create PER access control
4. **Delegate**: Transfer account ownership to delegation program
5. **Execute**: Run private operations on ephemeral rollup
6. **Commit**: Finalize state changes
7. **Undelegate**: Return account to Solana

## Local Development

### Running Tests

The test suite supports both **Localnet** and **Devnet** configurations.

#### Localnet Setup

Start the validators:

```bash
# Terminal 1: Base layer validator with required programs
mb-test-validator \
    --reset \
    --ledger ~/test-ledger \
    --upgradeable-program DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh ./tests/fixtures/dlp.so ~/.config/solana/id.json \
    --upgradeable-program ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1 ./tests/fixtures/permission.so ~/.config/solana/id.json \
    --upgradeable-program 97FzQdWi26mFNR21AbQNg4KqofiCLqQydQfAvRQMcXhV ./target/deploy/telegram_private_transfer.so ~/.config/solana/id.json

# Terminal 2: Ephemeral rollup validator
docker run -it --rm --network host \
  -e ACCOUNTS_REMOTE=http://127.0.0.1:8899 \
  -e ACCOUNTS_LIFECYCLE=ephemeral \
  -e ACCOUNTS_COMMIT_FREQUENCY_MILLIS=200 \
  -e RPC_PORT=7799 \
  magicblocklabs/validator
```

Run tests:

```bash
cd sdk/private-transactions
bun install
bun test --timeout 60000
```

#### Devnet Setup

```bash
# Run tests against Devnet
TEST_NETWORK=devnet \
PROVIDER_ENDPOINT=https://api.devnet.solana.com \
EPHEMERAL_PROVIDER_ENDPOINT=https://devnet.magicblock.app \
bun test --timeout 120000
```

### Environment Variables

#### Network Configuration

| Variable | Localnet Default | Devnet Default | Description |
|----------|------------------|----------------|-------------|
| `TEST_NETWORK` | `localnet` | - | Network type (`localnet` or `devnet`) |
| `PROVIDER_ENDPOINT` | `http://127.0.0.1:8899` | `https://api.devnet.solana.com` | Base layer RPC endpoint |
| `WS_ENDPOINT` | `ws://127.0.0.1:8900` | Auto-derived | Base layer WebSocket endpoint |
| `EPHEMERAL_PROVIDER_ENDPOINT` | `http://127.0.0.1:7799` | `https://devnet.magicblock.app` | Ephemeral rollup RPC endpoint |
| `EPHEMERAL_WS_ENDPOINT` | `ws://127.0.0.1:7800` | Auto-derived | Ephemeral rollup WebSocket endpoint |
| `ER_VALIDATOR` | `mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev` | - | MagicBlock validator identity |
| `PROVIDER_COMMITMENT` | `confirmed` | - | Transaction commitment level |

#### Test Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `TOKEN_MINT` | - | Existing token mint to use (optional) |
| `SKIP_TELEGRAM_VERIFICATION` | `false` (`true` on devnet) | Skip Telegram verification tests |
| `INITIAL_AMOUNT` | `1000000` | Initial deposit amount (6 decimals) |
| `DEPOSIT_AMOUNT` | `200000` | Username deposit amount |
| `CLAIM_AMOUNT` | `100000` | Claim amount |
| `TRANSFER_AMOUNT` | `100000` | Transfer amount |

#### Retry Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `RETRY_ATTEMPTS` | `5` | Number of retry attempts |
| `RETRY_DELAY_MS` | `500` | Delay between retries (ms) |
| `TRANSFER_RETRIES` | `30` | Max retries for ER transfers |
| `TRANSFER_RETRY_DELAY_MS` | `1000` | Delay between transfer retries (ms) |
| `COMMIT_POLL_MS` | `200` | Commit polling interval (ms) |
| `COMMIT_MAX_POLLS` | `150` | Max commit polling attempts |

#### Funding Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `AIRDROP_AMOUNT` | `1000000000` (1 SOL) | Airdrop amount in lamports |
| `MIN_BALANCE` | `200000000` (0.2 SOL) | Minimum balance before airdrop |

### Test Structure

The test suite is organized into the following groups:

1. **Factory Methods** - Tests for client creation methods
2. **PDA Helpers** - Tests for PDA derivation functions
3. **Deposit Operations** - Initialize, modify balance, deposit for username
4. **Permission and Delegation** - Create permissions and delegate to ER
5. **Telegram Verification** - Store/verify sessions, claim deposits (skipped on devnet)
6. **Private Transfers (PER)** - Execute transfers on ephemeral rollup
7. **Query Methods** - Fetch deposit data

## Resources

- [MagicBlock Documentation](https://docs.magicblock.gg)
- [Private Ephemeral Rollups Guide](https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers)
- [Ephemeral Rollups SDK](https://github.com/magicblock-labs/ephemeral-rollups-sdk)
