import { PublicKey } from "@solana/web3.js";
/**
 * Telegram Transfer program ID
 */
export declare const PROGRAM_ID: PublicKey;
/**
 * PDA seed for deposit accounts
 */
export declare const DEPOSIT_SEED = "deposit";
export declare const DEPOSIT_SEED_BYTES: Buffer;
/**
 * PDA seed for vault account
 */
export declare const VAULT_SEED = "vault";
export declare const VAULT_SEED_BYTES: Buffer;
/**
 * Lamports per SOL (1 SOL = 1,000,000,000 lamports)
 */
export declare const LAMPORTS_PER_SOL = 1000000000;
/**
 * Convert SOL to lamports
 */
export declare function solToLamports(sol: number): number;
/**
 * Convert lamports to SOL
 */
export declare function lamportsToSol(lamports: number): number;
