import { PublicKey } from "@solana/web3.js";

import { TelegramDeposit } from "@/types/deposits";

import { getDepositWithUsername } from "./deposits";

export const fetchDeposits = async (
  user: PublicKey,
  username: string
): Promise<TelegramDeposit[]> => {
  if (!username) {
    throw new Error("Username is required");
  }
  if (username.length > 32 || username.length < 5) {
    throw new Error("Username must be between 5 and 32 characters");
  }

  const deposits = await getDepositWithUsername(user, username);

  const filteredDeposits = deposits.filter((deposit) => deposit.amount > 0);

  return filteredDeposits;
};
