import { describe, expect, test } from "bun:test";

import { EmailAuthError } from "@/lib/auth/email/errors";
import { startEmailAuth, verifyEmailAuth } from "@/lib/auth/email/service";

function createDependencies() {
  const authTicketId = "3fdb64ce-29ff-4ef8-b5e0-a9df0a3352b4";
  const calls = {
    consumed: [] as string[],
    setTokens: [] as Array<{ user: { email: string; gridUserId: string; accountAddress: string; provider?: string } }>,
  };

  const store = {
    pendingAuth: null as null | {
        authTicketId: string;
      email: string;
      mode: "create" | "auth";
      provider?: "privy" | "turnkey";
      otpId?: string;
      sessionSecrets: unknown[];
      expiresAt: string;
      createdAt: string;
    },
    async createPendingAuth(input: {
      email: string;
      mode: "create" | "auth";
      provider?: "privy" | "turnkey";
      otpId?: string;
      sessionSecrets: unknown[];
      expiresAt: string;
    }) {
      this.pendingAuth = {
        authTicketId,
        createdAt: "2026-03-11T10:00:00.000Z",
        ...input,
      };
      return this.pendingAuth;
    },
    async getPendingAuth() {
      return this.pendingAuth;
    },
    async consumePendingAuth(authTicketId: string) {
      calls.consumed.push(authTicketId);
      const current = this.pendingAuth;
      this.pendingAuth = null;
      return current;
    },
    async cleanupExpired() {},
  };

  const adapter = {
    async beginEmailAuth(email: string) {
      return {
        email,
        mode: "auth" as const,
        provider: "privy" as const,
        otpId: "otp-123",
        sessionSecrets: [],
        expiresAt: "2099-03-11T12:00:00.000Z",
      };
    },
    async completeEmailAuth() {
      return {
        email: "user@example.com",
        gridUserId: "grid-user-1",
        accountAddress: "account-1",
        provider: "privy" as const,
      };
    },
  };

  const sessionCookieService = {
    async issueSessionToken(user: {
      email: string;
      gridUserId: string;
      accountAddress: string;
      provider?: string;
    }) {
      calls.setTokens.push({ user });
      return "signed-session-token";
    },
    async readSessionFromRequest() {
      return null;
    },
    createSessionCookieOptions() {
      return {
        httpOnly: true as const,
        sameSite: "lax" as const,
        secure: true,
        path: "/" as const,
        maxAge: 3600,
      };
    },
    createClearedSessionCookieOptions() {
      return {
        httpOnly: true as const,
        sameSite: "lax" as const,
        secure: true,
        path: "/" as const,
        maxAge: 0,
      };
    },
  };

  return {
    calls,
    authTicketId,
    store,
    adapter,
    sessionCookieService,
    dependencies: {
      getPendingAuthStore: () => store,
      getGridEmailAuthAdapter: () => adapter,
      getSessionCookieService: () => sessionCookieService,
    },
  };
}

describe("email auth service", () => {
  test("creates pending auth entries instead of encrypted tickets", async () => {
    const { authTicketId, dependencies, store } = createDependencies();

    const response = await startEmailAuth(
      {
        email: "user@example.com",
      },
      dependencies
    );

    expect(response.authTicketId).toBe(authTicketId);
    expect(response.maskedEmail).toBe("u***@example.com");
    expect(store.pendingAuth?.otpId).toBe("otp-123");
  });

  test("issues a cookie session token after successful verification", async () => {
    const { authTicketId, calls, dependencies } = createDependencies();
    await startEmailAuth(
      {
        email: "user@example.com",
      },
      dependencies
    );

    const response = await verifyEmailAuth(
      {
        authTicketId,
        otpCode: "123456",
      },
      dependencies
    );

    expect(response.sessionToken).toBe("signed-session-token");
    expect(response.user.email).toBe("user@example.com");
    expect(calls.consumed).toEqual([authTicketId]);
    expect(calls.setTokens[0]?.user.gridUserId).toBe("grid-user-1");
  });

  test("fails verification when the pending auth request is missing", async () => {
    const { dependencies } = createDependencies();

    await expect(
      verifyEmailAuth(
        {
          authTicketId: "3fdb64ce-29ff-4ef8-b5e0-a9df0a3352b4",
          otpCode: "123456",
        },
        dependencies
      )
    ).rejects.toMatchObject<Partial<EmailAuthError>>({
      code: "invalid_auth_ticket",
      status: 401,
    });
  });
});
