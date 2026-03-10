import { describe, expect, test } from "bun:test";

import {
  parseAuthPasskeyQuery,
  parseCreatePasskeyQuery,
} from "@/lib/passkeys/query-params";

describe("parseCreatePasskeyQuery", () => {
  test("parses a valid create ceremony query", () => {
    const query = new URLSearchParams({
      challenge: "challenge-value",
      "slot-num": "42",
      "session-key": "session-key",
      "expiration-in-seconds": "900",
      env: "sandbox",
      "app-name": "Loyal",
      "user-id": "tg-100",
    });

    const parsed = parseCreatePasskeyQuery(query);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.data.slotNumber).toBe(42);
    expect(parsed.data.expirationInSeconds).toBe(900);
    expect(parsed.data.appName).toBe("Loyal");
    expect(parsed.data.userId).toBe("tg-100");
  });

  test("returns validation errors for missing required fields", () => {
    const parsed = parseCreatePasskeyQuery(new URLSearchParams());
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.errors.length).toBeGreaterThan(0);
  });
});

describe("parseAuthPasskeyQuery", () => {
  test("parses a valid auth ceremony query", () => {
    const query = new URLSearchParams({
      challenge: "challenge-value",
      "slot-num": "12",
      "session-key": "session-key",
      "expiration-in-seconds": "120",
      env: "production",
    });

    const parsed = parseAuthPasskeyQuery(query);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.data.slotNumber).toBe(12);
    expect(parsed.data.env).toBe("production");
  });
});
