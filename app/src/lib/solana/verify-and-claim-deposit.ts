import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

import { claimDeposit } from "./deposits/claim-deposit";
import {
  getTelegramTransferProgram,
  getTelegramVerificationProgram,
} from "./solana-helpers";
import { storeInitData, verifyInitData } from "./verification";

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

  await claimDeposit(
    transferProgram,
    verificationProgram,
    user,
    recipient,
    amount,
    username
  );

  return true;
};
