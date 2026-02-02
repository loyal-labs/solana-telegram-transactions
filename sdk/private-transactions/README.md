# @loyal-labs/private-transactions

SDK for Telegram-based private SPL token deposits and transfers using the
`telegram-private-transfer` program (MagicBlock PER).

## Installation

```bash
bun add @loyal-labs/private-transactions
# or
npm install @loyal-labs/private-transactions
```

### Peer Dependencies

This SDK requires the following peer dependencies:

```bash
bun add @coral-xyz/anchor @solana/web3.js @solana/spl-token @magicblock-labs/ephemeral-rollups-sdk
```

## Quick Start

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { LoyalPrivateTransactionsClient } from "@loyal-labs/private-transactions";

const connection = new Connection("https://api.devnet.solana.com");
const client = LoyalPrivateTransactionsClient.fromKeypair(connection, myKeypair);

const tokenMint = new PublicKey("So11111111111111111111111111111111111111112");

// Initialize a deposit bucket for the user + mint
await client.initializeDeposit({ tokenMint });

// Deposit tokens into the user's bucket (amount in base units)
await client.modifyBalance({
  tokenMint,
  amount: 1_000_000n, // 1.0 token with 6 decimals
  increase: true,
});

// Delegate to MagicBlock (PER)
await client.delegateDeposit({
  tokenMint,
  validator: new PublicKey("mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev"),
  rpcOptions: { skipPreflight: true },
});

// Transfer to another user's deposit bucket
await client.transferDeposit({
  tokenMint,
  amount: 250_000n,
  destinationUser: otherUserPubkey,
  rpcOptions: { skipPreflight: true },
});

// Undelegate (commit) back to the base chain
await client.undelegateDeposit({ tokenMint });
```

## Usage

### Browser with Wallet Adapter

For React applications using `@solana/wallet-adapter-react`:

```typescript
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LoyalPrivateTransactionsClient } from "@loyal-labs/private-transactions";

function DepositButton() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const tokenMint = new PublicKey("So11111111111111111111111111111111111111112");

  const handleDeposit = async () => {
    if (!wallet.publicKey) return;

    const client = LoyalPrivateTransactionsClient.fromWallet(connection, wallet);

    await client.initializeDeposit({
      tokenMint,
    });

    await client.modifyBalance({
      tokenMint,
      amount: 1_000_000n,
      increase: true,
    });
  };

  return <button onClick={handleDeposit}>Deposit 1.0 Token</button>;
}
```

### Server-Side with Keypair

For backend scripts, bots, or CLI tools:

```typescript
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { LoyalPrivateTransactionsClient } from "@loyal-labs/private-transactions";

const connection = new Connection("https://api.devnet.solana.com");
const keypair = Keypair.fromSecretKey(mySecretKey);
const client = LoyalPrivateTransactionsClient.fromKeypair(connection, keypair);

const tokenMint = new PublicKey("So11111111111111111111111111111111111111112");

await client.initializeDeposit({ tokenMint });
await client.modifyBalance({ tokenMint, amount: 500_000n, increase: true });
```

### Existing Anchor Projects

If you're already using Anchor with a configured provider:

```typescript
import { AnchorProvider } from "@coral-xyz/anchor";
import { LoyalPrivateTransactionsClient } from "@loyal-labs/private-transactions";

const provider = AnchorProvider.env();
const client = LoyalPrivateTransactionsClient.fromProvider(provider);
```

### Universal Factory Method

The `from()` method auto-detects the signer type:

```typescript
const client = LoyalPrivateTransactionsClient.from(connection, signer);
```

### Username Deposits

```typescript
// Deposit tokens for a Telegram username
await client.depositForUsername({
  username: "alice",
  tokenMint,
  amount: 500_000n,
});

