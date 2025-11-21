import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

import { TelegramTransfer } from "../../../../target/types/telegram_transfer";
import { getDepositPda } from "./solana-helpers";
import type { TelegramDeposit } from "./solana-types";

export const createDeposit = async (
  provider: AnchorProvider,
  transferProgram: Program<TelegramTransfer>,
  username: string,
  amount: number
): Promise<TelegramDeposit> => {
  const amountBN = new BN(amount);

  await transferProgram.methods
    .depositForUsername(username, amountBN)
    .accounts({
      payer: provider.wallet.publicKey,
      depositor: provider.wallet.publicKey,
    })
    .rpc({ commitment: "confirmed" });

  const depositPda = getDepositPda(
    provider.wallet.publicKey,
    username,
    transferProgram
  );

  const deposit = await transferProgram.account.deposit.fetch(depositPda);

  return {
    user: deposit.user,
    username: deposit.username,
    amount: deposit.amount,
    lastNonce: deposit.lastNonce,
  };
};
