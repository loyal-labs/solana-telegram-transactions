import { AuthType, NilaiOpenAIClient } from "@nillion/nilai-ts";
import { Codec, type Envelope } from "@nillion/nuc";

import { ORACLE_MODEL_BASE_URL } from "./constants";

export function normalizeBaseUrl(url: string): string {
  if (!url) {
    throw new Error("Oracle base URL is not defined.");
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const protocol =
    url.startsWith("localhost") || url.startsWith("127.0.0.1")
      ? "http://"
      : "https://";

  return `${protocol}${url}`;
}

export function normalizePath(path: string): string {
  if (!path) {
    throw new Error("Path is required for Loyal Oracle requests.");
  }
  return path.startsWith("/") ? path : `/${path}`;
}

// TODO: we need to check if we have delegation token stored in the browser storage
export function getModelClient(): NilaiOpenAIClient {
  return new NilaiOpenAIClient({
    baseURL: ORACLE_MODEL_BASE_URL,
    authType: AuthType.DELEGATION_TOKEN,
  });
}

// 1. Sign-in with Solana (https://github.com/phantom/sign-in-with-solana)
// 2. Notify users when they need to sign in again
// 3.
export function deserializeDelegationToken(delegationToken: string): Envelope {
  return Codec.decodeBase64Url(delegationToken);
}
