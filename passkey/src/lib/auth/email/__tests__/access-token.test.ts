import { describe, expect, test } from "bun:test";

import {
  issueEmailAccessToken,
  verifyEmailAccessToken,
} from "@/lib/auth/email/access-token";

const secret = "jwt-secret-jwt-secret-jwt-secret-123";

describe("email access token", () => {
  test("signs and verifies expected claims", async () => {
    const token = await issueEmailAccessToken(
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

    const claims = await verifyEmailAccessToken(token, secret);

    expect(claims.sub).toBe("grid-user-1");
    expect(claims.email).toBe("user@example.com");
    expect(claims.accountAddress).toBe("account-1");
    expect(claims.authMethod).toBe("email");
    expect(claims.provider).toBe("privy");
  });
});
