import { PublicKey } from "@solana/web3.js";
import {
  DEPOSIT_SEED_BYTES,
  USERNAME_DEPOSIT_SEED_BYTES,
  VAULT_SEED_BYTES,
  PROGRAM_ID,
} from "./constants";

/**
 * Derive the deposit PDA for a user and token mint
 *
 * @param user - The user's public key
 * @param tokenMint - The SPL token mint
 * @param programId - Optional program ID (defaults to PROGRAM_ID)
 * @returns [PDA address, bump seed]
 */
export function findDepositPda(
  user: PublicKey,
  tokenMint: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [DEPOSIT_SEED_BYTES, user.toBuffer(), tokenMint.toBuffer()],
    programId
  );
}

/**
 * Derive the username deposit PDA for a username and token mint
 *
 * @param username - The Telegram username
 * @param tokenMint - The SPL token mint
 * @param programId - Optional program ID (defaults to PROGRAM_ID)
 * @returns [PDA address, bump seed]
 */
export function findUsernameDepositPda(
  username: string,
  tokenMint: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [USERNAME_DEPOSIT_SEED_BYTES, Buffer.from(username), tokenMint.toBuffer()],
    programId
  );
}

/**
 * Derive the vault PDA
 *
 * @param tokenMint - The SPL token mint
 * @param programId - Optional program ID (defaults to PROGRAM_ID)
 * @returns [PDA address, bump seed]
 */
export function findVaultPda(
  tokenMint: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED_BYTES, tokenMint.toBuffer()],
    programId
  );
}
