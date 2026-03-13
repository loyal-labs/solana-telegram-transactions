import {
  type AuthSessionUser,
  type WalletChallengeResponse,
  walletChallengeRequestSchema,
  walletCompleteRequestSchema,
} from "@loyal-labs/auth-core";

import { getServerConfig } from "@/lib/core/config/server";

import { createAuthSessionCookieService } from "./session-cookie";
import { buildWalletAuthMessage } from "./wallet-message";
import { verifyWalletSignature, decodeWalletAddress } from "./wallet-signature";
import {
  issueWalletChallengeToken,
  verifyWalletChallengeToken,
} from "./wallet-tokens";
import { WalletAuthError } from "./wallet-errors";

export const WALLET_CHALLENGE_TTL_SECONDS = 60 * 10;

type WalletAuthDependencies = {
  getConfig: typeof getServerConfig;
  issueSessionToken: (user: AuthSessionUser) => Promise<string>;
  now: () => Date;
  randomUUID: () => string;
};

const defaultDependencies: WalletAuthDependencies = {
  getConfig: () => getServerConfig(),
  issueSessionToken: (user) =>
    createAuthSessionCookieService({
      getConfig: () => getServerConfig(),
    }).issueSessionToken(user),
  now: () => new Date(),
  randomUUID: () => crypto.randomUUID(),
};

export async function createWalletAuthChallenge(
  input: unknown,
  args: {
    requestOrigin: string;
  },
  dependencies: WalletAuthDependencies = defaultDependencies
): Promise<WalletChallengeResponse> {
  const payload = walletChallengeRequestSchema.parse(input);
  const config = dependencies.getConfig();
  decodeWalletAddress(payload.walletAddress);

  const issuedAt = dependencies.now();
  const expiresAt = new Date(
    issuedAt.getTime() + WALLET_CHALLENGE_TTL_SECONDS * 1000
  );
  const nonce = dependencies.randomUUID();
  const message = buildWalletAuthMessage({
    appName: config.appName,
    origin: args.requestOrigin,
    walletAddress: payload.walletAddress,
    nonce,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
  const challengeToken = await issueWalletChallengeToken(
    {
      tokenType: "wallet_challenge",
      version: 1,
      origin: args.requestOrigin,
      walletAddress: payload.walletAddress,
      message,
    },
    config.authJwtSecret,
    {
      issuedAt,
      expiresAt,
    }
  );

  return {
    challengeToken,
    message,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function completeWalletAuth(
  input: unknown,
  args: {
    requestOrigin: string;
  },
  dependencies: WalletAuthDependencies = defaultDependencies
): Promise<{
  user: AuthSessionUser;
  sessionToken: string;
}> {
  const payload = walletCompleteRequestSchema.parse(input);
  const config = dependencies.getConfig();
  const claims = await verifyWalletChallengeToken(
    payload.challengeToken,
    config.authJwtSecret
  );

  if (claims.origin !== args.requestOrigin) {
    throw new WalletAuthError("Wallet challenge origin is invalid.", {
      code: "invalid_wallet_origin",
      status: 403,
      details: {
        expectedOrigin: claims.origin,
        receivedOrigin: args.requestOrigin,
      },
    });
  }

  const isValid = verifyWalletSignature({
    walletAddress: claims.walletAddress,
    message: claims.message,
    signature: payload.signature,
  });

  if (!isValid) {
    throw new WalletAuthError("Wallet signature could not be verified.", {
      code: "invalid_wallet_signature",
      status: 401,
      details: {
        walletAddress: claims.walletAddress,
      },
    });
  }

  const user: AuthSessionUser = {
    authMethod: "wallet",
    walletAddress: claims.walletAddress,
    subjectAddress: claims.walletAddress,
    displayAddress: claims.walletAddress,
    provider: "solana",
  };

  return {
    user,
    sessionToken: await dependencies.issueSessionToken(user),
  };
}
