import type { PublicKey } from "@solana/web3.js";

export type ChatRole = "user" | "assistant";

export type IrysTableOfContentsEntry = {
  tx_id: PublicKey;
};

export type IrysTableOfContents = {
  irysKey: string | undefined;
  entries: IrysTableOfContentsEntry[];
};

export type IrysChatTurn = {
  role: ChatRole;
  text: string;
  model?: string;
  createdAt: string;
};

export type IrysUploadFile = IrysTableOfContents | IrysChatTurn;
