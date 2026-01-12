# @loyal-labs/transactions

SDK for Telegram-based Solana deposits. Deposit SOL for any Telegram username, which can later be claimed by the verified account owner.

## Installation

```bash
bun add @loyal-labs/transactions
# or
npm install @loyal-labs/transactions
```

### Peer Dependencies

This SDK requires the following peer dependencies:

```bash
bun add @coral-xyz/anchor @solana/web3.js
```

## Quick Start

```typescript
import { Connection } from "@solana/web3.js";
import { LoyalTransactionsClient, solToLamports } from "@loyal-labs/transactions";

const connection = new Connection("https://api.devnet.solana.com");
const client = LoyalTransactionsClient.fromKeypair(connection, myKeypair);

const result = await client.deposit({
  username: "alice",
  amountLamports: solToLamports(0.1), // 0.1 SOL
});

console.log("Transaction:", result.signature);
console.log("Deposited:", result.deposit.amount, "lamports");
```

## Usage

### Browser with Wallet Adapter

For React applications using `@solana/wallet-adapter-react`:

```typescript
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LoyalTransactionsClient, solToLamports } from "@loyal-labs/transactions";

function DepositButton() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const handleDeposit = async () => {
    if (!wallet.publicKey) return;

    const client = LoyalTransactionsClient.fromWallet(connection, wallet);

    const result = await client.deposit({
      username: "bob",
      amountLamports: solToLamports(0.5),
    });

    console.log("Success!", result.signature);
  };

  return <button onClick={handleDeposit}>Deposit 0.5 SOL</button>;
}
```

### Server-Side with Keypair

For backend scripts, bots, or CLI tools:

```typescript
import { Connection, Keypair } from "@solana/web3.js";
import { LoyalTransactionsClient, solToLamports } from "@loyal-labs/transactions";

const connection = new Connection("https://api.devnet.solana.com");
const keypair = Keypair.fromSecretKey(mySecretKey);

const client = LoyalTransactionsClient.fromKeypair(connection, keypair);

const result = await client.deposit({
  username: "charlie",
  amountLamports: solToLamports(1.0),
});
```

### Existing Anchor Projects

If you're already using Anchor with a configured provider:

```typescript
import { AnchorProvider } from "@coral-xyz/anchor";
import { LoyalTransactionsClient } from "@loyal-labs/transactions";

const provider = AnchorProvider.env();
const client = LoyalTransactionsClient.fromProvider(provider);

const result = await client.deposit({
  username: "dave",
  amountLamports: 100_000_000,
});
```

### Universal Factory Method

The `from()` method auto-detects the signer type:

```typescript
// Works with any supported signer
const client = LoyalTransactionsClient.from(connection, signer);
```

## API Reference

### LoyalTransactionsClient

The main SDK class for interacting with the Telegram Transfer program.

#### Factory Methods

| Method | Description |
|--------|-------------|
| `fromProvider(provider)` | Create from an AnchorProvider |
| `fromWallet(connection, wallet)` | Create from Connection + wallet adapter |
| `fromKeypair(connection, keypair)` | Create from Connection + Keypair |
| `from(connection, signer)` | Auto-detect signer type |

#### Instance Methods

##### `deposit(params): Promise<DepositResult>`

Deposit SOL for a Telegram username.

```typescript
interface DepositParams {
  username: string;           // Telegram username (5-32 chars, without @)
  amountLamports: number | bigint;  // Amount in lamports
  commitment?: Commitment;    // Optional, defaults to 'confirmed'
}

interface DepositResult {
  signature: string;          // Transaction signature
  deposit: DepositData;       // Updated deposit account data
}
```

##### `getDeposit(depositor, username): Promise<DepositData | null>`

Fetch deposit data for a specific depositor and username.

```typescript
const deposit = await client.getDeposit(depositorPubkey, "alice");
if (deposit) {
  console.log("Amount:", deposit.amount);
  console.log("Address:", deposit.address.toBase58());
}
```

##### `findDepositPda(depositor, username): [PublicKey, number]`

Derive the deposit PDA address.

```typescript
const [pda, bump] = client.findDepositPda(depositorPubkey, "alice");
```

##### `findVaultPda(): [PublicKey, number]`

Derive the vault PDA address.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `publicKey` | `PublicKey` | Connected wallet's public key |

### Types

```typescript
// Deposit account data
interface DepositData {
  user: PublicKey;      // Depositor's wallet
  username: string;     // Telegram username
  amount: number;       // Deposited lamports
  lastNonce: number;    // Replay protection nonce
  address: PublicKey;   // PDA address
}

// Supported wallet/signer types
type WalletSigner = WalletLike | Keypair | AnchorProvider;

// Wallet adapter interface
interface WalletLike {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}
```

### Utility Functions

```typescript
import {
  solToLamports,
  lamportsToSol,
  findDepositPda,
  findVaultPda,
  PROGRAM_ID,
  LAMPORTS_PER_SOL,
} from "@loyal-labs/transactions";

// Convert SOL to lamports
const lamports = solToLamports(1.5); // 1_500_000_000

// Convert lamports to SOL
const sol = lamportsToSol(1_500_000_000); // 1.5

// Derive PDAs directly (without client instance)
const [depositPda] = findDepositPda(userPubkey, "alice");
const [vaultPda] = findVaultPda();
```

### Constants

```typescript
import { PROGRAM_ID, DEPOSIT_SEED, VAULT_SEED, LAMPORTS_PER_SOL } from "@loyal-labs/transactions";

// Program ID: 4ewpzEPF5xrVAHeRkoe7XS1yKFGQBekD7PgFwEz9SaxY
console.log(PROGRAM_ID.toBase58());
```

## Advanced Usage

### Accessing the Anchor Program

For advanced users who need direct access to the underlying Anchor program:

```typescript
const program = client.getProgram();

// Use program directly for custom operations
const accounts = await program.account.deposit.all();
```

### Type Guards

```typescript
import { isKeypair, isAnchorProvider, isWalletLike } from "@loyal-labs/transactions";

if (isKeypair(signer)) {
  console.log("Using Keypair");
} else if (isAnchorProvider(signer)) {
  console.log("Using AnchorProvider");
} else if (isWalletLike(signer)) {
  console.log("Using wallet adapter");
}
```

## Error Handling

The SDK throws descriptive errors for common issues:

```typescript
try {
  await client.deposit({
    username: "ab", // Too short!
    amountLamports: 100,
  });
} catch (error) {
  // "Username must be between 5 and 32 characters"
}
```

Common errors:
- `"Username must be between 5 and 32 characters"` - Invalid username length
- `"Amount must be greater than 0"` - Invalid deposit amount
- `"Failed to fetch deposit account after transaction"` - Network/confirmation issue

## Development

```bash
# Install dependencies
bun install

# Type check
bun run typecheck

# Run tests
bun test
```
