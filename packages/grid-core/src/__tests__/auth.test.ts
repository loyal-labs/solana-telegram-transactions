import { describe, expect, test } from "bun:test";

import {
  buildGridAuthUrl,
  createGridAuthClient,
} from "../auth";

describe("grid auth url helpers", () => {
  test("builds auth urls from absolute base urls", () => {
    expect(
      buildGridAuthUrl(
        "https://auth.askloyal.com/",
        "/api/passkeys/session/authorize"
      )
    ).toBe("https://auth.askloyal.com/api/passkeys/session/authorize");
  });

  test("returns relative endpoint when base url is empty", () => {
    expect(buildGridAuthUrl("", "/api/passkeys/session/create")).toBe(
      "/api/passkeys/session/create"
    );
  });
});

describe("grid auth client", () => {
  test("posts email auth start payloads to the auth domain", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const client = createGridAuthClient({
      authBaseUrl: "https://auth.askloyal.com",
      fetch: async (input, init) => {
        requests.push({ input, init });
        return new Response(
          JSON.stringify({
            authTicketId: "3fdb64ce-29ff-4ef8-b5e0-a9df0a3352b4",
            expiresAt: "2026-03-11T12:00:00.000Z",
            maskedEmail: "u***@example.com",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        );
      },
    });

    const outcome = await client.startEmailAuth({
      email: "user@example.com",
    });

    expect(outcome.ok).toBe(true);
    expect(requests[0]?.input).toBe(
      "https://auth.askloyal.com/api/auth/email/start"
    );
    expect(requests[0]?.init?.method).toBe("POST");
  });

  test("posts email auth verify payloads to the auth domain", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const client = createGridAuthClient({
      authBaseUrl: "https://auth.askloyal.com",
      fetch: async (input, init) => {
        requests.push({ input, init });
        return new Response(
          JSON.stringify({
            user: {
              email: "user@example.com",
              gridUserId: "grid-user-1",
              accountAddress: "account-1",
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        );
      },
    });

    const outcome = await client.verifyEmailAuth({
      authTicketId: "3fdb64ce-29ff-4ef8-b5e0-a9df0a3352b4",
      otpCode: "123456",
    });

    expect(outcome.ok).toBe(true);
    expect(requests[0]?.input).toBe(
      "https://auth.askloyal.com/api/auth/email/verify"
    );
    expect(requests[0]?.init?.method).toBe("POST");
    expect(requests[0]?.init?.credentials).toBe("include");
  });

  test("fetches cookie-backed auth sessions from the auth domain", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const client = createGridAuthClient({
      authBaseUrl: "https://auth.askloyal.com",
      fetch: async (input, init) => {
        requests.push({ input, init });
        return new Response(
          JSON.stringify({
            user: {
              email: "user@example.com",
              gridUserId: "grid-user-1",
              accountAddress: "account-1",
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        );
      },
    });

    const outcome = await client.getEmailAuthSession();

    expect(outcome.ok).toBe(true);
    expect(requests[0]?.input).toBe(
      "https://auth.askloyal.com/api/auth/session"
    );
    expect(requests[0]?.init?.method).toBe("GET");
    expect(requests[0]?.init?.credentials).toBe("include");
  });

  test("posts logout requests with cookies to the auth domain", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const client = createGridAuthClient({
      authBaseUrl: "https://auth.askloyal.com",
      fetch: async (input, init) => {
        requests.push({ input, init });
        return new Response(null, { status: 204 });
      },
    });

    const outcome = await client.logoutEmailAuth();

    expect(outcome.ok).toBe(true);
    expect(requests[0]?.input).toBe(
      "https://auth.askloyal.com/api/auth/logout"
    );
    expect(requests[0]?.init?.method).toBe("POST");
    expect(requests[0]?.init?.credentials).toBe("include");
  });

  test("posts passkey sign-in payloads to the auth domain", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const client = createGridAuthClient({
      authBaseUrl: "https://auth.askloyal.com",
      fetch: async (input, init) => {
        requests.push({ input, init });
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const outcome = await client.startPasskeySignIn({
      metaInfo: {
        appName: "askloyal",
      },
    });

    expect(outcome.ok).toBe(true);
    expect(requests[0]?.input).toBe(
      "https://auth.askloyal.com/api/passkeys/session/authorize"
    );
    expect(requests[0]?.init?.method).toBe("POST");
  });

  test("fetches passkey accounts from the auth domain", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const client = createGridAuthClient({
      authBaseUrl: "https://auth.askloyal.com",
      fetch: async (input, init) => {
        requests.push({ input, init });
        return new Response(JSON.stringify({ data: { relyingPartyId: "askloyal.com" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    await client.getPasskeyAccount("abc123");

    expect(requests[0]?.input).toBe(
      "https://auth.askloyal.com/api/passkeys/account/abc123"
    );
    expect(requests[0]?.init?.method).toBe("GET");
  });
});
