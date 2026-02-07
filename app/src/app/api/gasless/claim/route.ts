"use server";

import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
} from "@solana/spl-token";
import {
  Ed25519Program,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import { LoyalPrivateTransactionsClient } from "@vladarbatov/private-transactions-test";
import { NextResponse } from "next/server";

import {
  getSessionPda,
  getTelegramVerificationProgram,
} from "@/lib/solana/solana-helpers";
import {
  getCustomWalletProvider,
  getGaslessKeypair,
  getGaslessPublicKey,
} from "@/lib/solana/wallet/wallet-details";
import { SimpleWallet } from "@/lib/solana/wallet/wallet-implementation";

import { TelegramVerification } from "../../../../../../target/types/telegram_verification";

const TELEGRAM_USERNAME_REGEX = /^[A-Za-z0-9_]{5,32}$/;

type TransactionSendResult =
  | { ok: true; signature: string }
  | { ok: false; message: string; logs?: string[] };

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

const extractUsernameFromValidationBytes = (
  validationBytes: Uint8Array
): string => {
  const payload = new TextDecoder().decode(validationBytes);
  const userStart = payload.includes("\nuser=")
    ? payload.indexOf("\nuser=") + "\nuser=".length
    : payload.startsWith("user=")
    ? "user=".length
    : -1;

  if (userStart < 0) {
    throw new Error("Invalid Telegram init data: missing user payload");
  }

  const userRest = payload.slice(userStart);
  const userLineEnd = userRest.indexOf("\n");
  const userLine = userLineEnd >= 0 ? userRest.slice(0, userLineEnd) : userRest;

  let parsedUser: unknown;
  try {
    parsedUser = JSON.parse(userLine);
  } catch {
    throw new Error("Invalid Telegram init data: malformed user payload");
  }

  const username =
    parsedUser &&
    typeof parsedUser === "object" &&
    "username" in parsedUser &&
    typeof (parsedUser as { username?: unknown }).username === "string"
      ? (parsedUser as { username: string }).username
      : null;

  if (!username || !TELEGRAM_USERNAME_REGEX.test(username)) {
    throw new Error("Invalid Telegram username in init data");
  }

  return username;
};

const parseTransactionError = async (
  error: unknown
): Promise<{ message: string; logs?: string[] }> => {
  let message =
    error instanceof Error ? error.message : "Transaction simulation failed";
  let logs: string[] | undefined;

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      transactionMessage?: unknown;
      transactionLogs?: unknown;
      logs?: unknown;
      getLogs?: unknown;
    };

    if (typeof candidate.message === "string" && candidate.message) {
      message = candidate.message;
    }
    if (
      typeof candidate.transactionMessage === "string" &&
      candidate.transactionMessage
    ) {
      message = candidate.transactionMessage;
    }

    if (Array.isArray(candidate.transactionLogs)) {
      logs = candidate.transactionLogs.filter(
        (line): line is string => typeof line === "string"
      );
    } else if (Array.isArray(candidate.logs)) {
      logs = candidate.logs.filter(
        (line): line is string => typeof line === "string"
      );
    }

    if ((!logs || logs.length === 0) && typeof candidate.getLogs === "function") {
      try {
        const fetchedLogs = await (candidate.getLogs as () => Promise<unknown>)();
        if (Array.isArray(fetchedLogs)) {
          logs = fetchedLogs.filter(
            (line): line is string => typeof line === "string"
          );
        }
      } catch {
        // Ignore log fetch errors and keep base message.
      }
    }
  }

  return { message, logs };
};

const isInvalidTelegramUsernameFailure = ({
  message,
  logs,
}: {
  message: string;
  logs?: string[];
}): boolean => {
  const fullText = [message, ...(logs ?? [])].join("\n");
  return (
    fullText.includes("InvalidTelegramUsername") ||
    fullText.includes("Invalid Telegram username") ||
    fullText.includes("Error Number: 6007") ||
    fullText.includes("0x1777")
  );
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

const sendSignedTransaction = async (
  provider: AnchorProvider,
  transaction: Transaction | VersionedTransaction,
  payerWallet: Wallet
): Promise<TransactionSendResult> => {
  await payerWallet.signTransaction(transaction);

  try {
    const sig = await provider.connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
      }
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
    return { ok: true, signature: sig };
  } catch (error) {
    const parsedError = await parseTransactionError(error);
    return {
      ok: false,
      message: parsedError.message,
      logs: parsedError.logs,
    };
  }
};

const ensureRecipientTokenAccount = async (
  provider: AnchorProvider,
  payerWallet: Wallet,
  recipientPubKey: PublicKey
): Promise<PublicKey> => {
  const recipientTokenAccount = await getAssociatedTokenAddress(
    NATIVE_MINT,
    recipientPubKey
  );

  const ataInfo = await provider.connection.getAccountInfo(recipientTokenAccount);
  if (ataInfo) {
    return recipientTokenAccount;
  }

  const createAtaTx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      payerWallet.publicKey,
      recipientTokenAccount,
      recipientPubKey,
      NATIVE_MINT
    )
  );
  const { blockhash, lastValidBlockHeight } =
    await provider.connection.getLatestBlockhash();
  createAtaTx.feePayer = payerWallet.publicKey;
  createAtaTx.recentBlockhash = blockhash;
  createAtaTx.lastValidBlockHeight = lastValidBlockHeight;

  const created = await sendSignedTransaction(provider, createAtaTx, payerWallet);
  if (!created.ok) {
    throw new Error(
      `Failed to create recipient token account: ${created.message}`
    );
  }

  return recipientTokenAccount;
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

  const verifyResult = await sendSignedTransaction(provider, verifyTx, payerWallet);
  return verifyResult.ok;
};

