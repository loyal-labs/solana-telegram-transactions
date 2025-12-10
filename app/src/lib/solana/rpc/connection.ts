import { Connection } from "@solana/web3.js";

import {
  SECURE_DEVNET_RPC_URL,
  SECURE_DEVNET_RPC_WS,
  SECURE_MAINNET_RPC_URL,
  SECURE_MAINNET_RPC_WS,
} from "./constants";

const defaultSolanaEnv = "devnet";
const selectedSolanaEnv =
  process.env.NEXT_PUBLIC_SOLANA_ENV || defaultSolanaEnv;

const rpcEndpoint =
  selectedSolanaEnv === "mainnet"
    ? SECURE_MAINNET_RPC_URL
    : SECURE_DEVNET_RPC_URL;
const websocketEndpoint =
  selectedSolanaEnv === "mainnet"
    ? SECURE_MAINNET_RPC_WS
    : SECURE_DEVNET_RPC_WS;

let cachedConnection: Connection | null = null;
let cachedWebsocketConnection: Connection | null = null;
const connectionConfig = { commitment: "confirmed" as const };

export const getConnection = (): Connection => {
  if (cachedConnection) return cachedConnection;
  console.log(selectedSolanaEnv);
  console.log(rpcEndpoint);

  cachedConnection = new Connection(rpcEndpoint, connectionConfig);
  return cachedConnection;
};

export const getWebsocketConnection = (): Connection => {
  if (cachedWebsocketConnection) return cachedWebsocketConnection;
  cachedWebsocketConnection = new Connection(rpcEndpoint, {
    ...connectionConfig,
    wsEndpoint: websocketEndpoint,
  });
  return cachedWebsocketConnection;
};
