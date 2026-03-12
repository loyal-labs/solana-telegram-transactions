import { describe, expect, test } from "bun:test";

import {
  getPendingAuthStore,
  resetPendingAuthStoreForTests,
} from "@/lib/auth/email/pending-auth-store";

describe("pending auth store", () => {
  test("creates and consumes pending auth entries", async () => {
    resetPendingAuthStoreForTests();
    const store = getPendingAuthStore();

    const pendingAuth = await store.createPendingAuth({
      email: "user@example.com",
      mode: "create",
      sessionSecrets: [],
      expiresAt: "2099-03-11T12:00:00.000Z",
    });

    expect(await store.getPendingAuth(pendingAuth.authTicketId)).toMatchObject({
      email: "user@example.com",
      mode: "create",
    });

    const consumed = await store.consumePendingAuth(pendingAuth.authTicketId);

    expect(consumed?.authTicketId).toBe(pendingAuth.authTicketId);
    expect(await store.getPendingAuth(pendingAuth.authTicketId)).toBeNull();
  });

  test("cleans up expired entries", async () => {
    resetPendingAuthStoreForTests();
    const store = getPendingAuthStore();

    const pendingAuth = await store.createPendingAuth({
      email: "user@example.com",
      mode: "auth",
      provider: "privy",
      sessionSecrets: [],
      expiresAt: "2000-03-11T12:00:00.000Z",
    });

    await store.cleanupExpired();

    expect(await store.getPendingAuth(pendingAuth.authTicketId)).toBeNull();
  });
});
