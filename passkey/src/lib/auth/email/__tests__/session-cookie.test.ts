import { describe, expect, test } from "bun:test";

import { createAuthSessionCookieService } from "@/lib/auth/session-cookie";

const config = {
  gridEnvironment: "sandbox" as const,
  allowedParentDomain: "askloyal.com",
  allowLocalhost: true,
  rpId: "askloyal.com",
  gridApiBaseUrl: "https://grid.squads.xyz",
  appName: "askloyal",
  authJwtSecret: "jwt-secret-jwt-secret-jwt-secret-123",
  authJwtTtlSeconds: 3600,
};

describe("session cookie service", () => {
  test("issues cookie options for shared production subdomains", () => {
    const service = createAuthSessionCookieService({
      getConfig: () => config,
    });

    const options = service.createSessionCookieOptions(
      new Request("https://auth.askloyal.com/api/auth/email/verify", {
        headers: {
          origin: "https://auth.askloyal.com",
        },
      })
    );

    expect(options.domain).toBe("askloyal.com");
    expect(options.secure).toBe(true);
  });

  test("omits the cookie domain for localhost", () => {
    const service = createAuthSessionCookieService({
      getConfig: () => config,
    });

    const options = service.createSessionCookieOptions(
      new Request("http://localhost:3001/api/auth/email/verify")
    );

    expect(options.domain).toBeUndefined();
    expect(options.secure).toBe(false);
  });

  test("reads authenticated sessions back from the cookie", async () => {
    const service = createAuthSessionCookieService({
      getConfig: () => config,
    });

    const token = await service.issueSessionToken({
      authMethod: "email",
      email: "user@example.com",
      gridUserId: "grid-user-1",
      subjectAddress: "account-1",
      displayAddress: "user@example.com",
      smartAccountAddress: "account-1",
      provider: "privy",
    });

    const user = await service.readSessionFromRequest(
      new Request("https://auth.askloyal.com/api/auth/session", {
        headers: {
          cookie: `loyal_email_session=${token}`,
        },
      })
    );

    expect(user).toEqual({
      authMethod: "email",
      email: "user@example.com",
      gridUserId: "grid-user-1",
      subjectAddress: "account-1",
      displayAddress: "user@example.com",
      smartAccountAddress: "account-1",
      provider: "privy",
    });
  });

  test("reads passkey sessions back from the cookie", async () => {
    const service = createAuthSessionCookieService({
      getConfig: () => config,
    });

    const token = await service.issueSessionToken({
      authMethod: "passkey",
      subjectAddress: "smart-account-1",
      displayAddress: "smart-account-1",
      passkeyAccount: "passkey-account-1",
      smartAccountAddress: "smart-account-1",
      sessionKey: { key: "session-key", expiration: 900 },
    });

    const user = await service.readSessionFromRequest(
      new Request("https://auth.askloyal.com/api/auth/session", {
        headers: {
          cookie: `loyal_email_session=${token}`,
        },
      })
    );

    expect(user).toEqual({
      authMethod: "passkey",
      subjectAddress: "smart-account-1",
      displayAddress: "smart-account-1",
      passkeyAccount: "passkey-account-1",
      smartAccountAddress: "smart-account-1",
      sessionKey: { key: "session-key", expiration: 900 },
    });
  });

  test("reads wallet sessions back from the cookie", async () => {
    const service = createAuthSessionCookieService({
      getConfig: () => config,
    });

    const token = await service.issueSessionToken({
      authMethod: "wallet",
      subjectAddress: "wallet-1",
      displayAddress: "wallet-1",
      walletAddress: "wallet-1",
      provider: "solana",
    });

    const user = await service.readSessionFromRequest(
      new Request("https://auth.askloyal.com/api/auth/session", {
        headers: {
          cookie: `loyal_email_session=${token}`,
        },
      })
    );

    expect(user).toEqual({
      authMethod: "wallet",
      subjectAddress: "wallet-1",
      displayAddress: "wallet-1",
      walletAddress: "wallet-1",
      provider: "solana",
    });
  });
});
