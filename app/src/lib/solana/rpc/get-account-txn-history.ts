import {
  type ParsedInnerInstruction,
  type ParsedInstruction,
  type ParsedMessage,
  type ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
  PublicKey,
} from "@solana/web3.js";

import {
  decodeTelegramTransferInstruction,
  decodeTelegramVerificationInstruction,
} from "../solana-helpers";
import { getConnection, getWebsocketConnection } from "./connection";
import { GetAccountTransactionHistoryOptions, WalletTransfer } from "./types";

type ListenForAccountTransactionsOptions = {
  onlySystemTransfers?: boolean;
};

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

  const allInstructionsWithData = [
    ...(message.instructions as (
      | ParsedInstruction
      | PartiallyDecodedInstruction
    )[]),
    ...((innerInstructions ?? []) as ParsedInnerInstruction[]).flatMap(
      (ix: ParsedInnerInstruction) =>
        (ix.instructions ?? []) as (
          | ParsedInstruction
          | PartiallyDecodedInstruction
        )[]
    ),
  ].filter(
    (ix): ix is PartiallyDecodedInstruction =>
      "data" in ix &&
      typeof (ix as PartiallyDecodedInstruction).data === "string"
  );

  const knownInstructionTypes: WalletTransfer["type"][] = [
    "verify_telegram_init_data",
    "store",
    "claim_deposit",
    "deposit_for_username",
  ];

  const decodeInstructionData = (data: string) => {
    const decoders = [
      decodeTelegramTransferInstruction,
      decodeTelegramVerificationInstruction,
    ];

    for (const decode of decoders) {
      try {
        const decoded = decode(data);
        if (decoded) return decoded;
      } catch (err) {
        continue;
      }
    }

    return null;
  };

  const decodedInstruction = allInstructionsWithData
    .map((ix) => decodeInstructionData(ix.data))
    .find((decoded) => decoded !== null);

  const decodedType = decodedInstruction?.name;

  const type: WalletTransfer["type"] =
    decodedType &&
    knownInstructionTypes.includes(decodedType as WalletTransfer["type"])
      ? (decodedType as WalletTransfer["type"])
      : "transfer";

  if (type === "deposit_for_username") {
    const usernameFromInstruction = (
      decodedInstruction?.data as { username?: string }
    )?.username;
    if (usernameFromInstruction) {
      counterparty = usernameFromInstruction;
    }
  }

  const returnObject = {
    signature,
    slot: tx.slot,
    timestamp: tx.blockTime ? tx.blockTime * 1000 : null,
    direction,
    type,
    amountLamports,
    netChangeLamports,
    feeLamports: safeMeta.fee ?? 0,
    status: safeMeta.err ? "failed" : "success",
    counterparty,
  };

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

export const listenForAccountTransactions = async (
  publicKey: PublicKey,
  onTransfer: (transfer: WalletTransfer) => void,
  options: ListenForAccountTransactionsOptions = {}
): Promise<() => Promise<void>> => {
  const connection = getWebsocketConnection();
  const walletAddress = publicKey.toBase58();
  const processedSignatures = new Set<string>();
  const rememberSignature = (sig: string) => {
    processedSignatures.add(sig);
    if (processedSignatures.size > 100) {
      const [first] = processedSignatures;
      processedSignatures.delete(first);
    }
  };

  const subscriptionId = await connection.onLogs(
    publicKey,
    async (logInfo) => {
      try {
        const signature = logInfo.signature;
        if (!signature) return;
        if (processedSignatures.has(signature)) return;
        rememberSignature(signature);

        const parsedTx = await connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });
        if (!parsedTx) return;

        const transfer = mapTransactionToTransfer(
          parsedTx,
          signature,
          walletAddress,
          options.onlySystemTransfers ?? false
        );
        if (transfer) {
          onTransfer(transfer);
        }
      } catch (err) {
        console.error("Error handling websocket transaction", err);
      }
    },
    "confirmed"
  );

  return async () => {
    await connection.removeOnLogsListener(subscriptionId);
  };
};
