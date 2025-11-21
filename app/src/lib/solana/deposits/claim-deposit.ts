import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

import type { TelegramTransfer } from "../../../../../target/types/telegram_transfer";
import type { TelegramVerification } from "../../../../../target/types/telegram_verification";
import {
  getDepositPda,
  getSessionPda,
  getVaultPda,
  numberToBN,
} from "../solana-helpers";

// TODO: check for the balance of the recipient after
export const claimDeposit = async (
  transferProgram: Program<TelegramTransfer>,
  verificationProgram: Program<TelegramVerification>,
  user: PublicKey,
  recipient: PublicKey,
  amount: number,
  username: string
): Promise<boolean> => {
  const vaultPda = getVaultPda(transferProgram);
  const depositPda = getDepositPda(user, username, transferProgram);

  const sessionPda = getSessionPda(recipient, verificationProgram);
  const amountBN = numberToBN(amount);

  await transferProgram.methods
    .claimDeposit(amountBN)
    .accounts({
      recipient: recipient,
      // @ts-expect-error - vaultPda is a PublicKey
      vault: vaultPda,
      deposit: depositPda,
      session: sessionPda,
    })
    .rpc({ commitment: "confirmed" });

  return true;
};
