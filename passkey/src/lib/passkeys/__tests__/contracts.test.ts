import { describe, expect, test } from "bun:test";

import {
  authorizeSessionRequestSchema,
  createSessionRequestSchema,
  submitSessionRequestSchema,
} from "@/lib/passkeys/contracts";

describe("passkey contract validation", () => {
  test("accepts valid create session payload", () => {
    const payload = {
      sessionKey: { key: "session-key", expiration: Date.now() + 60_000 },
      env: "sandbox",
      metaInfo: { appName: "Loyal" },
    };

    const parsed = createSessionRequestSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  test("rejects authorize payload without app name", () => {
    const payload = {
      metaInfo: {},
    };

    const parsed = authorizeSessionRequestSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  test("rejects submit payload with invalid ceremony type", () => {
    const payload = {
      ceremonyType: "invalid",
      slotNumber: 10,
      sessionKey: { key: [1, 2, 3], expiration: Date.now() + 60_000 },
      authenticatorResponse: {},
    };

    const parsed = submitSessionRequestSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});
