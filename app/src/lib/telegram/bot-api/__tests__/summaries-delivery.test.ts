import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { Bot } from "grammy";

mock.module("server-only", () => ({}));

type CommunityRecord = {
  chatId: bigint;
  id: string;
  isActive: boolean;
  summaryNotificationsEnabled: boolean;
};

type SummaryWithCommunityRecord = {
  community: {
    chatId: bigint;
    isActive: boolean;
    summaryNotificationsEnabled: boolean;
  };
  createdAt: Date;
  id: string;
  oneliner: string;
} | null;

let communityResult: CommunityRecord | null = null;
let summaryResult: SummaryWithCommunityRecord = null;

mock.module("@/lib/core/database", () => ({
  getDatabase: () => ({
    query: {
      communities: {
        findFirst: async () => communityResult,
      },
      summaries: {
        findFirst: async () => summaryResult,
      },
    },
  }),
}));

mock.module("@/lib/redpill", () => ({
  chatCompletion: async () => {
    throw new Error("chatCompletion should not be called in delivery tests");
  },
}));

let sendLatestSummary: typeof import("../summaries").sendLatestSummary;
let sendSummaryById: typeof import("../summaries").sendSummaryById;

describe("summary delivery guards", () => {
  beforeAll(async () => {
    const loadedModule = await import("../summaries");
    sendLatestSummary = loadedModule.sendLatestSummary;
    sendSummaryById = loadedModule.sendSummaryById;
  });

  beforeEach(() => {
    communityResult = null;
    summaryResult = null;
  });

  test("sendSummaryById sends summary when community is active and enabled", async () => {
    const sendMessageCalls: unknown[] = [];
    const bot = {
      api: {
        sendMessage: async (...args: unknown[]) => {
          sendMessageCalls.push(args);
          return {} as never;
        },
      },
    } as unknown as Bot;

    summaryResult = {
      community: {
        chatId: BigInt("-1001234567890"),
        isActive: true,
        summaryNotificationsEnabled: true,
      },
      createdAt: new Date("2026-02-12T00:00:00Z"),
      id: "summary-1",
      oneliner: "Daily recap",
    };

    const result = await sendSummaryById(bot, "summary-1");

    expect(result).toEqual({ sent: true });
    expect(sendMessageCalls).toHaveLength(1);
  });

  test("sendSummaryById returns no_summaries when summary does not exist", async () => {
    const bot = { api: { sendMessage: async () => ({}) as never } } as unknown as Bot;

    const result = await sendSummaryById(bot, "missing");

    expect(result).toEqual({ sent: false, reason: "no_summaries" });
  });

  test("sendSummaryById returns notifications_disabled and does not send", async () => {
    const sendMessageCalls: unknown[] = [];
    const bot = {
      api: {
        sendMessage: async (...args: unknown[]) => {
          sendMessageCalls.push(args);
          return {} as never;
        },
      },
    } as unknown as Bot;

    summaryResult = {
      community: {
        chatId: BigInt("-1001234567890"),
        isActive: true,
        summaryNotificationsEnabled: false,
      },
      createdAt: new Date("2026-02-12T00:00:00Z"),
      id: "summary-1",
      oneliner: "Daily recap",
    };

    const result = await sendSummaryById(bot, "summary-1");

    expect(result).toEqual({ sent: false, reason: "notifications_disabled" });
    expect(sendMessageCalls).toHaveLength(0);
  });

  test("sendSummaryById returns not_activated when community is inactive", async () => {
    const sendMessageCalls: unknown[] = [];
    const bot = {
      api: {
        sendMessage: async (...args: unknown[]) => {
          sendMessageCalls.push(args);
          return {} as never;
        },
      },
    } as unknown as Bot;

    summaryResult = {
      community: {
        chatId: BigInt("-1001234567890"),
        isActive: false,
        summaryNotificationsEnabled: true,
      },
      createdAt: new Date("2026-02-12T00:00:00Z"),
      id: "summary-1",
      oneliner: "Daily recap",
    };

    const result = await sendSummaryById(bot, "summary-1");

    expect(result).toEqual({ sent: false, reason: "not_activated" });
    expect(sendMessageCalls).toHaveLength(0);
  });

  test("sendLatestSummary returns notifications_disabled and does not send to chat", async () => {
    const sendMessageCalls: unknown[] = [];
    const bot = {
      api: {
        sendMessage: async (...args: unknown[]) => {
          sendMessageCalls.push(args);
          return {} as never;
        },
      },
    } as unknown as Bot;

    communityResult = {
      chatId: BigInt("-1001234567890"),
      id: "community-1",
      isActive: true,
      summaryNotificationsEnabled: false,
    };

    const result = await sendLatestSummary(bot, BigInt("-1001234567890"));

    expect(result).toEqual({ sent: false, reason: "notifications_disabled" });
    expect(sendMessageCalls).toHaveLength(0);
  });
});
