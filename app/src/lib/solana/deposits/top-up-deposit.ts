import { AnchorProvider } from "@coral-xyz/anchor";
import { NATIVE_MINT } from "@solana/spl-token";

import type { TelegramDeposit } from "../../../types/deposits";
import { getDeposit } from "./get-deposit";
import { getPrivateClient } from "./private-client";
import { closeWsolAta, wrapSolToWSol } from "./wsol-utils";

export type TopUpDepositResult = {
  deposit: TelegramDeposit;
  signature: string;
};

export const topUpDeposit = async (
  provider: AnchorProvider,
  username: string,
  amount: number
): Promise<TopUpDepositResult> => {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const privateClient = await getPrivateClient();

  const payer = provider.wallet.payer!;
  const { wsolAta, createdAta } = await wrapSolToWSol({
    connection: provider.connection,
    payer,
    lamports: amount,
  });

  try {
    // todo: fix topup
    throw Error("top up is not enabled");

    // await privateClient.initializeDeposit({
    //   tokenMint: NATIVE_MINT,
    //   user: provider.publicKey,
    //   payer: provider.publicKey,
    // });

    const signature = await privateClient.depositForUsername({
      username,
      tokenMint: NATIVE_MINT,
      amount,
      depositor: provider.publicKey,
      payer: provider.publicKey,
      depositorTokenAccount: wsolAta,
    });

    const deposit = await getDeposit(provider, username);
    return { deposit, signature };
  } finally {
    if (createdAta) {
      await closeWsolAta({ connection: provider.connection, payer, wsolAta });
    }
  }
};
