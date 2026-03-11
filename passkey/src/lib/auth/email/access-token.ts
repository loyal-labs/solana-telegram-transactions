import { createHash } from "node:crypto";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export type EmailAccessTokenClaims = JWTPayload & {
  sub: string;
  email: string;
  accountAddress: string;
  authMethod: "email";
  provider?: string;
};

function createSecretKey(secret: string): Uint8Array {
  return createHash("sha256").update(secret).digest();
}

export async function issueEmailAccessToken(
  claims: Omit<EmailAccessTokenClaims, "iat" | "exp">,
  secret: string,
  ttlSeconds: number
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(createSecretKey(secret));
}

export async function verifyEmailAccessToken(
  token: string,
  secret: string
): Promise<EmailAccessTokenClaims> {
  const { payload } = await jwtVerify<EmailAccessTokenClaims>(
    token,
    createSecretKey(secret)
  );

  return payload;
}
