/**
 * @loyal-labs/private-transactions - SDK for private Solana deposits with MagicBlock PER
 *
 * This SDK provides an interface for managing private token deposits using
 * MagicBlock's Private Ephemeral Rollups (PER) for confidential transactions.
 *
 * @example
 * // Base layer client for setup operations
 * import { LoyalPrivateTransactionsClient } from '@loyal-labs/private-transactions';
 * import { Connection, Keypair } from '@solana/web3.js';
 *
 * const connection = new Connection('https://api.devnet.solana.com');
 * const client = LoyalPrivateTransactionsClient.from(connection, keypair);
 *
 * // Initialize and fund deposit
 * await client.initializeDeposit({ user, tokenMint, payer });
 * await client.modifyBalance({ user, tokenMint, amount, increase: true, ... });
 *
 * // Create permission and delegate to ephemeral rollup
 * await client.createPermission({ user, tokenMint, payer });
 * await client.delegateDeposit({ user, tokenMint, payer, validator });
 *
 * @example
 * // Ephemeral rollup client for private operations
 * const ephemeralClient = await LoyalPrivateTransactionsClient.fromEphemeral({
 *   signer: keypair,
 *   rpcEndpoint: 'http://localhost:7799',
 *   wsEndpoint: 'ws://localhost:7800',
 * });
 *
 * // Execute private transfer
 * await ephemeralClient.transferToUsernameDeposit({ username, tokenMint, amount, ... });
 *
 * // Commit and undelegate
 * await ephemeralClient.undelegateDeposit({ user, tokenMint, ... });
 */
export { LoyalPrivateTransactionsClient } from "./src/LoyalPrivateTransactionsClient";
export type { WalletSigner, WalletLike, RpcOptions, EphemeralClientConfig, DepositData, UsernameDepositData, InitializeDepositParams, ModifyBalanceParams, ModifyBalanceResult, DepositForUsernameParams, ClaimUsernameDepositParams, CreatePermissionParams, CreateUsernamePermissionParams, DelegateDepositParams, DelegateUsernameDepositParams, UndelegateDepositParams, UndelegateUsernameDepositParams, TransferDepositParams, TransferToUsernameDepositParams, } from "./src/types";
export { isKeypair, isAnchorProvider, isWalletLike } from "./src/types";
export { PROGRAM_ID, DELEGATION_PROGRAM_ID, PERMISSION_PROGRAM_ID, MAGIC_PROGRAM_ID, MAGIC_CONTEXT_ID, DEPOSIT_SEED, DEPOSIT_SEED_BYTES, USERNAME_DEPOSIT_SEED, USERNAME_DEPOSIT_SEED_BYTES, VAULT_SEED, VAULT_SEED_BYTES, PERMISSION_SEED, PERMISSION_SEED_BYTES, LAMPORTS_PER_SOL, solToLamports, lamportsToSol, } from "./src/constants";
export { findDepositPda, findUsernameDepositPda, findVaultPda, findPermissionPda, findDelegationRecordPda, findDelegationMetadataPda, findBufferPda, } from "./src/pda";
export { IDL } from "./src/idl";
export type { TelegramPrivateTransfer } from "./src/idl";
