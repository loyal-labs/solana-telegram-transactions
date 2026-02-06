import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import { LoyalPrivateTransactionsClient } from "@vladarbatov/private-transactions-test";

import type { TelegramVerification } from "../../../../../target/types/telegram_verification";
import { getSessionPda } from "../solana-helpers";

const ensureRecipientTokenAccount = async (
  provider: AnchorProvider,
  recipient: PublicKey
): Promise<{ recipientTokenAccount: PublicKey; createdAta: boolean }> => {
  const recipientTokenAccount = await getAssociatedTokenAddress(
    NATIVE_MINT,
    recipient
  );
  const ataInfo = await provider.connection.getAccountInfo(recipientTokenAccount);
  if (ataInfo) {
    return { recipientTokenAccount, createdAta: false };
  }

  const transaction = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      provider.publicKey,
      recipientTokenAccount,
      recipient,
      NATIVE_MINT
    )
  );
  await provider.sendAndConfirm(transaction);
  return { recipientTokenAccount, createdAta: true };
};

export const claimDeposit = async (
  provider: AnchorProvider,
  verificationProgram: Program<TelegramVerification>,
  recipient: PublicKey,
  amount: number,
  username: string
): Promise<boolean> => {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const privateClient = LoyalPrivateTransactionsClient.fromProvider(provider);
  const sessionPda = getSessionPda(recipient, verificationProgram);
  const { recipientTokenAccount, createdAta } = await ensureRecipientTokenAccount(
    provider,
    recipient
  );

  await privateClient.claimUsernameDeposit({
    username,
    tokenMint: NATIVE_MINT,
    amount,
    recipient,
    recipientTokenAccount,
    session: sessionPda,
  });

  if (createdAta) {
    const unwrapTransaction = new Transaction().add(
      createCloseAccountInstruction(
        recipientTokenAccount,
        recipient,
        recipient
      )
    );
    await provider.sendAndConfirm(unwrapTransaction);
  }

  return true;
};
