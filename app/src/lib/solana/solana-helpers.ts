import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";

import telegramTransferIdl from "../../../../target/idl/telegram_transfer.json";
import telegramVerificationIdl from "../../../../target/idl/telegram_verification.json";
import type { TelegramTransfer } from "../../../../target/types/telegram_transfer";
import type { TelegramVerification } from "../../../../target/types/telegram_verification";
import {
  DEPOSIT_SEED_BYTES,
  SESSION_SEED_BYTES,
  VAULT_SEED_BYTES,
} from "../constants";

export function getTelegramTransferProgram(
  provider: AnchorProvider
): Program<TelegramTransfer> {
  return new Program(telegramTransferIdl as TelegramTransfer, provider);
}

export function getTelegramVerificationProgram(
  provider: AnchorProvider
): Program<TelegramVerification> {
  return new Program(telegramVerificationIdl as TelegramVerification, provider);
}

export function getProvider(
  connection: Connection,
  wallet: AnchorWallet
): AnchorProvider {
  return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
}

export function getDepositPda(
  user: PublicKey,
  username: string,
  transferProgram: Program<TelegramTransfer>
): PublicKey {
  const [depositPda] = PublicKey.findProgramAddressSync(
    [DEPOSIT_SEED_BYTES, user.toBuffer(), Buffer.from(username)],
    transferProgram.programId
  );
  return depositPda;
}

export function numberToBN(number: number): BN {
  if (number < 0) {
    throw new Error("Number must be positive");
  }

  return new BN(number);
}

export function getVaultPda(
  username: string,
  transferProgram: Program<TelegramTransfer>
): PublicKey {
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [VAULT_SEED_BYTES, Buffer.from(username)],
    transferProgram.programId
  );
  return vaultPda;
}

export function getSessionPda(
  user: PublicKey,
  verificationProgram: Program<TelegramVerification>
): PublicKey {
  const [sessionPda] = PublicKey.findProgramAddressSync(
    [SESSION_SEED_BYTES, user.toBuffer()],
    verificationProgram.programId
  );
  return sessionPda;
}
