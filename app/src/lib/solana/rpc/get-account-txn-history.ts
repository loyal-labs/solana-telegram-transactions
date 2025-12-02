import {
  type ParsedInnerInstruction,
  type ParsedInstruction,
  type ParsedMessage,
  type ParsedTransactionWithMeta,
  PublicKey,
} from "@solana/web3.js";

import { getConnection } from "./connection";
import { GetAccountTransactionHistoryOptions, WalletTransfer } from "./types";

const accountKeyToString = (
  key: ParsedMessage["accountKeys"][number] | PublicKey | string
): string => {
  if (typeof key === "string") return key;
  if ("pubkey" in (key as ParsedMessage["accountKeys"][number])) {
    const parsed = key as ParsedMessage["accountKeys"][number];
    return parsed.pubkey.toString();
  }
  const maybePubkey = key as PublicKey;
  return maybePubkey?.toString ? maybePubkey.toString() : String(key);
};

const findSystemTransfer = (
  message: ParsedMessage,
  innerInstructions: ParsedInnerInstruction[] | null | undefined,
  walletAddress: string
): ParsedInstruction | undefined => {
  const topLevel = (message.instructions ?? []) as ParsedInstruction[];
  const innerList: ParsedInnerInstruction[] = innerInstructions ?? [];
  const inner = innerList.flatMap((ix: ParsedInnerInstruction) => {
    const instructions = ix.instructions ?? [];
    return instructions as ParsedInstruction[];
  });

  const allInstructions = [...topLevel, ...inner];

  return allInstructions.find((ix) => {
    if (ix.program !== "system") return false;
    const parsed = (
      ix as ParsedInstruction & { parsed?: { info?: Record<string, string> } }
    ).parsed;
    const info = parsed?.info;
    if (!info) return false;

    const source = info.source;
    const dest = info.destination ?? info.newAccount;
    if (source !== walletAddress && dest !== walletAddress) return false;

    return parsed?.type === "transfer" || parsed?.type === "createAccount";
  });
};

const mapTransactionToTransfer = (
  tx: ParsedTransactionWithMeta,
  signature: string,
  walletAddress: string,
  onlySystemTransfers: boolean
): WalletTransfer | null => {
  const meta = tx.meta;
  if (!meta || !tx.transaction) return null;
  const safeMeta = meta as NonNullable<typeof meta>;

  const message = tx.transaction.message as ParsedMessage;
  const innerInstructions = safeMeta.innerInstructions as
    | ParsedInnerInstruction[]
    | null
    | undefined;

  const accountIndex = message.accountKeys.findIndex(
    (key) => accountKeyToString(key) === walletAddress
  );
  if (accountIndex === -1) return null;

  const preLamports = safeMeta.preBalances?.[accountIndex] ?? 0;
  const postLamports = safeMeta.postBalances?.[accountIndex] ?? 0;
  const netChangeLamports = postLamports - preLamports;
  if (netChangeLamports === 0) return null;

  const direction: "in" | "out" = netChangeLamports > 0 ? "in" : "out";
  const amountLamports = Math.abs(netChangeLamports);

  const systemTransfer = findSystemTransfer(
    message,
    innerInstructions,
    walletAddress
  );
  if (onlySystemTransfers && !systemTransfer) return null;

  let counterparty: string | undefined;
  if (systemTransfer && "parsed" in systemTransfer) {
    const info = (
      systemTransfer as ParsedInstruction & {
        parsed?: { info?: Record<string, string> };
      }
    ).parsed?.info;
    if (info) {
      counterparty =
        direction === "in"
          ? info.source ?? undefined
          : info.destination ?? undefined;
    }
  }

  const returnObject = {
    signature,
    slot: tx.slot,
    timestamp: tx.blockTime ? tx.blockTime * 1000 : null,
    direction,
    amountLamports,
    netChangeLamports,
    feeLamports: safeMeta.fee ?? 0,
    status: safeMeta.err ? "failed" : "success",
    counterparty,
  };

  console.log("returnObject", returnObject);

  return returnObject as WalletTransfer;
};

export const getAccountTransactionHistory = async (
  publicKey: PublicKey,
  options: GetAccountTransactionHistoryOptions = {}
): Promise<{ transfers: WalletTransfer[]; nextCursor?: string }> => {
  const connection = getConnection();

  const signatures = await connection.getSignaturesForAddress(publicKey, {
    limit: options.limit ?? 10,
    before: options.before,
  });

  if (signatures.length === 0) {
    return { transfers: [], nextCursor: undefined };
  }

  const signatureList = signatures.map((s) => s.signature);
  const parsedTransactions = await connection.getParsedTransactions(
    signatureList,
    {
      maxSupportedTransactionVersion: 0,
    }
  );
  console.log("parsedTransactions", parsedTransactions);

  const transfers: WalletTransfer[] = [];

  for (let i = 0; i < parsedTransactions.length; i++) {
    const tx = parsedTransactions[i];
    const signature = signatureList[i];
    if (!tx) continue;

    const transfer = mapTransactionToTransfer(
      tx,
      signature,
      publicKey.toString(),
      options.onlySystemTransfers ?? false
    );

    if (transfer) {
      transfers.push(transfer);
    }
  }

  const nextCursor = signatures[signatures.length - 1]?.signature;

  return { transfers, nextCursor };
};
