import { describe, expect, test } from "bun:test";

import {
  PasskeyHostResolutionError,
  resolvePasskeyHostContext,
  resolvePasskeyRequestContext,
} from "@/lib/passkeys/host-resolution";

const options = {
  allowedParentDomain: "askloyal.com",
  allowLocalhost: true,
  rpId: "askloyal.com",
} as const;

describe("resolvePasskeyHostContext", () => {
  test("accepts the root askloyal domain", () => {
    expect(resolvePasskeyHostContext("askloyal.com", options)).toEqual({
      hostname: "askloyal.com",
      rpId: "askloyal.com",
      isLocalhost: false,
    });
  });

  test("accepts askloyal subdomains", () => {
    expect(resolvePasskeyHostContext("app.askloyal.com", options)).toEqual({
      hostname: "app.askloyal.com",
      rpId: "askloyal.com",
      isLocalhost: false,
    });
    expect(
      resolvePasskeyHostContext("wallet.dev.askloyal.com", options)
    ).toEqual({
      hostname: "wallet.dev.askloyal.com",
      rpId: "askloyal.com",
      isLocalhost: false,
    });
  });

  test("accepts localhost only when enabled", () => {
    expect(resolvePasskeyHostContext("localhost", options)).toEqual({
      hostname: "localhost",
      rpId: "localhost",
      isLocalhost: true,
    });

    expect(() =>
      resolvePasskeyHostContext("localhost", {
        ...options,
        allowLocalhost: false,
      })
    ).toThrow(PasskeyHostResolutionError);
  });

  test("rejects unrelated hosts and 127.0.0.1", () => {
    expect(() =>
      resolvePasskeyHostContext("example.com", options)
    ).toThrow(PasskeyHostResolutionError);
    expect(() =>
      resolvePasskeyHostContext("127.0.0.1", options)
    ).toThrow(PasskeyHostResolutionError);
  });
});

describe("resolvePasskeyRequestContext", () => {
  test("builds origin from forwarded host and protocol", () => {
    expect(
      resolvePasskeyRequestContext({
        requestUrl: "https://ignored.askloyal.com/api/passkeys/session/create",
        headers: new Headers({
          "x-forwarded-host": "app.askloyal.com",
          "x-forwarded-proto": "https",
        }),
        options,
      })
    ).toEqual({
      hostname: "app.askloyal.com",
      origin: "https://app.askloyal.com",
      rpId: "askloyal.com",
      isLocalhost: false,
    });
  });
});
