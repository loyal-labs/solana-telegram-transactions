import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  clusterApiUrl,
  ComputeBudgetProgram,
  Connection,
  Ed25519Program,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { NextResponse } from "next/server";

import {
  getDepositPda,
  getSessionPda,
  getTelegramTransferProgram,
  getTelegramVerificationProgram,
  getVaultPda,
} from "@/lib/solana/solana-helpers";
import { SimpleWallet } from "@/lib/solana/wallet/wallet-implementation";

type GaslessRequest = {
  serializedTransaction: string;
  sender: string;
  recipient: string;
  username: string;
  amountLamports: number;
  processedInitData: string;
  telegramSignature: string;
  telegramPublicKey: string;
};

const defaultEndpoint = clusterApiUrl("devnet");
const rpcEndpoint =
  process.env.SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  defaultEndpoint;

let cachedConnection: Connection | null = null;
let cachedPayer: Keypair | null = null;

const getConnection = () => {
  if (cachedConnection) return cachedConnection;
  cachedConnection = new Connection(rpcEndpoint, "confirmed");
  return cachedConnection;
};

const getPayer = (): Keypair => {
  if (cachedPayer) return cachedPayer;

  const secret =
    process.env.GASLESS_PAYER_SECRET_KEY ||
    process.env.SOLANA_GASLESS_PAYER_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing GASLESS_PAYER_SECRET_KEY env");
  }

  const decoded = bs58.decode(secret.trim());
  cachedPayer = Keypair.fromSecretKey(decoded);
  return cachedPayer;
};

const decodeBytes = (value: string, field: string): Buffer => {
  const trimmed = value.trim();
  const isHex = /^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0;

  try {
    return isHex ? Buffer.from(trimmed, "hex") : Buffer.from(trimmed, "base64");
  } catch (error) {
    throw new Error(`Invalid encoding for ${field}`);
  }
};

const instructionsMatch = (
  left: TransactionInstruction,
  right: TransactionInstruction
) => {
  if (!left.programId.equals(right.programId)) return false;
  if (!left.data.equals(right.data)) return false;
  if (left.keys.length !== right.keys.length) return false;

  return left.keys.every((key, index) => {
    const other = right.keys[index];
    return (
      key.pubkey.equals(other.pubkey) &&
      key.isSigner === other.isSigner &&
      key.isWritable === other.isWritable
    );
  });
};

const findSignatureForKey = (
  tx: Transaction,
  key: PublicKey
): Uint8Array | null => {
  const entry = tx.signatures.find((sig) => sig.publicKey.equals(key));
  return entry?.signature ?? null;
};

export async function POST(req: Request) {
  try {
    const body: GaslessRequest = await req.json();
    const {
      serializedTransaction,
      sender,
      recipient,
      username,
      amountLamports,
      processedInitData,
      telegramSignature,
      telegramPublicKey,
    } = body;

    if (
      !serializedTransaction ||
      !sender ||
      !recipient ||
      !username ||
      !processedInitData ||
      !telegramSignature ||
      !telegramPublicKey
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(amountLamports) ||
      amountLamports <= 0 ||
      !Number.isInteger(amountLamports)
    ) {
      return NextResponse.json(
        { error: "amountLamports must be greater than 0" },
        { status: 400 }
      );
    }

    const senderPk = new PublicKey(sender);
    const recipientPk = new PublicKey(recipient);

    const tx = Transaction.from(Buffer.from(serializedTransaction, "base64"));
    const payer = getPayer();

    if (!tx.recentBlockhash) {
      return NextResponse.json(
        { error: "Transaction blockhash is missing" },
        { status: 400 }
      );
    }

    if (!tx.feePayer || !tx.feePayer.equals(payer.publicKey)) {
      return NextResponse.json(
        { error: "Transaction fee payer must be the backend payer" },
        { status: 400 }
      );
    }

    const messageBytes = tx.serializeMessage();
    const userSignature = findSignatureForKey(tx, recipientPk);
    if (!userSignature) {
      return NextResponse.json(
        { error: "Missing user signature on transaction" },
        { status: 400 }
      );
    }

    const ed25519 = await import("@noble/ed25519");
    const isSignatureValid = await ed25519.verify(
      userSignature,
      messageBytes,
      recipientPk.toBytes()
    );
    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Invalid user signature" },
        { status: 400 }
      );
    }

    const connection = getConnection();
    const provider = new AnchorProvider(connection, new SimpleWallet(payer));
    const transferProgram = getTelegramTransferProgram(provider);
    const verificationProgram = getTelegramVerificationProgram(provider);

    const sessionPda = getSessionPda(recipientPk, verificationProgram);
    const depositPda = getDepositPda(senderPk, username, transferProgram);
    const vaultPda = getVaultPda(transferProgram);

    const processedInitDataBytes = decodeBytes(
      processedInitData,
      "processedInitData"
    );
    const telegramSignatureBytes = decodeBytes(
      telegramSignature,
      "telegramSignature"
    );
    const telegramPublicKeyBytes = decodeBytes(
      telegramPublicKey,
      "telegramPublicKey"
    );
    if (
      telegramPublicKeyBytes.length !== 32 ||
      telegramSignatureBytes.length !== 64
    ) {
      return NextResponse.json(
        { error: "Invalid Telegram signature or public key length" },
        { status: 400 }
      );
    }
    if (processedInitDataBytes.length === 0) {
      return NextResponse.json(
        { error: "processedInitData must not be empty" },
        { status: 400 }
      );
    }

    const storeIx = await verificationProgram.methods
      .store(Buffer.from(processedInitDataBytes))
      .accounts({
        payer: payer.publicKey,
        user: recipientPk,
        // @ts-expect-error - sessionPda is a PublicKey
        session: sessionPda,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

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
      .instruction();

    const claimIx = await transferProgram.methods
      .claimDeposit(new BN(amountLamports))
      .accounts({
        recipient: recipientPk,
        // @ts-expect-error - vaultPda is a PublicKey
        vault: vaultPda,
        deposit: depositPda,
        session: sessionPda,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const expected = [storeIx, ed25519Ix, verifyIx, claimIx];
    const actual = tx.instructions.filter(
      (ix) => !ix.programId.equals(ComputeBudgetProgram.programId)
    );

    if (actual.length !== expected.length) {
      return NextResponse.json(
        { error: "Unexpected instruction count" },
        { status: 400 }
      );
    }

    const matches = expected.every((ix, idx) =>
      instructionsMatch(ix, actual[idx])
    );

    if (!matches) {
      return NextResponse.json(
        { error: "Transaction instructions do not match expected flow" },
        { status: 400 }
      );
    }

    tx.sign(payer);

    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
    });
    await connection.confirmTransaction(signature, "confirmed");

    return NextResponse.json({ signature });
  } catch (error) {
    console.error("[gasless] error", error);
    return NextResponse.json(
      { error: "Failed to process gasless transaction" },
      { status: 500 }
    );
  }
}
