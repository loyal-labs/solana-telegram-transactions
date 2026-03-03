import type { Keypair, PublicKey } from "@solana/web3.js";

export type UserContext = {
  owner: PublicKey;
  nextChatId: number;
};

export type ChatStatus = {
  PENDING: 1;
  DONE: 2;
  ERROR: 3;
};

export type UserChat = {
  address: PublicKey;
  user: PublicKey;
  id: number;
  createdAt: number;
  status: ChatStatus;
  cmk: PublicKey;
  txId: PublicKey;
};

export type GeneratedSolanaKeypair = {
  keypair: Keypair;
  publicKeyBase58: string;
  secretKey: Uint8Array;
};
