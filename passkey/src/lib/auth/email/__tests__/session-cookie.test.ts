import { describe, expect, test } from "bun:test";

import { createSessionCookieService } from "@/lib/auth/email/session-cookie";

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
    const service = createSessionCookieService({
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
    const service = createSessionCookieService({
      getConfig: () => config,
    });

    const options = service.createSessionCookieOptions(
      new Request("http://localhost:3001/api/auth/email/verify")
    );

    expect(options.domain).toBeUndefined();
    expect(options.secure).toBe(false);
  });

  test("reads authenticated sessions back from the cookie", async () => {
    const service = createSessionCookieService({
      getConfig: () => config,
    });

    const token = await service.issueSessionToken({
      email: "user@example.com",
      gridUserId: "grid-user-1",
      accountAddress: "account-1",
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
      email: "user@example.com",
      gridUserId: "grid-user-1",
      accountAddress: "account-1",
      provider: "privy",
    });
  });
});
