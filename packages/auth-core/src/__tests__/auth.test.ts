import { describe, expect, test } from "bun:test";

import { buildAuthUrl, createAuthClient } from "../auth";

describe("auth url helpers", () => {
  test("builds auth urls from absolute base urls", () => {
    expect(
      buildAuthUrl("https://auth.askloyal.com/", "/api/passkeys/session/authorize")
    ).toBe("https://auth.askloyal.com/api/passkeys/session/authorize");
  });

  test("returns a relative endpoint when the base url is empty", () => {
    expect(buildAuthUrl("", "/api/passkeys/session/create")).toBe(
      "/api/passkeys/session/create"
    );
  });
});

describe("auth client", () => {
  test("posts wallet challenge payloads to the auth domain", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const client = createAuthClient({
      authBaseUrl: "https://auth.askloyal.com",
      fetch: async (input, init) => {
        requests.push({ input, init });
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const outcome = await client.challengeWalletAuth({
      walletAddress: "wallet-1",
    });

    expect(outcome.ok).toBe(true);
    expect(requests[0]?.input).toBe(
      "https://auth.askloyal.com/api/auth/wallet/challenge"
    );
    expect(requests[0]?.init?.method).toBe("POST");
    expect(requests[0]?.init?.credentials).toBe("include");
  });

  test("posts wallet completion payloads to the auth domain", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const client = createAuthClient({
      authBaseUrl: "https://auth.askloyal.com",
      fetch: async (input, init) => {
        requests.push({ input, init });
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const outcome = await client.completeWalletAuth({
      challengeToken: "challenge-token",
      signature: "signature",
    });

    expect(outcome.ok).toBe(true);
    expect(requests[0]?.input).toBe(
      "https://auth.askloyal.com/api/auth/wallet/complete"
    );
    expect(requests[0]?.init?.method).toBe("POST");
    expect(requests[0]?.init?.credentials).toBe("include");
  });
});
