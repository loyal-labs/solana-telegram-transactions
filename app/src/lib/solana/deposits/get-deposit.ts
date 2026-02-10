import { AnchorProvider } from "@coral-xyz/anchor";
import { NATIVE_MINT } from "@solana/spl-token";
import { LoyalPrivateTransactionsClient } from "@vladarbatov/private-transactions-test";

import type { TelegramDeposit } from "../../../types/deposits";

export const getDeposit = async (
  provider: AnchorProvider,
  username: string
): Promise<TelegramDeposit> => {
  const privateClient = LoyalPrivateTransactionsClient.fromProvider(provider);
  const deposit = await privateClient.getUsernameDeposit(username, NATIVE_MINT);
  if (!deposit) {
    throw new Error("Deposit account not found");
  }

  return {
    user: provider.publicKey,
    username: deposit.username,
    amount: Number(deposit.amount),
    lastNonce: 0,
    tokenMint: deposit.tokenMint,
    address: deposit.address,
  };
};
