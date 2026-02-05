import {
  AnchorProvider,
  BN,
  BorshInstructionCoder,
  Idl,
  Program,
} from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { PublicKey } from "@solana/web3.js";

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
  transferProgram: Program<TelegramTransfer>
): PublicKey {
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [VAULT_SEED_BYTES],
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

export function encodeAnchorStringFilter(value: string): string {
  const valueBytes = Buffer.from(value, "utf8");
  const filterBuf = Buffer.alloc(4 + valueBytes.length);
  filterBuf.writeUInt32LE(valueBytes.length, 0);
  valueBytes.copy(filterBuf, 4);
  return bs58.encode(filterBuf);
}

export function decodeTelegramTransferInstruction(data: string) {
  const coder = new BorshInstructionCoder(telegramTransferIdl as Idl);
  const decoded = coder.decode(data, "base58");
  return decoded;
}

export function decodeTelegramVerificationInstruction(data: string) {
  const coder = new BorshInstructionCoder(telegramVerificationIdl as Idl);
  const decoded = coder.decode(data, "base58");
  return decoded;
}

//verify_telegram_init_data
//store
//claim_deposit
//deposit_for_username
