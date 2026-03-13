import { describe, expect, test } from "bun:test";

import { resolveAuthCapability } from "@/lib/auth/capability";

describe("auth capability", () => {
  test("treats wallet auth sessions as signed in even when disconnected", () => {
    expect(
      resolveAuthCapability({
        hasAuthSession: true,
        hasWalletConnection: false,
      })
    ).toBe("authSession");
  });

  test("separates wallet connections from auth sessions", () => {
    expect(
      resolveAuthCapability({
        hasAuthSession: false,
        hasWalletConnection: true,
      })
    ).toBe("walletConnected");
  });
});
