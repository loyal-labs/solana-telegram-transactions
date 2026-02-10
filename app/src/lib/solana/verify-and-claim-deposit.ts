import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import {
  createCloseAccountInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";

import { resolveEndpoint } from "../core/api";
import { claimDeposit } from "./deposits/claim-deposit";
import { getTelegramVerificationProgram } from "./solana-helpers";
import { storeInitData, verifyInitData } from "./verification";
import { storeInitDataGasless } from "./verification/store-init-data";

export const verifyAndClaimDeposit = async (
  provider: AnchorProvider,
  wallet: Wallet,
  recipient: PublicKey,
  username: string,
  amount: number,
  processedInitDataBytes: Uint8Array,
  telegramSignatureBytes: Uint8Array,
  telegramPublicKeyBytes: Uint8Array
) => {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  const verificationProgram = getTelegramVerificationProgram(provider);

  await storeInitData(
    provider,
    verificationProgram,
    recipient,
    processedInitDataBytes
  );

  await verifyInitData(
    provider,
    wallet,
    recipient,
    verificationProgram,
    processedInitDataBytes,
    telegramSignatureBytes,
    telegramPublicKeyBytes
  );

  const claimed = await claimDeposit(
    provider,
    verificationProgram,
    recipient,
    amount,
    username
  );

  return claimed;
};

export const prepareStoreInitDataTxn = async (
  provider: AnchorProvider,
  payer: PublicKey,
  initData: Uint8Array,
  userWallet: Wallet
) => {
  const verificationProgram = getTelegramVerificationProgram(provider);
  const storeTx = await storeInitDataGasless(
    provider,
    verificationProgram,
    payer,
    initData,
    userWallet
  );
  return storeTx;
};

export const prepareCloseWsolTxn = async (
  provider: AnchorProvider,
  payer: PublicKey,
  userWallet: Wallet
): Promise<Transaction | null> => {
  const userPublicKey = userWallet.publicKey;
  const recipientTokenAccount = await getAssociatedTokenAddress(
    NATIVE_MINT,
    userPublicKey
  );
  const existingAta = await provider.connection.getAccountInfo(
    recipientTokenAccount
  );
  if (!existingAta) {
    return null;
  }

  const closeTx = new Transaction().add(
    createCloseAccountInstruction(
      recipientTokenAccount,
      userPublicKey,
      userPublicKey
    )
  );

  const { blockhash, lastValidBlockHeight } =
    await provider.connection.getLatestBlockhash();
  closeTx.feePayer = payer;
  closeTx.recentBlockhash = blockhash;
  closeTx.lastValidBlockHeight = lastValidBlockHeight;

  await userWallet.signTransaction(closeTx);

  return closeTx;
};

export const sendStoreInitDataTxn = async (
  storeTx: Transaction,
  recipientPubKey: PublicKey,
  username: string,
  amount: number,
  processedInitDataBytes: Uint8Array,
  telegramSignatureBytes: Uint8Array,
  telegramPublicKeyBytes: Uint8Array,
  closeTx?: Transaction
) => {
  const serializedStoreTx = storeTx
    .serialize({ requireAllSignatures: false })
    .toString("base64");
  const serializedCloseTx = closeTx
    ? closeTx.serialize({ requireAllSignatures: false }).toString("base64")
    : null;
  const encodeBytes = (bytes: Uint8Array) =>
    Buffer.from(bytes).toString("base64");

  const endpoint = resolveEndpoint("/api/gasless/claim");
  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify({
      storeTx: serializedStoreTx,
      recipientPubKey,
      username,
      amount,
      processedInitDataBytes: encodeBytes(processedInitDataBytes),
      telegramSignatureBytes: encodeBytes(telegramSignatureBytes),
      telegramPublicKeyBytes: encodeBytes(telegramPublicKeyBytes),
      closeTx: serializedCloseTx,
    }),
  });
  if (!response.ok) {
    const rawResponseBody = await response.text();
    let errorDetails = `${response.status} ${response.statusText}`;

    if (rawResponseBody) {
      try {
        const parsedBody = JSON.parse(rawResponseBody) as {
          error?: unknown;
          details?: unknown;
        };
        const errorMessage =
          typeof parsedBody.error === "string" ? parsedBody.error : null;
        const detailMessage =
          typeof parsedBody.details === "string" ? parsedBody.details : null;

        if (errorMessage && detailMessage) {
          errorDetails = `${errorMessage}: ${detailMessage}`;
        } else if (errorMessage) {
          errorDetails = errorMessage;
        } else {
          errorDetails = rawResponseBody;
        }
      } catch {
        errorDetails = rawResponseBody;
      }
    }

    throw new Error(
      `Failed to send store init data transaction: ${errorDetails}`
    );
  }
  return response.json();
};
