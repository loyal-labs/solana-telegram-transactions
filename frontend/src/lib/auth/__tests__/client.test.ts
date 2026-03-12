import { describe, expect, test } from "bun:test";

import { AuthApiClientError, createAuthApiClient } from "@/lib/auth/client";

describe("auth api client", () => {
  test("validates the start-email response shape", async () => {
    const client = createAuthApiClient({
      startEmailAuth: async () => ({
        ok: true,
        status: 200,
        body: {
          authTicketId: "3fdb64ce-29ff-4ef8-b5e0-a9df0a3352b4",
          expiresAt: "2099-03-11T12:00:00.000Z",
          maskedEmail: "u***@example.com",
        },
      }),
      verifyEmailAuth: async () => ({ ok: true, status: 200, body: {} }),
      getAuthSession: async () => ({ ok: true, status: 200, body: {} }),
      getEmailAuthSession: async () => ({ ok: true, status: 200, body: {} }),
      logoutAuthSession: async () => ({ ok: true, status: 204, body: null }),
      logoutEmailAuth: async () => ({ ok: true, status: 204, body: null }),
      startPasskeyRegistration: async () => ({ ok: true, status: 200, body: {} }),
      startPasskeySignIn: async () => ({ ok: true, status: 200, body: {} }),
      getPasskeyAccount: async () => ({ ok: true, status: 200, body: {} }),
    });

    await expect(
      client.startEmailAuth({ email: "user@example.com" })
    ).resolves.toMatchObject({
      maskedEmail: "u***@example.com",
    });
  });

  test("normalizes unauthenticated session lookups to null", async () => {
    const client = createAuthApiClient({
      startEmailAuth: async () => ({ ok: true, status: 200, body: {} }),
      verifyEmailAuth: async () => ({ ok: true, status: 200, body: {} }),
      getAuthSession: async () => ({
        ok: false,
        status: 401,
        body: {
          error: {
            code: "unauthenticated",
            message: "No active auth session.",
          },
        },
      }),
      getEmailAuthSession: async () => ({
        ok: false,
        status: 401,
        body: {
          error: {
            code: "unauthenticated",
            message: "No active auth session.",
          },
        },
      }),
      logoutAuthSession: async () => ({ ok: true, status: 204, body: null }),
      logoutEmailAuth: async () => ({ ok: true, status: 204, body: null }),
      startPasskeyRegistration: async () => ({ ok: true, status: 200, body: {} }),
      startPasskeySignIn: async () => ({ ok: true, status: 200, body: {} }),
      getPasskeyAccount: async () => ({ ok: true, status: 200, body: {} }),
    });

    await expect(client.getSession()).resolves.toBeNull();
  });

  test("raises typed errors for invalid verify responses", async () => {
    const client = createAuthApiClient({
      startEmailAuth: async () => ({ ok: true, status: 200, body: {} }),
      verifyEmailAuth: async () => ({
        ok: true,
        status: 200,
        body: { nope: true },
      }),
      getAuthSession: async () => ({ ok: true, status: 200, body: {} }),
      getEmailAuthSession: async () => ({ ok: true, status: 200, body: {} }),
      logoutAuthSession: async () => ({ ok: true, status: 204, body: null }),
      logoutEmailAuth: async () => ({ ok: true, status: 204, body: null }),
      startPasskeyRegistration: async () => ({ ok: true, status: 200, body: {} }),
      startPasskeySignIn: async () => ({ ok: true, status: 200, body: {} }),
      getPasskeyAccount: async () => ({ ok: true, status: 200, body: {} }),
    });

    await expect(
      client.verifyEmailAuth({
        authTicketId: "3fdb64ce-29ff-4ef8-b5e0-a9df0a3352b4",
        otpCode: "123456",
      })
    ).rejects.toBeInstanceOf(AuthApiClientError);
  });

  test("returns embedded passkey continue urls", async () => {
    const client = createAuthApiClient({
      startEmailAuth: async () => ({ ok: true, status: 200, body: {} }),
      verifyEmailAuth: async () => ({ ok: true, status: 200, body: {} }),
      getAuthSession: async () => ({ ok: true, status: 200, body: {} }),
      getEmailAuthSession: async () => ({ ok: true, status: 200, body: {} }),
      logoutAuthSession: async () => ({ ok: true, status: 204, body: null }),
      logoutEmailAuth: async () => ({ ok: true, status: 204, body: null }),
      startPasskeyRegistration: async () => ({ ok: true, status: 200, body: {} }),
      startPasskeySignIn: async () => ({
        ok: true,
        status: 200,
        body: {
          url: "https://auth.askloyal.com/continue?challenge=abc",
        },
      }),
      getPasskeyAccount: async () => ({ ok: true, status: 200, body: {} }),
    });

    expect(
      await client.startPasskeySignIn({
        metaInfo: {
          appName: "askloyal",
        },
      })
    ).toBe("https://auth.askloyal.com/continue?challenge=abc&embed=1&autostart=1");
  });
});
