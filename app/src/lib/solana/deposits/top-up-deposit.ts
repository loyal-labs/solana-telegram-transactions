import { AnchorProvider } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
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

export type TopUpDepositResult = {
  deposit: TelegramDeposit;
  signature: string;
};

export async function wrapSolToWSol(opts: {
  connection: Connection;
  provider: AnchorProvider;
  lamports: number;
}): Promise<{ wsolAta: PublicKey; createdAta: boolean }> {
  const { connection, provider, lamports } = opts;

  const wsolAta = await getAssociatedTokenAddress(
    NATIVE_MINT,
    provider.publicKey
  );

  const instructions: TransactionInstruction[] = [];
  let createdAta = false;

  const ataInfo = await connection.getAccountInfo(wsolAta);
  if (!ataInfo) {
    createdAta = true;
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

  return { wsolAta, createdAta };
}

async function closeTemporaryWsolAta(
  provider: AnchorProvider,
  wsolAta: PublicKey,
  createdAta: boolean
): Promise<void> {
  if (!createdAta) return;

  try {
    const closeTx = new Transaction().add(
      createCloseAccountInstruction(
        wsolAta,
        provider.publicKey,
        provider.publicKey
      )
    );
    await provider.sendAndConfirm(closeTx);
  } catch (error) {
    console.error("Failed to close temporary wSOL ATA after top up", error);
  }
}

export const topUpDeposit = async (
  provider: AnchorProvider,
  username: string,
  amount: number
): Promise<TopUpDepositResult> => {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const privateClient = LoyalPrivateTransactionsClient.fromProvider(provider);

  const { wsolAta, createdAta } = await wrapSolToWSol({
    connection: provider.connection,
    provider,
    lamports: amount,
  });

  try {
    await privateClient.initializeDeposit({
      tokenMint: NATIVE_MINT,
      user: provider.publicKey,
      payer: provider.publicKey,
    });

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
    await closeTemporaryWsolAta(provider, wsolAta, createdAta);
  }
};
