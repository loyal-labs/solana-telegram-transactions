import { type Connection, PublicKey } from "@solana/web3.js";
import type { AnchorWallet } from "@/hooks/use-anchor-wallet";

import { generateCmk } from "../loyal/encryption";
import { fetchIrysTransactionData } from "../loyal/http";
import {
  createOrRestoreEphemeralKeypair,
  getIrysUploader,
} from "../loyal/irys";
import { createUserChat } from "../loyal/service";
import type { UserContext } from "../loyal/types";
import { createEmptyTableOfContents } from "./helpers";
import type { IrysChatTurn, IrysTableOfContents } from "./types";

export async function fetchIrysTableOfContents(
  transactionId: string
): Promise<IrysTableOfContents> {
  const { data } = await fetchIrysTransactionData<ArrayBuffer>(transactionId);
  const decoded = new TextDecoder().decode(data);
  const parsed = JSON.parse(decoded) as {
    irysKey?: unknown;
    key?: unknown;
    entries?: Array<{ tx_id?: unknown } | null | undefined>;
  };

  const irysKey =
    typeof parsed.irysKey === "string"
      ? parsed.irysKey
      : typeof parsed.key === "string"
        ? parsed.key
        : undefined;

  const entries =
    parsed.entries?.reduce<IrysTableOfContents["entries"]>((acc, entry) => {
      if (!entry || typeof entry.tx_id !== "string") {
        return acc;
      }

      return [...acc, { tx_id: new PublicKey(entry.tx_id) }];
    }, []) ?? [];

  return {
    irysKey,
    entries,
  };
}

export async function fetchIrysChatTurn(
  transactionId: string
): Promise<IrysChatTurn> {
  console.log("Fetching chat turn", transactionId);
  const { data } = await fetchIrysTransactionData<ArrayBuffer>(transactionId);
  const decoded = new TextDecoder().decode(data);

  const parsed = JSON.parse(decoded) as {
    role?: unknown;
    text?: unknown;
    model?: unknown;
    createdAt?: unknown;
  };

  if (parsed.role !== "user" && parsed.role !== "assistant") {
    throw new Error("Invalid chat turn role received from Irys.");
  }

  if (typeof parsed.text !== "string") {
    throw new Error("Missing chat turn text from Irys.");
  }

  if (typeof parsed.createdAt !== "string") {
    throw new Error("Missing chat turn createdAt from Irys.");
  }

  const chatTurn: IrysChatTurn = {
    role: parsed.role,
    text: parsed.text,
    createdAt: parsed.createdAt,
  };

  if (typeof parsed.model === "string") {
    chatTurn.model = parsed.model;
  }

  return chatTurn;
}

export async function createAndUploadChat(
  connection: Connection,
  wallet: AnchorWallet,
  query: string,
  context: UserContext
) {
  console.log("Creating chat");

  // 1. preparing for chat set up
  const kp = createOrRestoreEphemeralKeypair();
  const irysUploader = await getIrysUploader(kp, connection);
  const emptyTableOfContents = createEmptyTableOfContents();

  const receipt = await irysUploader.upload(
    JSON.stringify(emptyTableOfContents)
  );

  // 2. deriving encryption for the first time
  const receiptId = receipt.id;

  console.log("Receipt of table of contents", receipt);

  const cmk = generateCmk();

  // 3. encrypting the query and uploading it to Irys
  const queryJson = {
    role: "user",
    text: query,
    createdAt: new Date().toISOString(),
  };
  // const encryptedQueryJson = await encryptJsonWithDek(dek, queryJson);
  const receiptQuery = await irysUploader.upload(JSON.stringify(queryJson));
  const queryId = receiptQuery.id;

  // 4. updating the table of contents with new query
  emptyTableOfContents.entries.push({
    tx_id: new PublicKey(queryId),
  });
  const tags = [
    { name: "Content-Type", value: "application/json" },
    { name: "Root-TX", value: receiptId },
  ];

  console.log("Uploading table of contents", emptyTableOfContents);

  const result = await irysUploader.upload(
    JSON.stringify(emptyTableOfContents),
    { tags }
  );
  console.log("Result", result);

  // 5. create new onchain chat entity
  await createUserChat(
    connection,
    wallet,
    context,
    new PublicKey(cmk),
    new PublicKey(receiptId)
  );
}
