import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
/**
 * Telegram Private Transfer program ID
 */
export declare const PROGRAM_ID: PublicKey;
/**
 * MagicBlock Delegation Program ID
 */
export declare const DELEGATION_PROGRAM_ID: PublicKey;
/**
 * MagicBlock Permission Program ID (ACL)
 */
export declare const PERMISSION_PROGRAM_ID: PublicKey;
/**
 * MagicBlock Magic Program ID (for undelegation)
 */
export declare const MAGIC_PROGRAM_ID: PublicKey;
/**
 * MagicBlock Magic Context Account (for undelegation)
 */
export declare const MAGIC_CONTEXT_ID: PublicKey;
/**
 * PDA seed for deposit accounts
 */
export declare const DEPOSIT_SEED = "deposit";
export declare const DEPOSIT_SEED_BYTES: Buffer<ArrayBuffer>;
/**
 * PDA seed for username deposit accounts
 */
export declare const USERNAME_DEPOSIT_SEED = "username_deposit";
export declare const USERNAME_DEPOSIT_SEED_BYTES: Buffer<ArrayBuffer>;
/**
 * PDA seed for vault account
 */
export declare const VAULT_SEED = "vault";
export declare const VAULT_SEED_BYTES: Buffer<ArrayBuffer>;
/**
 * PDA seed for permission accounts
 */
export declare const PERMISSION_SEED = "permission:";
export declare const PERMISSION_SEED_BYTES: Buffer<ArrayBuffer>;
/**
 * Re-export LAMPORTS_PER_SOL for convenience
 */
export { LAMPORTS_PER_SOL };
/**
 * Convert SOL to lamports
 */
export declare function solToLamports(sol: number): number;
/**
 * Convert lamports to SOL
 */
export declare function lamportsToSol(lamports: number): number;
