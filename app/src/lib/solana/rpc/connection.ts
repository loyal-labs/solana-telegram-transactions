import { Connection } from "@solana/web3.js";

import { SECURE_DEVNET_RPC_URL, SECURE_MAINNET_RPC_URL } from "./constants";

const defaultSolanaEnv = "devnet";
const selectedSolanaEnv =
  process.env.NEXT_PUBLIC_SOLANA_ENV || defaultSolanaEnv;
const rpcEndpoint =
  selectedSolanaEnv === "mainnet"
    ? SECURE_MAINNET_RPC_URL
    : SECURE_DEVNET_RPC_URL;
let cachedConnection: Connection | null = null;

export const getConnection = (): Connection => {
  if (cachedConnection) return cachedConnection;
  cachedConnection = new Connection(rpcEndpoint, "confirmed");
  return cachedConnection;
};
