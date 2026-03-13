import { describe, expect, test } from "bun:test";

import { buildWalletAuthMessage } from "@/lib/auth/wallet-message";

describe("wallet auth message", () => {
  test("includes the non-transaction statement", () => {
    const message = buildWalletAuthMessage({
      appName: "askloyal",
      origin: "https://askloyal.com",
      walletAddress: "wallet-1",
      nonce: "nonce-1",
      issuedAt: "2026-03-11T12:00:00.000Z",
      expiresAt: "2026-03-11T12:10:00.000Z",
    });

    expect(message).toContain("This request only verifies that you control this wallet.");
    expect(message).toContain("This is not a transaction and will not cost gas.");
    expect(message).toContain("Version: 1");
  });
});
