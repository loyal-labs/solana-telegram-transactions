import { describe, expect, test } from "bun:test";
import { GridError } from "@sqds/grid";

import { EmailAuthError } from "@/lib/auth/email/errors";
import { createGridEmailAuthAdapter } from "@/lib/auth/email/grid-email-auth-adapter";

function createSessionSecrets() {
  return [
    {
      provider: "privy",
      tag: "primary",
      publicKey: "public-key",
      privateKey: "private-key",
    },
  ];
}

describe("grid email auth adapter", () => {
  test("normalizes create-account email auth start", async () => {
    const adapter = createGridEmailAuthAdapter({
      getGridClient: () =>
        ({
          generateSessionSecrets: async () => createSessionSecrets(),
          createAccount: async () => ({
            data: {
              type: "email",
              expiresAt: "2099-03-11T12:00:00.000Z",
            },
          }),
        }) as never,
    });

    const result = await adapter.beginEmailAuth("user@example.com");

    expect(result.mode).toBe("create");
    expect(result.email).toBe("user@example.com");
  });

  test("falls back to auth and normalizes provider metadata", async () => {
    const adapter = createGridEmailAuthAdapter({
      getGridClient: () =>
        ({
          generateSessionSecrets: async () => createSessionSecrets(),
          createAccount: async () => {
            throw new GridError("Account already exists", "409", 409);
          },
          initAuth: async () => ({
            data: {
              expiresAt: "2099-03-11T12:00:00.000Z",
              provider: "privy",
              otpId: "otp-123",
            },
          }),
        }) as never,
    });

    const result = await adapter.beginEmailAuth("user@example.com");

    expect(result.mode).toBe("auth");
    expect(result.provider).toBe("privy");
    expect(result.otpId).toBe("otp-123");
  });

  test("maps invalid OTP responses to stable auth errors", async () => {
    const adapter = createGridEmailAuthAdapter({
      getGridClient: () =>
        ({
          completeAuth: async () => {
            throw new GridError("OTP invalid", "401", 401);
          },
        }) as never,
    });

    await expect(
      adapter.completeEmailAuth(
        {
          authTicketId: crypto.randomUUID(),
          email: "user@example.com",
          mode: "auth",
          provider: "privy",
          otpId: "otp-123",
          sessionSecrets: [],
          expiresAt: "2099-03-11T12:00:00.000Z",
          createdAt: "2026-03-11T12:00:00.000Z",
        },
        "123456"
      )
    ).rejects.toMatchObject<Partial<EmailAuthError>>({
      code: "invalid_otp",
      status: 401,
    });
  });

  test("rejects unknown provider states from Grid", async () => {
    const adapter = createGridEmailAuthAdapter({
      getGridClient: () =>
        ({
          generateSessionSecrets: async () => createSessionSecrets(),
          createAccount: async () => {
            throw new GridError("Account already exists", "409", 409);
          },
          initAuth: async () => ({
            data: {
              expiresAt: "2099-03-11T12:00:00.000Z",
              provider: "mystery-provider",
            },
          }),
        }) as never,
    });

    await expect(adapter.beginEmailAuth("user@example.com")).rejects.toMatchObject<
      Partial<EmailAuthError>
    >({
      code: "unsupported_provider",
      status: 502,
    });
  });
});
