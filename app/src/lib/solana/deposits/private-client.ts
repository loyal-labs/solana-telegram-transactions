import { LoyalPrivateTransactionsClient } from "@vladarbatov/private-transactions-test";

import { getEndpoints, getSolanaEnv } from "../rpc/connection";
import { PER_RPC_ENDPOINT, PER_WS_ENDPOINT } from "../rpc/constants";
import { getWalletKeypair } from "../wallet/wallet-details";

let cachedPrivateClient: LoyalPrivateTransactionsClient | null = null;
let cachedPrivateClientPromise: Promise<LoyalPrivateTransactionsClient> | null =
  null;

export const getPrivateClient =
  async (): Promise<LoyalPrivateTransactionsClient> => {
    const keypair = await getWalletKeypair();
    if (cachedPrivateClient) return cachedPrivateClient;
    if (!cachedPrivateClientPromise) {
      const selectedSolanaEnv = getSolanaEnv();
      const { rpcEndpoint, websocketEndpoint } =
        getEndpoints(selectedSolanaEnv);
      cachedPrivateClientPromise = LoyalPrivateTransactionsClient.fromConfig({
        signer: keypair,
        baseRpcEndpoint: rpcEndpoint,
        baseWsEndpoint: websocketEndpoint,
        ephemeralRpcEndpoint: PER_RPC_ENDPOINT,
        ephemeralWsEndpoint: PER_WS_ENDPOINT,
      }).then((client) => {
        cachedPrivateClient = client;
        return client;
      });
    }
    return cachedPrivateClientPromise;
  };
