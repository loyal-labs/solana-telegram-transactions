import { PublicKey } from "@solana/web3.js";
/**
 * Derive the deposit PDA for a user and token mint
 *
 * @param user - The user's public key
 * @param tokenMint - The SPL token mint
 * @param programId - Optional program ID (defaults to PROGRAM_ID)
 * @returns [PDA address, bump seed]
 */
export declare function findDepositPda(user: PublicKey, tokenMint: PublicKey, programId?: PublicKey): [PublicKey, number];
/**
 * Derive the username deposit PDA for a username and token mint
 *
 * @param username - The Telegram username
 * @param tokenMint - The SPL token mint
 * @param programId - Optional program ID (defaults to PROGRAM_ID)
 * @returns [PDA address, bump seed]
 */
export declare function findUsernameDepositPda(username: string, tokenMint: PublicKey, programId?: PublicKey): [PublicKey, number];
/**
 * Derive the vault PDA
 *
 * @param tokenMint - The SPL token mint
 * @param programId - Optional program ID (defaults to PROGRAM_ID)
 * @returns [PDA address, bump seed]
 */
export declare function findVaultPda(tokenMint: PublicKey, programId?: PublicKey): [PublicKey, number];
