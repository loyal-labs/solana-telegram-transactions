import { createHash } from "node:crypto";

import { errors as joseErrors, jwtVerify, SignJWT, type JWTPayload } from "jose";

import { WalletAuthError } from "./wallet-errors";

export type WalletChallengeTokenClaims = JWTPayload & {
  tokenType: "wallet_challenge";
  version: 1;
  origin: string;
  walletAddress: string;
  message: string;
};

function createSecretKey(secret: string): Uint8Array {
  return createHash("sha256").update(secret).digest();
}

export async function issueWalletChallengeToken(
  claims: Omit<WalletChallengeTokenClaims, "iat" | "exp">,
  secret: string,
  args: {
    issuedAt: Date;
    expiresAt: Date;
  }
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(Math.floor(args.issuedAt.getTime() / 1000))
    .setExpirationTime(Math.floor(args.expiresAt.getTime() / 1000))
    .sign(createSecretKey(secret));
}

export async function verifyWalletChallengeToken(
  token: string,
  secret: string
): Promise<WalletChallengeTokenClaims> {
  let payload: WalletChallengeTokenClaims;

  try {
    const verified = await jwtVerify<WalletChallengeTokenClaims>(
      token,
      createSecretKey(secret)
    );
    payload = verified.payload;
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      throw new WalletAuthError("Wallet challenge expired. Please try again.", {
        code: "expired_wallet_challenge",
        status: 401,
      });
    }

    throw new WalletAuthError("Wallet challenge token is invalid.", {
      code: "invalid_wallet_challenge",
      status: 401,
    });
  }

  if (payload.tokenType !== "wallet_challenge" || payload.version !== 1) {
    throw new WalletAuthError("Wallet challenge token is invalid.", {
      code: "invalid_wallet_challenge",
      status: 401,
    });
  }

  if (
    typeof payload.origin !== "string" ||
    payload.origin.length === 0 ||
    typeof payload.walletAddress !== "string" ||
    payload.walletAddress.length === 0 ||
    typeof payload.message !== "string" ||
    payload.message.length === 0
  ) {
    throw new WalletAuthError("Wallet challenge token is invalid.", {
      code: "invalid_wallet_challenge",
      status: 401,
    });
  }

  return payload;
}
