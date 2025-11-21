import { AnchorProvider, Program } from "@coral-xyz/anchor";

import type { TelegramTransfer } from "../../../../../target/types/telegram_transfer";
import { numberToBN } from "../solana-helpers";
import { getDeposit } from "./get-deposit";
import type { TelegramDeposit } from "./types";

// TODO: add check for sufficient balance
export const topUpDeposit = async (
  provider: AnchorProvider,
  transferProgram: Program<TelegramTransfer>,
  username: string,
  amount: number
): Promise<TelegramDeposit> => {
  const amountBN = numberToBN(amount);

  await transferProgram.methods
    .depositForUsername(username, amountBN)
    .accounts({
      payer: provider.wallet.publicKey,
      depositor: provider.wallet.publicKey,
    })
    .rpc({ commitment: "confirmed" });

  const deposit = await getDeposit(provider, transferProgram, username);
  return deposit;
};
