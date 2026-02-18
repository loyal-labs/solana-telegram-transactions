import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";

// import { TelegramVerification } from "../../../../target/types/telegram_verification";
import { resolveEndpoint } from "../core/api";
import { claimDeposit } from "./deposits/claim-deposit";
import {
  getTelegramTransferProgram,
  getTelegramVerificationProgram,
} from "./solana-helpers";
import { storeInitData, verifyInitData } from "./verification";
import { storeInitDataGasless } from "./verification/store-init-data";

export const verifyAndClaimDeposit = async (
  provider: AnchorProvider,
  wallet: Wallet,
  user: PublicKey,
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
  const transferProgram = getTelegramTransferProgram(provider);
  const verificationProgram = getTelegramVerificationProgram(provider);

  const _sessionData = await storeInitData(
    provider,
    verificationProgram,
    recipient,
    processedInitDataBytes
  );

  const _verified = await verifyInitData(
    provider,
    wallet,
    recipient,
    verificationProgram,
    processedInitDataBytes,
    telegramSignatureBytes,
    telegramPublicKeyBytes
  );

  const claimed = await claimDeposit(
    transferProgram,
    verificationProgram,
    user,
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

export const sendStoreInitDataTxn = async (
  storeTx: Transaction,
  userPubKey: PublicKey,
  recipientPubKey: PublicKey,
  username: string,
  amount: number,
  processedInitDataBytes: Uint8Array,
  telegramSignatureBytes: Uint8Array,
  telegramPublicKeyBytes: Uint8Array
) => {
  const serializedStoreTx = storeTx
    .serialize({ requireAllSignatures: false })
    .toString("base64");
  const encodeBytes = (bytes: Uint8Array) =>
    Buffer.from(bytes).toString("base64");

  const endpoint = resolveEndpoint("/api/gasless/claim");
  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify({
      storeTx: serializedStoreTx,
      userPubKey,
      recipientPubKey,
      username,
      amount,
      processedInitDataBytes: encodeBytes(processedInitDataBytes),
      telegramSignatureBytes: encodeBytes(telegramSignatureBytes),
      telegramPublicKeyBytes: encodeBytes(telegramPublicKeyBytes),
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to send store init data transaction: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};
