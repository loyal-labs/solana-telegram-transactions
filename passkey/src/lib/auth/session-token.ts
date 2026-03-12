import { createHash } from "node:crypto";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";

import type { AuthMethod, AuthSessionUser } from "@loyal-labs/grid-core";

export type AuthSessionTokenClaims = JWTPayload & {
  sub?: string;
  authMethod: AuthMethod;
  accountAddress: string;
  email?: string;
  provider?: string;
  passkeyAccount?: string;
  sessionKey?: AuthSessionUser["sessionKey"];
};

export type EmailAccessTokenClaims = AuthSessionTokenClaims & {
  sub: string;
  email: string;
  accountAddress: string;
  authMethod: "email";
  provider?: string;
};

function createSecretKey(secret: string): Uint8Array {
  return createHash("sha256").update(secret).digest();
}

export async function issueAuthSessionToken(
  claims: Omit<AuthSessionTokenClaims, "iat" | "exp">,
  secret: string,
  ttlSeconds: number
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(createSecretKey(secret));
}

export async function verifyAuthSessionToken(
  token: string,
  secret: string
): Promise<AuthSessionTokenClaims> {
  const { payload } = await jwtVerify<AuthSessionTokenClaims>(
    token,
    createSecretKey(secret)
  );

  return payload;
}

export const issueEmailAccessToken = issueAuthSessionToken;
export const verifyEmailAccessToken = verifyAuthSessionToken;
