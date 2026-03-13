import { describe, expect, test } from "bun:test";

import {
  createAccountRequestSchema,
  gridPasskeyUpstreamApiPaths,
  passkeyAccountParamSchema,
  startPasskeyRegistrationRequestSchema,
  startPasskeySignInRequestSchema,
  submitSessionRequestSchema,
} from "../contracts";

describe("grid contracts", () => {
  test("accepts valid passkey registration payloads", () => {
    const parsed = startPasskeyRegistrationRequestSchema.safeParse({
      sessionKey: { key: "session-key", expiration: 900 },
      env: "sandbox",
      metaInfo: { appName: "askloyal" },
    });

    expect(parsed.success).toBe(true);
  });

  test("rejects passkey sign-in payloads without app name", () => {
    const parsed = startPasskeySignInRequestSchema.safeParse({
      metaInfo: {},
    });

    expect(parsed.success).toBe(false);
  });

  test("rejects invalid submit ceremony types", () => {
    const parsed = submitSessionRequestSchema.safeParse({
      ceremonyType: "bad",
      slotNumber: 10,
      sessionKey: { key: [1, 2, 3], expiration: 900 },
      authenticatorResponse: {},
    });

    expect(parsed.success).toBe(false);
  });

  test("accepts create-account payloads", () => {
    const parsed = createAccountRequestSchema.safeParse({
      sessionKey: { key: "session-key", expiration: 900 },
      slotNumber: 10,
      authenticatorResponse: { credential: "123" },
    });

    expect(parsed.success).toBe(true);
  });

  test("accepts passkey account params", () => {
    const parsed = passkeyAccountParamSchema.safeParse({
      passkeyAddress: "passkey-account-1",
    });

    expect(parsed.success).toBe(true);
  });

  test("keeps upstream passkey api paths stable", () => {
    expect(gridPasskeyUpstreamApiPaths.authorizeSession).toBe("/passkeys/auth");
    expect(gridPasskeyUpstreamApiPaths.getAccount("abc123")).toBe(
      "/passkeys/account/abc123"
    );
  });
});
