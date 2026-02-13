import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * TEE ER Validator
 */
export const ER_VALIDATOR = new PublicKey(
  "FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA"
);

/**
 * Telegram Private Transfer program ID
 */
export const PROGRAM_ID = new PublicKey(
  "97FzQdWi26mFNR21AbQNg4KqofiCLqQydQfAvRQMcXhV"
);

/**
 * MagicBlock Delegation Program ID
 */
export const DELEGATION_PROGRAM_ID = new PublicKey(
  "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
);

/**
 * MagicBlock Permission Program ID (ACL)
 */
export const PERMISSION_PROGRAM_ID = new PublicKey(
  "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1"
);

/**
 * MagicBlock Magic Program ID (for undelegation)
 */
export const MAGIC_PROGRAM_ID = new PublicKey(
  "Magic11111111111111111111111111111111111111"
);

/**
 * MagicBlock Magic Context Account (for undelegation)
 */
export const MAGIC_CONTEXT_ID = new PublicKey(
  "MagicContext1111111111111111111111111111111"
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

/**
 * PDA seed for permission accounts
 */
export const PERMISSION_SEED = "permission:";
export const PERMISSION_SEED_BYTES = Buffer.from(PERMISSION_SEED);

/**
 * Re-export LAMPORTS_PER_SOL for convenience
 */
export { LAMPORTS_PER_SOL };

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}
