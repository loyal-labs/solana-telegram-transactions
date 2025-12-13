import { Program } from "@coral-xyz/anchor";

import { TelegramTransfer } from "../../../../../target/types/telegram_transfer";
import { TelegramDeposit } from "../../../types/deposits";
import { encodeAnchorStringFilter } from "../solana-helpers";

const depositFilter = (username: string) => ({
  memcmp: {
    offset: 8 + 32,
    bytes: encodeAnchorStringFilter(username),
  },
});

const depositFilters = (username: string) => [depositFilter(username)];

export const getDepositWithUsername = async (
  transferProgram: Program<TelegramTransfer>,
  username: string
): Promise<TelegramDeposit[]> => {
  const filters = depositFilters(username);

  const accounts = await transferProgram.account.deposit.all(filters);
  const deposits = accounts.map(({ account }) => ({
    user: account.user,
    username: account.username,
    amount: account.amount.toNumber(),
    lastNonce: account.lastNonce.toNumber(),
  }));

  return deposits;
};

export const subscribeToDepositsWithUsername = async (
  transferProgram: Program<TelegramTransfer>,
  username: string,
  onChange: (deposit: TelegramDeposit) => void
): Promise<() => Promise<void>> => {
  const filters = depositFilters(username);
  const connection = transferProgram.provider.connection;
  const programId = transferProgram.programId;

  const subscriptionId = await connection.onProgramAccountChange(
    programId,
    (keyedAccountInfo) => {
      try {
        const account = transferProgram.coder.accounts.decode(
          "deposit",
          keyedAccountInfo.accountInfo.data
        );

        const deposit: TelegramDeposit = {
          user: account.user,
          username: account.username,
          amount: account.amount.toNumber(),
          lastNonce: account.lastNonce.toNumber(),
        };

        onChange(deposit);
      } catch (error) {
        console.error("Failed to decode deposit account change", error);
      }
    },
    { commitment: "confirmed", filters }
  );

  return async () => {
    try {
      await connection.removeProgramAccountChangeListener(subscriptionId);
    } catch (error) {
      console.error("Failed to remove deposit subscription", error);
    }
  };
};
