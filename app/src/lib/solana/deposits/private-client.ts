import { LoyalPrivateTransactionsClient } from "@loyal-labs/private-transactions";
import {
  getAuthToken,
  verifyTeeRpcIntegrity,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import type { Keypair } from "@solana/web3.js";
import { sign } from "tweetnacl";

import { PRIVATE_AUTH_TOKEN_STORAGE_KEY_PREFIX } from "../../constants";
import {
  getCloudValue,
  setCloudValue,
} from "../../telegram/mini-app/cloud-storage";
import { getEndpoints, getSolanaEnv } from "../rpc/connection";
import { PER_RPC_ENDPOINT, PER_WS_ENDPOINT } from "../rpc/constants";
import { getWalletKeypair } from "../wallet/wallet-details";

const AUTH_TOKEN_REFRESH_BUFFER_MS = 60_000;

type StoredPrivateAuthToken = {
  token: string;
  expiresAt: number;
  endpoint: string;
};

const getPrivateAuthTokenStorageKey = (publicKey: string): string =>
  `${PRIVATE_AUTH_TOKEN_STORAGE_KEY_PREFIX}_${publicKey}`;

const parseStoredPrivateAuthToken = (
  value: string,
): StoredPrivateAuthToken | null => {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;

    const { token, expiresAt, endpoint } = parsed as {
      token?: unknown;
      expiresAt?: unknown;
      endpoint?: unknown;
    };

    if (typeof token !== "string" || !token) return null;
    if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
      return null;
    }
    if (typeof endpoint !== "string" || !endpoint) return null;

    return { token, expiresAt, endpoint };
  } catch (error) {
    console.error("Failed to parse cached private auth token", error);
    return null;
  }
};

const isAuthTokenFresh = (token: StoredPrivateAuthToken): boolean =>
  token.endpoint === PER_RPC_ENDPOINT &&
  token.expiresAt > Date.now() + AUTH_TOKEN_REFRESH_BUFFER_MS;

const getCachedAuthToken = async (
  publicKey: string,
): Promise<{ token: string; expiresAt: number } | null> => {
  const storageKey = getPrivateAuthTokenStorageKey(publicKey);
  const cachedValue = await getCloudValue(storageKey);

  if (typeof cachedValue !== "string" || !cachedValue) {
    return null;
  }

  const parsedToken = parseStoredPrivateAuthToken(cachedValue);
  if (!parsedToken) return null;
  if (!isAuthTokenFresh(parsedToken)) return null;

  return {
    token: parsedToken.token,
    expiresAt: parsedToken.expiresAt,
  };
};

const fetchAndCacheAuthToken = async (
  keypair: Keypair,
): Promise<{ token: string; expiresAt: number } | null> => {
  try {
    const isVerified = await verifyTeeRpcIntegrity(PER_RPC_ENDPOINT);
    if (!isVerified) {
      console.error("TEE RPC integrity verification failed");
      return null;
    }

    const signMessage = (message: Uint8Array): Promise<Uint8Array> =>
      Promise.resolve(sign.detached(message, keypair.secretKey));

    const authToken = await getAuthToken(
      PER_RPC_ENDPOINT,
      keypair.publicKey,
      signMessage,
    );

    const storageKey = getPrivateAuthTokenStorageKey(
      keypair.publicKey.toBase58(),
    );
    const persisted = await setCloudValue(
      storageKey,
      JSON.stringify({
        ...authToken,
        endpoint: PER_RPC_ENDPOINT,
      }),
    );

    if (!persisted) {
      console.error("Failed to persist private auth token to cloud storage");
    }

    return authToken;
  } catch (error) {
    console.error("Failed to fetch private auth token", error);
    return null;
  }
};

let cachedPrivateClient: LoyalPrivateTransactionsClient | null = null;
let cachedPrivateClientPromise: Promise<LoyalPrivateTransactionsClient> | null =
  null;

export const getPrivateClient =
  async (): Promise<LoyalPrivateTransactionsClient> => {
    const keypair = await getWalletKeypair();
    if (cachedPrivateClient) return cachedPrivateClient;
    if (!cachedPrivateClientPromise) {
      cachedPrivateClientPromise = (async () => {
        const selectedSolanaEnv = getSolanaEnv();
        const { rpcEndpoint, websocketEndpoint } =
          getEndpoints(selectedSolanaEnv);

        const cachedAuthToken = await getCachedAuthToken(
          keypair.publicKey.toBase58(),
        );
        const authToken =
          cachedAuthToken ?? (await fetchAndCacheAuthToken(keypair));
        cachedPrivateClient = await LoyalPrivateTransactionsClient.fromConfig({
          signer: keypair,
          baseRpcEndpoint: rpcEndpoint,
          baseWsEndpoint: websocketEndpoint,
          ephemeralRpcEndpoint: PER_RPC_ENDPOINT,
          ephemeralWsEndpoint: PER_WS_ENDPOINT,
          authToken: authToken ?? undefined,
        });
        return cachedPrivateClient;
      })();
    }
    return cachedPrivateClientPromise;
  };
