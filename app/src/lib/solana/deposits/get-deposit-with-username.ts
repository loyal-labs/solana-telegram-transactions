import { AnchorProvider } from "@coral-xyz/anchor";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  findUsernameDepositPda,
  LoyalPrivateTransactionsClient,
  type UsernameDepositData,
} from "@vladarbatov/private-transactions-test";

import type { TelegramDeposit } from "../../../types/deposits";

const mapUsernameDepositToTelegramDeposit = (
  provider: AnchorProvider,
  deposit: UsernameDepositData
): TelegramDeposit => ({
  user: provider.publicKey,
  username: deposit.username,
  amount: deposit.amount,
  lastNonce: 0,
  tokenMint: deposit.tokenMint,
  address: deposit.address,
});

export const getDepositWithUsername = async (
  provider: AnchorProvider,
  username: string
): Promise<TelegramDeposit[]> => {
  const privateClient = LoyalPrivateTransactionsClient.fromProvider(provider);
  const deposit = await privateClient.getUsernameDeposit(username, NATIVE_MINT);
  if (!deposit) {
    return [];
  }

  return [mapUsernameDepositToTelegramDeposit(provider, deposit)];
};

export const subscribeToDepositsWithUsername = async (
  provider: AnchorProvider,
  username: string,
  onChange: (deposit: TelegramDeposit) => void
): Promise<() => Promise<void>> => {
  const privateClient = LoyalPrivateTransactionsClient.fromProvider(provider);
  const [depositPda] = findUsernameDepositPda(username, NATIVE_MINT);
  const connection = provider.connection;

  const subscriptionId = await connection.onAccountChange(
    depositPda,
    async () => {
      try {
        const deposit = await privateClient.getUsernameDeposit(
          username,
          NATIVE_MINT
        );
        if (!deposit) {
          return;
        }

        onChange(mapUsernameDepositToTelegramDeposit(provider, deposit));
      } catch (error) {
        console.error("Failed to fetch username deposit account change", error);
      }
    },
    { commitment: "confirmed" }
  );

  return async () => {
    try {
      await connection.removeAccountChangeListener(subscriptionId);
    } catch (error) {
      console.error("Failed to remove deposit subscription", error);
    }
  };
};
