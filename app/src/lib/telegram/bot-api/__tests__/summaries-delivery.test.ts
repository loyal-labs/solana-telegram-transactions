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
  notificationSentAt: Date | null;
  oneliner: string;
} | null;

let communityResult: CommunityRecord | null = null;
let summaryResult: SummaryWithCommunityRecord = null;
let updateCallCount = 0;

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
    update: () => {
      updateCallCount += 1;
      return {
        set: () => ({
          where: () => ({
            returning: async () => [],
          }),
        }),
      };
    },
  }),
}));

mock.module("@/lib/redpill", () => ({
  chatCompletion: async () => {
    throw new Error("chatCompletion should not be called in delivery guard tests");
  },
}));

let attemptSummaryNotificationDelivery: typeof import("../summaries").attemptSummaryNotificationDelivery;
let sendLatestSummary: typeof import("../summaries").sendLatestSummary;

describe("summary delivery guards", () => {
  beforeAll(async () => {
    const loadedModule = await import("../summaries");
    attemptSummaryNotificationDelivery = loadedModule.attemptSummaryNotificationDelivery;
    sendLatestSummary = loadedModule.sendLatestSummary;
  });

  beforeEach(() => {
    communityResult = null;
    summaryResult = null;
    updateCallCount = 0;
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

  test("attemptSummaryNotificationDelivery returns notifications_disabled and does not send", async () => {
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
      notificationSentAt: null,
      oneliner: "Daily recap",
    };

    const result = await attemptSummaryNotificationDelivery(bot, "summary-1");

    expect(result).toEqual({
      delivered: false,
      reason: "notifications_disabled",
    });
    expect(sendMessageCalls).toHaveLength(0);
    expect(updateCallCount).toBe(0);
  });
});
