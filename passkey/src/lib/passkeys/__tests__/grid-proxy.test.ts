import { describe, expect, test } from "bun:test";

import {
  buildProxyResponse,
  preparePasskeyUpstreamRequest,
  ProxyValidationError,
} from "@/lib/passkeys/grid-proxy";

const config = {
  gridEnvironment: "sandbox" as const,
  allowedParentDomain: "askloyal.com",
  allowLocalhost: true,
  sharedRpId: "askloyal.com",
  gridApiBaseUrl: "https://grid.squads.xyz",
  appName: "askloyal",
};

describe("preparePasskeyUpstreamRequest", () => {
  test("maps create session operation and injects request-derived base url", () => {
    const prepared = preparePasskeyUpstreamRequest({
      operation: "createSession",
      body: {
        sessionKey: { key: "abc", expiration: 1234 },
        env: "sandbox",
        metaInfo: {},
      },
      requestUrl: "https://app.askloyal.com/api/passkeys/session/create",
      incomingHeaders: new Headers({
        origin: "https://app.askloyal.com",
        cookie: "session=test",
      }),
      config,
    });

    expect(prepared.url).toBe("https://grid.squads.xyz/api/grid/v1/passkeys");
    expect(prepared.init.method).toBe("POST");
    expect(prepared.normalizedBody).toMatchObject({
      baseUrl: "https://app.askloyal.com",
      metaInfo: {
        baseUrl: "https://app.askloyal.com",
        appName: "askloyal",
      },
    });

    const headers = prepared.init.headers as Headers;
    expect(headers.get("x-grid-environment")).toBe("sandbox");
    expect(headers.get("origin")).toBe("https://app.askloyal.com");
    expect(headers.get("cookie")).toBe("session=test");
  });

  test("maps authorize session operation and injects request-derived base url", () => {
    const prepared = preparePasskeyUpstreamRequest({
      operation: "authorizeSession",
      body: {
        metaInfo: {
          appName: "askloyal",
        },
      },
      requestUrl: "https://admin.askloyal.com/api/passkeys/session/authorize",
      incomingHeaders: new Headers({
        origin: "https://admin.askloyal.com",
      }),
      config,
    });

    expect(prepared.normalizedBody).toMatchObject({
      baseUrl: "https://admin.askloyal.com",
      metaInfo: {
        appName: "askloyal",
      },
    });
  });

  test("maps get account operation with dynamic passkey address", () => {
    const prepared = preparePasskeyUpstreamRequest({
      operation: "getAccount",
      passkeyAddress: "abc123",
      requestUrl: "https://askloyal.com/api/passkeys/account/abc123",
      incomingHeaders: new Headers(),
      config,
    });

    expect(prepared.url).toBe(
      "https://grid.squads.xyz/api/grid/v1/passkeys/account/abc123"
    );
    expect(prepared.init.method).toBe("GET");
  });

  test("throws validation error for invalid payload", () => {
    expect(() =>
      preparePasskeyUpstreamRequest({
        operation: "authorizeSession",
        body: { metaInfo: {} },
        requestUrl: "https://app.askloyal.com/api/passkeys/session/authorize",
        incomingHeaders: new Headers(),
        config,
      })
    ).toThrow(ProxyValidationError);
  });

  test("rejects hosts outside the askloyal allowlist", () => {
    expect(() =>
      preparePasskeyUpstreamRequest({
        operation: "createSession",
        body: {
          sessionKey: { key: "abc", expiration: 1234 },
          env: "sandbox",
          metaInfo: {},
        },
        requestUrl: "https://evil.example.com/api/passkeys/session/create",
        incomingHeaders: new Headers(),
        config,
      })
    ).toThrow("not allowed");
  });
});

describe("buildProxyResponse", () => {
  test("returns normalized error envelope for upstream failures", async () => {
    const upstream = new Response(
      JSON.stringify({
        message: "Upstream said no",
        details: ["bad signature"],
      }),
      {
        status: 401,
        headers: {
          "content-type": "application/json",
          "x-request-id": "req-123",
          "set-cookie": "session=abc; Path=/; HttpOnly",
        },
      }
    );

    const response = await buildProxyResponse(upstream);
    const payload = (await response.json()) as {
      error: { code: string; message: string; details: string[]; requestId: string };
    };

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("upstream_error");
    expect(payload.error.message).toBe("Upstream said no");
    expect(payload.error.details).toEqual(["bad signature"]);
    expect(payload.error.requestId).toBe("req-123");
    expect(response.headers.get("set-cookie")).toContain("session=abc");
  });
});
