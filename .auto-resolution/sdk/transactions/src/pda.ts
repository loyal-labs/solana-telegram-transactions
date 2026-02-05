import { PublicKey } from "@solana/web3.js";
import { DEPOSIT_SEED_BYTES, VAULT_SEED_BYTES, PROGRAM_ID } from "./constants";

/**
 * Derive the deposit PDA for a user and username
 *
 * @param depositor - The depositor's public key
 * @param username - The Telegram username
 * @param programId - Optional program ID (defaults to PROGRAM_ID)
 * @returns [PDA address, bump seed]
 */
export function findDepositPda(
  depositor: PublicKey,
  username: string,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [DEPOSIT_SEED_BYTES, depositor.toBuffer(), Buffer.from(username)],
    programId
  );
}

/**
 * Derive the vault PDA
 *
 * @param programId - Optional program ID (defaults to PROGRAM_ID)
 * @returns [PDA address, bump seed]
 */
export function findVaultPda(
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([VAULT_SEED_BYTES], programId);
}
