/**
 * @loyal-labs/transactions - SDK for Telegram-based Solana deposits
 *
 * This SDK provides a simple interface for depositing SOL for Telegram usernames.
 *
 * @example
 * // Browser with wallet adapter
 * import { LoyalTransactionsClient } from '@loyal-labs/transactions';
 * import { useConnection, useWallet } from '@solana/wallet-adapter-react';
 *
 * const { connection } = useConnection();
 * const wallet = useWallet();
 * const client = LoyalTransactionsClient.fromWallet(connection, wallet);
 *
 * const result = await client.deposit({
 *   username: 'alice',
 *   amountLamports: 100_000_000,
 * });
 *
 * @example
 * // Server-side with keypair
 * import { LoyalTransactionsClient } from '@loyal-labs/transactions';
 * import { Connection, Keypair } from '@solana/web3.js';
 *
 * const connection = new Connection('https://api.devnet.solana.com');
 * const keypair = Keypair.fromSecretKey(secretKey);
 * const client = LoyalTransactionsClient.fromKeypair(connection, keypair);
 *
 * const result = await client.deposit({
 *   username: 'bob',
 *   amountLamports: 50_000_000,
 * });
 *
 * @example
 * // Existing Anchor project
 * import { LoyalTransactionsClient } from '@loyal-labs/transactions';
 * import { AnchorProvider } from '@coral-xyz/anchor';
 *
 * const provider = AnchorProvider.env();
 * const client = LoyalTransactionsClient.fromProvider(provider);
 */
export { LoyalTransactionsClient } from "./src/LoyalTransactionsClient";
export type { WalletSigner, WalletLike, DepositParams, DepositResult, RefundParams, RefundResult, DepositData, } from "./src/types";
export { isKeypair, isAnchorProvider, isWalletLike } from "./src/types";
export { PROGRAM_ID, DEPOSIT_SEED, VAULT_SEED, LAMPORTS_PER_SOL, solToLamports, lamportsToSol, } from "./src/constants";
export { findDepositPda, findVaultPda } from "./src/pda";
export { IDL } from "./src/idl";
export type { TelegramTransfer } from "./src/idl";