// Claim tokens after verification (requires telegram verification session PDA)
await client.claimUsernameDeposit({
  username: "alice",
  tokenMint,
  amount: 100_000n,
  session: sessionPda,
});
```

Note: `session` is the Telegram verification PDA from the
`telegram-verification` program.

## API Reference

### LoyalPrivateTransactionsClient

The main SDK class for interacting with the Telegram Private Transfer program.

#### Factory Methods

| Method | Description |
|--------|-------------|
| `fromProvider(provider)` | Create from an AnchorProvider |
| `fromWallet(connection, wallet)` | Create from Connection + wallet adapter |
| `fromKeypair(connection, keypair)` | Create from Connection + Keypair |
| `from(connection, signer)` | Auto-detect signer type |

#### Instance Methods

##### `initializeDeposit(params): Promise<InitializeDepositResult>`

Create a deposit bucket for a user + token mint.

##### `modifyBalance(params): Promise<ModifyBalanceResult>`

Increase or decrease a user's deposit balance.

##### `transferDeposit(params): Promise<TransferDepositResult>`

Transfer from a user's deposit to another user's deposit.

##### `transferToUsernameDeposit(params): Promise<TransferToUsernameDepositResult>`

Transfer from a user's deposit to a username-based deposit.

##### `depositForUsername(params): Promise<DepositForUsernameResult>`

Deposit directly to a username-based bucket.

##### `claimUsernameDeposit(params): Promise<ClaimUsernameDepositResult>`

Claim a username-based deposit (requires verification session PDA).

##### `createPermission(params): Promise<CreatePermissionResult>`

Create a permission for a user deposit (MagicBlock PER).

##### `createUsernamePermission(params): Promise<CreateUsernamePermissionResult>`

Create a permission for a username deposit (MagicBlock PER).

##### `delegateDeposit(params): Promise<string>`

Delegate a user deposit to MagicBlock PER.

##### `delegateUsernameDeposit(params): Promise<string>`

Delegate a username deposit to MagicBlock PER.

##### `undelegateDeposit(params): Promise<string>`

Undelegate a user deposit (commit back to base chain).

##### `undelegateUsernameDeposit(params): Promise<string>`

Undelegate a username deposit (commit back to base chain).

##### `getDeposit(user, tokenMint): Promise<DepositData | null>`

Fetch a user's deposit data.

##### `getUsernameDeposit(username, tokenMint): Promise<UsernameDepositData | null>`

Fetch a username deposit data.

##### `findDepositPda(user, tokenMint): [PublicKey, number]`

Derive the user deposit PDA.

##### `findUsernameDepositPda(username, tokenMint): [PublicKey, number]`

Derive the username deposit PDA.

##### `findVaultPda(tokenMint): [PublicKey, number]`

Derive the vault PDA.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `publicKey` | `PublicKey` | Connected wallet's public key |

### Types

```typescript
interface DepositData {
  user: PublicKey;
  tokenMint: PublicKey;
  amount: number;
  address: PublicKey;
}

interface UsernameDepositData {
  username: string;
  tokenMint: PublicKey;
  amount: number;
  address: PublicKey;
}

type WalletSigner = WalletLike | Keypair | AnchorProvider;

interface WalletLike {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}
```

### Utility Functions

```typescript
import {
  findDepositPda,
  findUsernameDepositPda,
  findVaultPda,
  permissionPdaFromAccount,
  getAuthToken,
} from "@loyal-labs/private-transactions";

const [depositPda] = findDepositPda(userPubkey, tokenMint);
const [usernameDepositPda] = findUsernameDepositPda("alice", tokenMint);
const [vaultPda] = findVaultPda(tokenMint);

const permissionPda = permissionPdaFromAccount(depositPda);
// wallet must support signMessage
const { token, expiresAt } = await getAuthToken(
  "https://api.devnet.solana.com",
  wallet.publicKey,
  wallet.signMessage
);
```

### Constants

```typescript
import {
  PROGRAM_ID,
  DEPOSIT_SEED,
  USERNAME_DEPOSIT_SEED,
  VAULT_SEED,
  MAGIC_PROGRAM_ID,
  MAGIC_CONTEXT_ID,
  PERMISSION_PROGRAM_ID,
  DELEGATION_PROGRAM_ID,
} from "@loyal-labs/private-transactions";
```

## Advanced Usage

### Accessing the Anchor Program

```typescript
const program = client.getProgram();
const programId = client.getProgramId();
```

### Type Guards

```typescript
import { isKeypair, isAnchorProvider, isWalletLike } from "@loyal-labs/private-transactions";

if (isKeypair(signer)) {
  console.log("Using Keypair");
} else if (isAnchorProvider(signer)) {
  console.log("Using AnchorProvider");
} else if (isWalletLike(signer)) {
  console.log("Using wallet adapter");
}
```

### MagicBlock PER Notes

- `delegate*` and `undelegate*` are the MagicBlock PER flows.
- For permissioned endpoints, use `getAuthToken(...)` and attach the token to
  your RPC/WebSocket URLs.

## Error Handling

The SDK throws descriptive errors for common issues:

```typescript
try {
  await client.depositForUsername({
    username: "ab", // Too short!
    tokenMint,
    amount: 1n,
  });
} catch (error) {
  // "Username must be 5-32 characters and contain only letters, numbers, or underscores"
}
```

Common errors:
- `"Username must be 5-32 characters and contain only letters, numbers, or underscores"` - Invalid username length/format
- `"Amount must be greater than 0"` - Invalid amount
- `"Failed to fetch deposit account after transaction"` - Network/confirmation issue
- `"Failed to fetch deposit accounts after transaction"` - Network/confirmation issue
- `"Failed to fetch username deposit after transaction"` - Network/confirmation issue

## Development

```bash
bun install
bun run typecheck
bun test
```
