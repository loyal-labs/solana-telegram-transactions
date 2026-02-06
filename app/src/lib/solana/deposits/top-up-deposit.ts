import { AnchorProvider } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { LoyalPrivateTransactionsClient } from "@vladarbatov/private-transactions-test";

import type { TelegramDeposit } from "../../../types/deposits";
import { getDeposit } from "./get-deposit";

export async function wrapSolToWSol(opts: {
  connection: Connection;
  provider: AnchorProvider;
  lamports: number;
}): Promise<PublicKey> {
  const { connection, provider, lamports } = opts;

  const wsolAta = await getAssociatedTokenAddress(
    NATIVE_MINT,
    provider.publicKey
  );

  const instructions: TransactionInstruction[] = [];

  const ataInfo = await connection.getAccountInfo(wsolAta);
  if (!ataInfo) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        provider.publicKey,
        wsolAta,
        provider.publicKey,
        NATIVE_MINT
      )
    );
  }

  instructions.push(
    SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: wsolAta,
      lamports,
    })
  );

  instructions.push(createSyncNativeInstruction(wsolAta));

  const tx = new Transaction().add(...instructions);
  await provider.sendAndConfirm(tx);

  return wsolAta;
}

export const topUpDeposit = async (
  provider: AnchorProvider,
  username: string,
  amount: number
): Promise<TelegramDeposit> => {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const privateClient = LoyalPrivateTransactionsClient.fromProvider(provider);

  const wsolAta = await wrapSolToWSol({
    connection: provider.connection,
    provider,
    lamports: amount,
  });

  await privateClient.initializeDeposit({
    tokenMint: NATIVE_MINT,
    user: provider.publicKey,
    payer: provider.publicKey,
  });

  await privateClient.depositForUsername({
    username,
    tokenMint: NATIVE_MINT,
    amount,
    depositor: provider.publicKey,
    payer: provider.publicKey,
    depositorTokenAccount: wsolAta,
  });

  const deposit = await getDeposit(provider, username);
  return deposit;
};
