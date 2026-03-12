import { describe, expect, test } from "bun:test";

import {
  issueAuthSessionToken,
  verifyAuthSessionToken,
} from "@/lib/auth/session-token";

const secret = "jwt-secret-jwt-secret-jwt-secret-123";

describe("email access token", () => {
  test("signs and verifies expected claims", async () => {
    const token = await issueAuthSessionToken(
      {
        sub: "grid-user-1",
        email: "user@example.com",
        accountAddress: "account-1",
        authMethod: "email",
        provider: "privy",
      },
      secret,
      3600
    );

    const claims = await verifyAuthSessionToken(token, secret);

    expect(claims.sub).toBe("grid-user-1");
    expect(claims.email).toBe("user@example.com");
    expect(claims.accountAddress).toBe("account-1");
    expect(claims.authMethod).toBe("email");
    expect(claims.provider).toBe("privy");
  });

  test("supports passkey session claims without email fields", async () => {
    const token = await issueAuthSessionToken(
      {
        authMethod: "passkey",
        accountAddress: "smart-account-1",
        passkeyAccount: "passkey-account-1",
        sessionKey: { key: "session-key", expiration: 900 },
      },
      secret,
      3600
    );

    const claims = await verifyAuthSessionToken(token, secret);

    expect(claims.authMethod).toBe("passkey");
    expect(claims.accountAddress).toBe("smart-account-1");
    expect(claims.passkeyAccount).toBe("passkey-account-1");
    expect(claims.sessionKey).toEqual({ key: "session-key", expiration: 900 });
    expect(claims.email).toBeUndefined();
  });
});
