"use server";

import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { NextResponse } from "next/server";

import { claimDeposit } from "@/lib/solana/deposits/claim-deposit";
import {
  getTelegramTransferProgram,
  getTelegramVerificationProgram,
} from "@/lib/solana/solana-helpers";
import { verifyInitData } from "@/lib/solana/verification/verify-init-data";
import {
  getCustomWalletProvider,
  getGaslessKeypair,
} from "@/lib/solana/wallet/wallet-details";
import { SimpleWallet } from "@/lib/solana/wallet/wallet-implementation";

const storeInitData = async (
  anchorProvider: AnchorProvider,
  transaction: Transaction,
  payerWallet: Wallet
): Promise<boolean> => {
  await payerWallet.signTransaction(transaction);

  let threw = false;
  try {
    const sig = await anchorProvider.connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
      }
    );
    await anchorProvider.connection.confirmTransaction(sig, "confirmed");
  } catch (e) {
    threw = true;
    console.error("Error:", e);
  }
  if (threw) {
    throw new Error("Error sending transaction");
  }

  return !threw;
};

const verifyAndClaimDeposit = async (
  provider: AnchorProvider,
  transaction: Transaction,
  payerWallet: Wallet,
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

  const sessionData = await storeInitData(provider, transaction, payerWallet);

  const verified = await verifyInitData(
    provider,
    payerWallet,
    recipient,
    verificationProgram,
    processedInitDataBytes,
    telegramSignatureBytes,
    telegramPublicKeyBytes
  );
  console.log("verified:", verified);

  const claimed = await claimDeposit(
    transferProgram,
    verificationProgram,
    user,
    recipient,
    amount,
    username
  );
  console.log("claimed:", claimed);

  return claimed;
};

export async function POST(req: Request) {
  try {
    const body = await req.arrayBuffer();
    if (!body || body.byteLength === 0) {
      return NextResponse.json(
        { error: "initData bytes are required" },
        { status: 400 }
      );
    }

    const {
      transaction,
      user,
      recipient,
      username,
      amount,
      processedInitDataBytes,
      telegramSignatureBytes,
      telegramPublicKeyBytes,
    } = await req.json();
    if (
      !transaction ||
      !user ||
      !recipient ||
      !username ||
      !amount ||
      !processedInitDataBytes ||
      !telegramSignatureBytes ||
      !telegramPublicKeyBytes
    ) {
      return NextResponse.json(
        { error: "transaction and payer are required" },
        { status: 400 }
      );
    }
    const payer = await getGaslessKeypair();
    const provider = await getCustomWalletProvider(payer);
    const payerWallet = new SimpleWallet(payer);

    const storeResult = await storeInitData(provider, transaction, payerWallet);
    if (!storeResult) {
      return NextResponse.json(
        { error: "Failed to store init data" },
        { status: 500 }
      );
    }

    const result = await verifyAndClaimDeposit(
      provider,
      transaction,
      payerWallet,
      user,
      recipient,
      username,
      amount,
      processedInitDataBytes,
      telegramSignatureBytes,
      telegramPublicKeyBytes
    );
    if (!result) {
      return NextResponse.json(
        { error: "Failed to claim deposit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: result });
  } catch (error) {
    console.error("[gasless][claim] failed to claim deposit", error);
    return NextResponse.json(
      { error: "Failed to claim deposit" },
      { status: 500 }
    );
  }
}
