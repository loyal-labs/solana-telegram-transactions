import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { Bot } from "grammy";

import { MINI_APP_FEED_LINK } from "../constants";

mock.module("server-only", () => ({}));

const SUMMARY_ID = "123e4567-e89b-12d3-a456-426614174000";

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
let summaryVoteTotalsResult: { dislikes: number; likes: number } = {
  dislikes: 0,
  likes: 0,
};

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
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: () => ({
            groupBy: async () => [summaryVoteTotalsResult],
          }),
        }),
      }),
    }),
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
    summaryVoteTotalsResult = {
      dislikes: 0,
      likes: 0,
    };
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
      id: SUMMARY_ID,
      oneliner: "Daily recap",
    };
    summaryVoteTotalsResult = {
      dislikes: 2,
      likes: 5,
    };

    const result = await sendSummaryById(bot, SUMMARY_ID);

    expect(result).toEqual({ sent: true });
    expect(sendMessageCalls).toHaveLength(1);
    const [, , messageOptions] = sendMessageCalls[0] as [
      number,
      string,
      {
        reply_markup: {
          inline_keyboard: Array<
            Array<{ callback_data?: string; text?: string; url?: string }>
          >;
        };
      },
    ];
    const rows = messageOptions.reply_markup.inline_keyboard;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(3);
    expect(rows[1]).toHaveLength(1);
    expect(rows[0][0]?.callback_data).toBe(`sv:u:${SUMMARY_ID}`);
    expect(rows[0][1]?.text).toBe("Score: 3");
    expect(rows[0][1]?.callback_data).toBe(`sv:s:${SUMMARY_ID}`);
    expect(rows[0][2]?.callback_data).toBe(`sv:d:${SUMMARY_ID}`);
    expect(rows[1][0]?.url).toBe(MINI_APP_FEED_LINK);
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
