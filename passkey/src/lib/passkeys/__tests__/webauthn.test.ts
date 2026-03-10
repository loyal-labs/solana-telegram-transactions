import { describe, expect, test } from "bun:test";

import { isChallengeTimeoutError } from "@/lib/passkeys/webauthn";

describe("isChallengeTimeoutError", () => {
  test("detects timeout and challenge expiration messages", () => {
    expect(isChallengeTimeoutError(new Error("NotAllowedError: timeout"))).toBe(
      true
    );
    expect(
      isChallengeTimeoutError(new Error("challenge expired while authenticating"))
    ).toBe(true);
  });

  test("does not classify unrelated errors as timeout", () => {
    expect(isChallengeTimeoutError(new Error("network unreachable"))).toBe(false);
  });
});
