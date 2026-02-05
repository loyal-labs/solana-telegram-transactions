import { AnchorProvider } from "@coral-xyz/anchor";

import { getTelegramTransferProgram, numberToBN } from "./solana-helpers";

export const topUpDeposit = async (
  provider: AnchorProvider,
  username: string,
  amount: number
) => {
  const transferProgram = getTelegramTransferProgram(provider);
  const userPublicKey = provider.wallet.publicKey;
  const amountBN = numberToBN(amount);

  try {
    await transferProgram.methods
      .depositForUsername(username, amountBN)
      .accounts({
        payer: userPublicKey,
        depositor: userPublicKey,
      })
      .rpc({ commitment: "confirmed" });
    return true;
  } catch (error) {
    console.error("Failed to top up deposit", error);
    return false;
  }
};
