import { Program } from "@coral-xyz/anchor";

import { TelegramTransfer } from "../../../../../target/types/telegram_transfer";
import { encodeAnchorStringFilter } from "../solana-helpers";
import { TelegramDeposit } from "./types";

export const getDepositWithUsername = async (
  transferProgram: Program<TelegramTransfer>,
  username: string
): Promise<TelegramDeposit[]> => {
  const filters = [
    {
      memcmp: {
        offset: 8 + 32,
        bytes: encodeAnchorStringFilter(username),
      },
    },
  ];

  const accounts = await transferProgram.account.deposit.all(filters);
  const deposits = accounts.map(({ account }) => ({
    user: account.user,
    username: account.username,
    amount: account.amount.toNumber(),
    lastNonce: account.lastNonce.toNumber(),
  }));

  return deposits;
};