const claimDepositGasless = async (
  provider: AnchorProvider,
  payerWallet: Wallet,
  verificationProgram: Program<TelegramVerification>,
  recipientPubKey: PublicKey,
  amount: number,
  username: string
): Promise<boolean> => {
  try {
    const privateClient = LoyalPrivateTransactionsClient.fromProvider(provider);
    const sessionPda = getSessionPda(recipientPubKey, verificationProgram);
    const recipientTokenAccount = await ensureRecipientTokenAccount(
      provider,
      payerWallet,
      recipientPubKey
    );

    await privateClient.claimUsernameDeposit({
      username,
      tokenMint: NATIVE_MINT,
      amount,
      recipient: recipientPubKey,
      recipientTokenAccount,
      session: sessionPda,
    });
  } catch (error) {
    console.error("Error:", error);
    return false;
  }

  return true;
};

const verifyAndClaimDeposit = async (
  provider: AnchorProvider,
  payerWallet: Wallet,
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

  const verified = await verifyInitDataGasless(
    provider,
    verificationProgram,
    payerWallet,
    recipient,
    telegramPublicKeyBytes,
    telegramSignatureBytes,
    processedInitDataBytes
  );
  if (!verified) {
    return false;
  }

  const claimed = await claimDepositGasless(
    provider,
    payerWallet,
    verificationProgram,
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
      closeTx,
      recipientPubKey,
      username,
      amount,
      processedInitDataBytes,
      telegramSignatureBytes,
      telegramPublicKeyBytes,
    } = bodyJson;
    const parsedAmountRaw =
      typeof amount === "string" ? Number.parseInt(amount, 10) : amount;
    const parsedAmount =
      typeof parsedAmountRaw === "number" &&
      Number.isFinite(parsedAmountRaw) &&
      parsedAmountRaw > 0
        ? parsedAmountRaw
        : null;

    if (
      !storeTx ||
      !recipientPubKey ||
      !username ||
      parsedAmount === null ||
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

    if (closeTx && typeof closeTx !== "string") {
      return NextResponse.json(
        { error: "Invalid close transaction format" },
        { status: 400 }
      );
    }

    if (typeof recipientPubKey !== "string" || typeof username !== "string") {
      return NextResponse.json(
        { error: "Invalid recipient or username format" },
        { status: 400 }
      );
    }

    const payer = await getGaslessKeypair();
    const configuredGaslessPublicKey = await getGaslessPublicKey();
    if (!payer.publicKey.equals(configuredGaslessPublicKey)) {
      return NextResponse.json(
        { error: "Gasless keypair does not match configured public key" },
        { status: 500 }
      );
    }

    const provider = await getCustomWalletProvider(payer);
    const payerWallet = new SimpleWallet(payer);

    const parsedStoreTx = deserializeTransaction(storeTx);
    const parsedCloseTx = closeTx ? deserializeTransaction(closeTx) : null;
    const parsedRecipient = new PublicKey(recipientPubKey);
    const processedInitData = normalizeBytes(processedInitDataBytes);
    const telegramSignature = normalizeBytes(telegramSignatureBytes);
    const telegramPublicKey = normalizeBytes(telegramPublicKeyBytes);

    let initDataUsername: string;
    try {
      initDataUsername = extractUsernameFromValidationBytes(processedInitData);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Invalid Telegram init data payload";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (initDataUsername !== username) {
      return NextResponse.json(
        {
          error:
            "Telegram init-data username does not match the deposit username",
          details: `initData=${initDataUsername}, deposit=${username}`,
        },
        { status: 400 }
      );
    }

    const storeResult = await sendSignedTransaction(
      provider,
      parsedStoreTx,
      payerWallet
    );
    if (!storeResult.ok) {
      const invalidUsername = isInvalidTelegramUsernameFailure(storeResult);
      return NextResponse.json(
        {
          error: invalidUsername
            ? "Invalid Telegram username in init data"
            : "Failed to store init data",
          details: storeResult.message,
        },
        { status: invalidUsername ? 400 : 500 }
      );
    }

    const result = await verifyAndClaimDeposit(
      provider,
      payerWallet,
      parsedRecipient,
      username,
      parsedAmount,
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

    if (parsedCloseTx) {
      const closeResult = await sendSignedTransaction(
        provider,
        parsedCloseTx,
        payerWallet
      );
      if (!closeResult.ok) {
        return NextResponse.json(
          {
            error: "Failed to unwrap SOL",
            details: closeResult.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[gasless][claim] failed to claim deposit", error);
    return NextResponse.json(
      { error: "Failed to claim deposit" },
      { status: 500 }
    );
  }
}
