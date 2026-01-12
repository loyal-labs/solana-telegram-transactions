import type { PublicKey, Transaction, VersionedTransaction, Keypair, Commitment } from "@solana/web3.js";
import type { AnchorProvider } from "@coral-xyz/anchor";
/**
 * Minimal wallet interface matching @solana/wallet-adapter-base
 * Compatible with browser wallet adapters (Phantom, Solflare, etc.)
 */
export interface WalletLike {
    publicKey: PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}
/**
 * Union type supporting multiple wallet types:
 * - WalletLike: Browser wallet adapters (Phantom, Solflare, etc.)
 * - Keypair: Server-side scripts and testing
 * - AnchorProvider: Existing Anchor projects
 */
export type WalletSigner = WalletLike | Keypair | AnchorProvider;
/**
 * Parameters for depositing SOL for a Telegram username
 */
export interface DepositParams {
    /** Telegram username (without @, 5-32 characters) */
    username: string;
    /** Amount in lamports to deposit */
    amountLamports: number | bigint;
    /** Transaction commitment level (default: 'confirmed') */
    commitment?: Commitment;
}
/**
 * Result of a successful deposit transaction
 */
export interface DepositResult {
    /** Transaction signature */
    signature: string;
    /** Updated deposit account data */
    deposit: DepositData;
}
/**
 * Deposit account data structure
 */
export interface DepositData {
    /** Wallet address of the depositor */
    user: PublicKey;
    /** Telegram username */
    username: string;
    /** Total deposited amount in lamports */
    amount: number;
    /** Last nonce used (for replay protection) */
    lastNonce: number;
    /** PDA address of the deposit account */
    address: PublicKey;
}
/**
 * Check if signer is a raw Keypair
 */
export declare function isKeypair(signer: WalletSigner): signer is Keypair;
/**
 * Check if signer is an AnchorProvider
 */
export declare function isAnchorProvider(signer: WalletSigner): signer is AnchorProvider;
/**
 * Check if signer is a WalletLike (wallet adapter)
 */
export declare function isWalletLike(signer: WalletSigner): signer is WalletLike;
