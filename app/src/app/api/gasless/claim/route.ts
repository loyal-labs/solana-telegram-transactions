import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import {
  Ed25519Program,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import { NextResponse } from "next/server";

import {
  getDepositPda,
  getTelegramTransferProgram,
  getTelegramVerificationProgram,
  getVaultPda,
  numberToBN,
} from "@/lib/solana/solana-helpers";
import { getSessionPda } from "@/lib/solana/solana-helpers";
import { getGaslessKeypair } from "@/lib/solana/wallet/gasless-keypair.server";
import {
  getCustomWalletProvider,
} from "@/lib/solana/wallet/wallet-details";
import { SimpleWallet } from "@/lib/solana/wallet/wallet-implementation";

import { TelegramTransfer } from "../../../../../../target/types/telegram_transfer";
import { TelegramVerification } from "../../../../../../target/types/telegram_verification";

const normalizeBytes = (value: unknown): Uint8Array => {
  if (typeof value === "string") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  if (Array.isArray(value)) {
    return Uint8Array.from(value);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([k, v]) => [Number(k), v as number])
      .sort(([a], [b]) => a - b)
      .map(([, v]) => v);
    return Uint8Array.from(entries);
  }
  throw new Error("Invalid byte array format");
};

const deserializeTransaction = (
  serializedTx: string
): Transaction | VersionedTransaction => {
  const buffer = Buffer.from(serializedTx, "base64");
  try {
    return VersionedTransaction.deserialize(buffer);
  } catch {
    return Transaction.from(buffer);
  }
};

const storeInitData = async (
  anchorProvider: AnchorProvider,
  transaction: Transaction | VersionedTransaction,
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

const verifyInitDataGasless = async (
  provider: AnchorProvider,
  verificationProgram: Program<TelegramVerification>,
  payerWallet: Wallet,
  recipientPubKey: PublicKey,
  telegramPublicKeyBytes: Uint8Array,
  telegramSignatureBytes: Uint8Array,
  processedInitDataBytes: Uint8Array
): Promise<boolean> => {
  const sessionPda = getSessionPda(recipientPubKey, verificationProgram);
  const payerPubKey = payerWallet.publicKey;
  const ed25519Ix = Ed25519Program.createInstructionWithPublicKey({
    publicKey: telegramPublicKeyBytes,
    message: processedInitDataBytes,
    signature: telegramSignatureBytes,
  });

  const verifyIx = await verificationProgram.methods
    .verifyTelegramInitData()
    .accounts({
      session: sessionPda,
      // @ts-expect-error - SYSVAR_INSTRUCTIONS_PUBKEY is a PublicKey
      instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .transaction();

  const verifyTx = new Transaction().add(ed25519Ix, verifyIx);

  const { blockhash, lastValidBlockHeight } =
    await provider.connection.getLatestBlockhash();
  verifyTx.feePayer = payerPubKey;
  verifyTx.recentBlockhash = blockhash;
  verifyTx.lastValidBlockHeight = lastValidBlockHeight;
  await payerWallet.signTransaction(verifyTx);

  let threw = false;
  try {
    const sig = await provider.connection.sendRawTransaction(
      verifyTx.serialize(),
      {
        skipPreflight: false,
      }
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  } catch (e) {
    threw = true;
    console.error("Error:", e);
  }
  return !threw;
};

const claimDepositGasless = async (
  provider: AnchorProvider,
  transferProgram: Program<TelegramTransfer>,
  verificationProgram: Program<TelegramVerification>,
  payerWallet: Wallet,
  userPubKey: PublicKey,
  recipientPubKey: PublicKey,
  amount: number,
  username: string
): Promise<boolean> => {
  const vaultPda = getVaultPda(transferProgram);
  const depositPda = getDepositPda(userPubKey, username, transferProgram);
  const payerPubKey = payerWallet.publicKey;
  const sessionPda = getSessionPda(recipientPubKey, verificationProgram);
  const amountBN = numberToBN(amount);

  const claimTx = await transferProgram.methods
    .claimDeposit(amountBN)
    .accounts({
      recipient: recipientPubKey,
      // @ts-expect-error - vaultPda is a PublicKey
      vault: vaultPda,
      deposit: depositPda,
      session: sessionPda,
    })
    .transaction();
  const { blockhash, lastValidBlockHeight } =
    await provider.connection.getLatestBlockhash();
  claimTx.feePayer = payerPubKey;
  claimTx.recentBlockhash = blockhash;
  claimTx.lastValidBlockHeight = lastValidBlockHeight;
  await payerWallet.signTransaction(claimTx);

  let threw = false;
  try {
    const sig = await provider.connection.sendRawTransaction(
      claimTx.serialize(),
      {
        skipPreflight: false,
      }
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  } catch (e) {
    threw = true;
    console.error("Error:", e);
  }
  return !threw;
};

const verifyAndClaimDeposit = async (
  provider: AnchorProvider,
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

  await verifyInitDataGasless(
    provider,
    verificationProgram,
    payerWallet,
    recipient,
    telegramPublicKeyBytes,
    telegramSignatureBytes,
    processedInitDataBytes
  );

  const claimed = await claimDepositGasless(
    provider,
    transferProgram,
    verificationProgram,
    payerWallet,
    user,
    recipient,
    amount,
    username
  );

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
    const bodyString = new TextDecoder().decode(body);
    const bodyJson = JSON.parse(bodyString);

    const {
      storeTx,
      userPubKey,
      recipientPubKey,
      username,
      amount,
      processedInitDataBytes,
      telegramSignatureBytes,
      telegramPublicKeyBytes,
    } = bodyJson;

    if (
      !storeTx ||
      !userPubKey ||
      !recipientPubKey ||
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
    if (typeof storeTx !== "string") {
      return NextResponse.json(
        { error: "Invalid transaction format" },
        { status: 400 }
      );
    }
    const payer = await getGaslessKeypair();
    const provider = await getCustomWalletProvider(payer);
    const payerWallet = new SimpleWallet(payer);

    const parsedStoreTx = deserializeTransaction(storeTx);
    const parsedUser = new PublicKey(userPubKey);
    const parsedRecipient = new PublicKey(recipientPubKey);
    const processedInitData = normalizeBytes(processedInitDataBytes);
    const telegramSignature = normalizeBytes(telegramSignatureBytes);
    const telegramPublicKey = normalizeBytes(telegramPublicKeyBytes);

    const storeResult = await storeInitData(
      provider,
      parsedStoreTx,
      payerWallet
    );
    if (!storeResult) {
      return NextResponse.json(
        { error: "Failed to store init data" },
        { status: 500 }
      );
    }

    const result = await verifyAndClaimDeposit(
      provider,
      payerWallet,
      parsedUser,
      parsedRecipient,
      username,
      amount,
      processedInitData,
      telegramSignature,
      telegramPublicKey
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
