import { Connection } from "@solana/web3.js";

import {
  LOCALNET_RPC_URL,
  LOCALNET_RPC_WS,
  SECURE_DEVNET_RPC_URL,
  SECURE_DEVNET_RPC_WS,
  SECURE_MAINNET_RPC_URL,
  SECURE_MAINNET_RPC_WS,
} from "./constants";
import type { SolanaEnv } from "./types";

const DEFAULT_SOLANA_ENV: SolanaEnv = "devnet";

export const getSolanaEnv = (): SolanaEnv => {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("solana-env-override");
    if (override === "mainnet" || override === "devnet" || override === "localnet") {
      return override;
    }
  }
  const env = process.env.NEXT_PUBLIC_SOLANA_ENV;
  if (env === "mainnet" || env === "devnet" || env === "localnet") {
    return env;
  }
  return DEFAULT_SOLANA_ENV;
};

const getEndpoints = (
  env: SolanaEnv
): { rpcEndpoint: string; websocketEndpoint: string } => {
  switch (env) {
    case "mainnet":
      return {
        rpcEndpoint: SECURE_MAINNET_RPC_URL,
        websocketEndpoint: SECURE_MAINNET_RPC_WS,
      };
    case "localnet":
      return {
        rpcEndpoint: LOCALNET_RPC_URL,
        websocketEndpoint: LOCALNET_RPC_WS,
      };
    case "devnet":
    default:
      return {
        rpcEndpoint: SECURE_DEVNET_RPC_URL,
        websocketEndpoint: SECURE_DEVNET_RPC_WS,
      };
  }
};

const selectedSolanaEnv = getSolanaEnv();
const { rpcEndpoint, websocketEndpoint } = getEndpoints(selectedSolanaEnv);

let cachedConnection: Connection | null = null;
let cachedWebsocketConnection: Connection | null = null;
const connectionConfig = { commitment: "confirmed" as const };

export const getConnection = (): Connection => {
  if (cachedConnection) return cachedConnection;
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
