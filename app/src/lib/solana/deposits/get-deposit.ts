import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { NATIVE_MINT } from "@solana/spl-token";
import { LoyalPrivateTransactionsClient } from "@vladarbatov/private-transactions-test";

import type { TelegramTransfer } from "../../../../../target/types/telegram_transfer";
import type { TelegramDeposit } from "../../../types/deposits";

export const getDeposit = async (
  provider: AnchorProvider,
  transferProgramOrUsername: Program<TelegramTransfer> | string,
  maybeUsername?: string
): Promise<TelegramDeposit> => {
  const username =
    typeof transferProgramOrUsername === "string"
      ? transferProgramOrUsername
      : maybeUsername;

  if (!username) {
    throw new Error("Username is required");
  }

  const privateClient = LoyalPrivateTransactionsClient.fromProvider(provider);
  const deposit = await privateClient.getUsernameDeposit(username, NATIVE_MINT);
  if (!deposit) {
    throw new Error("Deposit account not found");
  }

  return {
    user: provider.publicKey,
    username: deposit.username,
    amount: deposit.amount,
    lastNonce: 0,
    tokenMint: deposit.tokenMint,
    address: deposit.address,
  };
};
