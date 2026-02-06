import { AnchorProvider } from "@coral-xyz/anchor";

import { topUpDeposit as topUpPrivateDeposit } from "./deposits/top-up-deposit";

export const topUpDeposit = async (
  provider: AnchorProvider,
  username: string,
  amount: number
) => {
  try {
    await topUpPrivateDeposit(provider, username, amount);
    return true;
  } catch (error) {
    console.error("Failed to top up deposit", error);
    return false;
  }
};
