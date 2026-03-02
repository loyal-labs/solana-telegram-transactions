import { LoyalPrivateTransactionsClient } from "@loyal-labs/private-transactions";
import {
  getAuthToken,
  verifyTeeRpcIntegrity,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import type { Keypair } from "@solana/web3.js";
import { sign } from "tweetnacl";

import { PRIVATE_AUTH_TOKEN_STORAGE_KEY_PREFIX } from "../../constants";
import {
  deleteCloudValue,
  getCloudValue,
  setCloudValue,
} from "../../telegram/mini-app/cloud-storage";
import { getEndpoints, getSolanaEnv } from "../rpc/connection";
import { PER_RPC_ENDPOINT, PER_WS_ENDPOINT } from "../rpc/constants";
import { getWalletKeypair, getWalletPublicKey } from "../wallet/wallet-details";

const AUTH_TOKEN_REFRESH_BUFFER_MS = 60_000;

type StoredPrivateAuthToken = {
  token: string;
  expiresAt: number;
  endpoint: string;
};

const getPrivateAuthTokenStorageKey = (publicKey: string): string =>
  `${PRIVATE_AUTH_TOKEN_STORAGE_KEY_PREFIX}_${publicKey}`;

const parseStoredPrivateAuthToken = (
  value: string
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
  publicKey: string
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

const verifyTeeIntegrity = (): void => {
  const t0 = performance.now();
  verifyTeeRpcIntegrity(PER_RPC_ENDPOINT)
    .then((isVerified) => {
      console.log(
        `[private-client] verifyTeeRpcIntegrity: ${(
          performance.now() - t0
        ).toFixed(1)}ms`
      );
      if (!isVerified) {
        console.error("TEE RPC integrity verification failed");
      }
    })
    .catch((error) => {
      console.error("TEE RPC integrity verification error", error);
    });
};

const fetchAndCacheAuthToken = async (
  keypair: Keypair
): Promise<{ token: string; expiresAt: number } | null> => {
  try {
    // Fire-and-forget TEE integrity check; logs result but does not block callers
    setTimeout(verifyTeeIntegrity, 10_000);

    const signMessage = (message: Uint8Array): Promise<Uint8Array> =>
      Promise.resolve(sign.detached(message, keypair.secretKey));

    const t1 = performance.now();
    const authToken = await getAuthToken(
      PER_RPC_ENDPOINT,
      keypair.publicKey,
      signMessage
    );
    console.log(
      `[private-client] getAuthToken: ${(performance.now() - t1).toFixed(1)}ms`
    );

    const storageKey = getPrivateAuthTokenStorageKey(
      keypair.publicKey.toBase58()
    );
    const persisted = await setCloudValue(
      storageKey,
      JSON.stringify({
        ...authToken,
        endpoint: PER_RPC_ENDPOINT,
      })
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

export const invalidatePrivateClient = async (): Promise<void> => {
  cachedPrivateClient = null;
  cachedPrivateClientPromise = null;

  try {
    const publicKey = await getWalletPublicKey();
    const storageKey = getPrivateAuthTokenStorageKey(publicKey.toBase58());
    await deleteCloudValue(storageKey);
  } catch {
    // Best-effort: cloud storage clear may fail if wallet isn't available yet
  }
};

export const getPrivateClient = async ({
  forceRecreate = false,
}: {
  forceRecreate?: boolean;
} = {}): Promise<LoyalPrivateTransactionsClient> => {
  if (cachedPrivateClient) return cachedPrivateClient;
  if (!cachedPrivateClientPromise) {
    cachedPrivateClientPromise = (async () => {
      if (forceRecreate) await invalidatePrivateClient();

      const keypair = await getWalletKeypair();
      const selectedSolanaEnv = getSolanaEnv();
      const { rpcEndpoint, websocketEndpoint } =
        getEndpoints(selectedSolanaEnv);

      const cachedAuthToken = await getCachedAuthToken(
        keypair.publicKey.toBase58()
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
