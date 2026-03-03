import type {
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";

import { getFromOracle, postToOracle } from "./client";
import { ORACLE_ROUTES } from "./constants";
import type { DelegationTokensResponse } from "./types";

export async function createDataForSIWS(): Promise<SolanaSignInInput> {
  const { data, status, statusText } = await getFromOracle<SolanaSignInInput>(
    ORACLE_ROUTES.signInWithSolana.create
  );

  if (status !== 200) {
    throw new Error(`Failed to create sign in data: ${statusText}`);
  }
  if (!data) {
    throw new Error(`Failed to create sign in data: ${statusText}`);
  }
  return data;
}

export async function verifySIWS(
  input: SolanaSignInInput,
  output: SolanaSignInOutput
): Promise<boolean> {
  const { data, status, statusText } = await postToOracle<{
    verified: boolean;
  }>(ORACLE_ROUTES.signInWithSolana.verify, {
    input,
    output,
  });

  if (status !== 200) {
    throw new Error(`Failed to verify sign in data: ${statusText}`);
  }
  if (!data) {
    throw new Error(`Failed to verify sign in data: ${statusText}`);
  }
  if (!Object.hasOwn(data, "verified")) {
    throw new Error(`Failed to verify sign in data: ${statusText}`);
  }

  return data.verified;
}

export async function getDelegationTokens(
  input: SolanaSignInInput,
  output: SolanaSignInOutput
): Promise<DelegationTokensResponse> {
  const { data, status, statusText } =
    await postToOracle<DelegationTokensResponse>(ORACLE_ROUTES.delegation.all, {
      input,
      output,
    });
  if (status !== 200) {
    throw new Error(`Failed to get delegation tokens: ${statusText}`);
  }
  if (!data) {
    throw new Error(`Failed to get delegation tokens: ${statusText}`);
  }
  if (
    !(
      Object.hasOwn(data, "storageDelegationToken") &&
      Object.hasOwn(data, "modelDelegationToken")
    )
  ) {
    throw new Error(`Failed to get delegation tokens: ${statusText}`);
  }
  return data;
}
