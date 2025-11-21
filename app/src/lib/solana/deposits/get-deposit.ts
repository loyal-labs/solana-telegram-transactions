import { AnchorProvider, Program } from "@coral-xyz/anchor";

import type { TelegramTransfer } from "../../../../../target/types/telegram_transfer";
import { getDepositPda } from "../solana-helpers";
import type { TelegramDeposit } from "./types";

export const getDeposit = async (
  provider: AnchorProvider,
  transferProgram: Program<TelegramTransfer>,
  username: string
): Promise<TelegramDeposit> => {
  const depositPda = getDepositPda(
    provider.wallet.publicKey,
    username,
    transferProgram
  );

  const deposit = await transferProgram.account.deposit.fetch(depositPda);

  return {
    user: deposit.user,
    username: deposit.username,
    amount: deposit.amount.toNumber(),
    lastNonce: deposit.lastNonce.toNumber(),
  };
};
