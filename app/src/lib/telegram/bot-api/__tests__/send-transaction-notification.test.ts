import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

const sendMessageCalls: unknown[][] = [];
let usersFindFirstResult: { id: string } | null = null;
let userSettingsFindFirstResult: { notifications: boolean } | null = null;

const mockDb = {
  query: {
    userSettings: {
      findFirst: async () => userSettingsFindFirstResult,
    },
    users: {
      findFirst: async () => usersFindFirstResult,
    },
  },
};

mock.module("@/lib/core/api", () => ({
  resolveEndpoint: () => "https://example.com/api/og/share",
}));

mock.module("../bot", () => ({
  getBot: async () => ({
    api: {
      sendMessage: async (...args: unknown[]) => {
        sendMessageCalls.push(args);
        return {} as never;
      },
    },
  }),
}));

mock.module("@/lib/core/database", () => ({
  getDatabase: () => mockDb,
}));

let sendTransactionNotification: typeof import("../send-transaction-notification").sendTransactionNotification;

describe("sendTransactionNotification", () => {
  beforeAll(async () => {
    const loadedModule = await import("../send-transaction-notification");
    sendTransactionNotification = loadedModule.sendTransactionNotification;
  });

  beforeEach(() => {
    sendMessageCalls.length = 0;
    usersFindFirstResult = { id: "user-1" };
    userSettingsFindFirstResult = { notifications: true };
  });

  test("skips notification send when user notifications are disabled", async () => {
    userSettingsFindFirstResult = { notifications: false };

    await sendTransactionNotification(123456, "alice", "bob", 1.25, 210.55);

    expect(sendMessageCalls).toHaveLength(0);
  });

  test("sends notification when user notifications are enabled", async () => {
    await sendTransactionNotification(123456, "alice", "bob", 1.25, 210.55);

    expect(sendMessageCalls).toHaveLength(1);
    expect(sendMessageCalls[0]?.[0]).toBe(123456);
    expect(sendMessageCalls[0]?.[1]).toContain("You received <b>1.25 SOL</b>");
  });
});
