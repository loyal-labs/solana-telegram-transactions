import { PublicKey } from "@solana/web3.js";
/**
 * Telegram Private Transfer program ID
 */
export declare const PROGRAM_ID: PublicKey;
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
