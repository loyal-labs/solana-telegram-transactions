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
