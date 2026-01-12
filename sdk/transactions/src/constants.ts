import { PublicKey } from "@solana/web3.js";

/**
 * Telegram Transfer program ID
 */
export const PROGRAM_ID = new PublicKey(
  "4ewpzEPF5xrVAHeRkoe7XS1yKFGQBekD7PgFwEz9SaxY"
);

/**
 * PDA seed for deposit accounts
 */
export const DEPOSIT_SEED = "deposit";
export const DEPOSIT_SEED_BYTES = Buffer.from(DEPOSIT_SEED);

/**
 * PDA seed for vault account
 */
export const VAULT_SEED = "vault";
export const VAULT_SEED_BYTES = Buffer.from(VAULT_SEED);

/**
 * Lamports per SOL (1 SOL = 1,000,000,000 lamports)
 */
export const LAMPORTS_PER_SOL = 1_000_000_000;

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
