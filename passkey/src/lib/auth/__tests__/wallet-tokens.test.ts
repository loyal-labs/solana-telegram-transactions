import { describe, expect, test } from "bun:test";

import {
  issueWalletChallengeToken,
  verifyWalletChallengeToken,
} from "@/lib/auth/wallet-tokens";

const secret = "jwt-secret-jwt-secret-jwt-secret-123";

describe("wallet challenge tokens", () => {
  test("issues and verifies challenge claims", async () => {
    const token = await issueWalletChallengeToken(
      {
        tokenType: "wallet_challenge",
        version: 1,
        origin: "https://askloyal.com",
        walletAddress: "wallet-1",
        message: "Sign in to askloyal",
      },
      secret,
      {
        issuedAt: new Date("2099-03-11T12:00:00.000Z"),
        expiresAt: new Date("2099-03-11T12:10:00.000Z"),
      }
    );

    const claims = await verifyWalletChallengeToken(token, secret);

    expect(claims.tokenType).toBe("wallet_challenge");
    expect(claims.version).toBe(1);
    expect(claims.walletAddress).toBe("wallet-1");
    expect(claims.origin).toBe("https://askloyal.com");
    expect(claims.message).toBe("Sign in to askloyal");
  });

  test("rejects expired challenge tokens with a dedicated error code", async () => {
    const token = await issueWalletChallengeToken(
      {
        tokenType: "wallet_challenge",
        version: 1,
        origin: "https://askloyal.com",
        walletAddress: "wallet-1",
        message: "Sign in to askloyal",
      },
      secret,
      {
        issuedAt: new Date("2000-03-11T12:00:00.000Z"),
        expiresAt: new Date("2000-03-11T12:10:00.000Z"),
      }
    );

    await expect(verifyWalletChallengeToken(token, secret)).rejects.toMatchObject({
      code: "expired_wallet_challenge",
      status: 401,
    });
  });
});
