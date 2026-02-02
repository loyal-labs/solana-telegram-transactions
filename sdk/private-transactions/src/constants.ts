import { PublicKey } from "@solana/web3.js";

/**
 * Telegram Private Transfer program ID
 */
export const PROGRAM_ID = new PublicKey(
  "97FzQdWi26mFNR21AbQNg4KqofiCLqQydQfAvRQMcXhV"
);

/**
 * PDA seed for deposit accounts
 */
export const DEPOSIT_SEED = "deposit";
export const DEPOSIT_SEED_BYTES = Buffer.from(DEPOSIT_SEED);

/**
 * PDA seed for username deposit accounts
 */
export const USERNAME_DEPOSIT_SEED = "username_deposit";
export const USERNAME_DEPOSIT_SEED_BYTES = Buffer.from(USERNAME_DEPOSIT_SEED);

/**
 * PDA seed for vault account
 */
export const VAULT_SEED = "vault";
export const VAULT_SEED_BYTES = Buffer.from(VAULT_SEED);
