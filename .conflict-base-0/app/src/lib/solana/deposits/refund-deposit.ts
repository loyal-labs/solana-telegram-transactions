import { AnchorProvider, Program } from "@coral-xyz/anchor";

import type { TelegramTransfer } from "../../../../../target/types/telegram_transfer";
import type { TelegramDeposit } from "../../../types/deposits";
import { getDepositPda, getVaultPda, numberToBN } from "../solana-helpers";
import { getDeposit } from "./get-deposit";

export const refundDeposit = async (
  provider: AnchorProvider,
  transferProgram: Program<TelegramTransfer>,
  username: string,
  amount: number
): Promise<TelegramDeposit> => {
  const deposit = await getDeposit(provider, transferProgram, username);
  const userPublicKey = provider.wallet.publicKey;
  const vaultPda = getVaultPda(transferProgram);
  const depositPda = getDepositPda(userPublicKey, username, transferProgram);

  if (deposit.amount < amount) {
    throw new Error("Insufficient deposit");
  }
  if (deposit.user.toBase58() !== userPublicKey.toBase58()) {
    throw new Error("This deposit does not belong to the current user");
  }

  const amountBN = numberToBN(amount);

  await transferProgram.methods
    .refundDeposit(amountBN)
    .accounts({
      depositor: userPublicKey,
      // @ts-expect-error - vaultPda is a PublicKey
      vault: vaultPda,
      deposit: depositPda,
    })
    .rpc({ commitment: "confirmed" });

  const updatedDeposit = await getDeposit(provider, transferProgram, username);
  return updatedDeposit;
};
