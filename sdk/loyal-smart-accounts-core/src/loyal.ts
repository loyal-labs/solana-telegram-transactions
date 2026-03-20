import {
  createLoyalSmartAccountsClient,
} from "@loyal-labs/loyal-smart-accounts";
import { Connection, type Commitment } from "@solana/web3.js";
import { getSolanaEndpoints, type SolanaEnv } from "@loyal-labs/solana-rpc";
import type { LoyalSmartAccountsClientConfig } from "./transport.js";

type CreateConnection = (
  rpcEndpoint: string,
  websocketEndpoint: string,
  commitment: Commitment
) => Connection;

export type CreateLoyalSmartAccountsClientFromEnvConfig = Omit<
  LoyalSmartAccountsClientConfig,
  "connection" | "defaultCommitment"
> & {
  env: SolanaEnv;
  commitment?: Commitment;
  connection?: Connection;
  createConnection?: CreateConnection;
};

const connectionCache = new Map<string, Connection>();
const DEFAULT_COMMITMENT: Commitment = "confirmed";

function getCacheKey(
  rpcEndpoint: string,
  websocketEndpoint: string,
  commitment: Commitment
): string {
  return `${rpcEndpoint}::${websocketEndpoint}::${commitment}`;
}

function getOrCreateConnection(
  env: SolanaEnv,
  commitment: Commitment,
  createConnection?: CreateConnection
): Connection {
  const { rpcEndpoint, websocketEndpoint } = getSolanaEndpoints(env);
  const cacheKey = getCacheKey(rpcEndpoint, websocketEndpoint, commitment);
  const cached = connectionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const connection = createConnection
    ? createConnection(rpcEndpoint, websocketEndpoint, commitment)
    : new Connection(rpcEndpoint, {
        commitment,
        wsEndpoint: websocketEndpoint,
      });

  connectionCache.set(cacheKey, connection);
  return connection;
}

export function createLoyalSmartAccountsClientFromEnv(
  config: CreateLoyalSmartAccountsClientFromEnvConfig
): ReturnType<typeof createLoyalSmartAccountsClient> {
  const commitment = config.commitment ?? DEFAULT_COMMITMENT;
  const connection =
    config.connection ??
    getOrCreateConnection(config.env, commitment, config.createConnection);

  return createLoyalSmartAccountsClient({
    connection,
    programId: config.programId,
    defaultCommitment: commitment,
    sendPrepared: config.sendPrepared,
    confirm: config.confirm,
  });
}
