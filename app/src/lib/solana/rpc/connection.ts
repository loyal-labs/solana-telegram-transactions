import { Connection } from "@solana/web3.js";

import { publicEnv } from "@/lib/core/config/public";

import {
  LOCALNET_RPC_URL,
  LOCALNET_RPC_WS,
  SECURE_DEVNET_RPC_URL,
  SECURE_DEVNET_RPC_WS,
  SECURE_MAINNET_RPC_URL,
  SECURE_MAINNET_RPC_WS,
  TESTNET_RPC_URL,
  TESTNET_RPC_WS,
} from "./constants";
import type { SolanaEnv } from "./types";

export const getSolanaEnv = (): SolanaEnv => {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("solana-env-override");
    if (
      override === "mainnet" ||
      override === "testnet" ||
      override === "devnet" ||
      override === "localnet"
    ) {
      return override;
    }
  }

  return publicEnv.solanaEnv;
};

export const getEndpoints = (
  env: SolanaEnv
): { rpcEndpoint: string; websocketEndpoint: string } => {
  switch (env) {
    case "mainnet":
      return {
        rpcEndpoint: SECURE_MAINNET_RPC_URL,
        websocketEndpoint: SECURE_MAINNET_RPC_WS,
      };
    case "testnet":
      return {
        rpcEndpoint: TESTNET_RPC_URL,
        websocketEndpoint: TESTNET_RPC_WS,
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
export const { rpcEndpoint, websocketEndpoint } =
  getEndpoints(selectedSolanaEnv);

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
