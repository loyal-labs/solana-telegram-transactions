import { PublicKey } from "@solana/web3.js";
/**
 * Derive the deposit PDA for a user and username
 *
 * @param depositor - The depositor's public key
 * @param username - The Telegram username
 * @param programId - Optional program ID (defaults to PROGRAM_ID)
 * @returns [PDA address, bump seed]
 */
export declare function findDepositPda(depositor: PublicKey, username: string, programId?: PublicKey): [PublicKey, number];
/**
 * Derive the vault PDA
 *
 * @param programId - Optional program ID (defaults to PROGRAM_ID)
 * @returns [PDA address, bump seed]
 */
export declare function findVaultPda(programId?: PublicKey): [PublicKey, number];
