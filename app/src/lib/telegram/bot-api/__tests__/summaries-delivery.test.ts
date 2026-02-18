import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { Bot } from "grammy";

import { buildSummaryFeedMiniAppUrl } from "@/lib/telegram/mini-app/start-param";

mock.module("server-only", () => ({}));

const SUMMARY_ID = "123e4567-e89b-12d3-a456-426614174000";
const SUMMARY_VOTE_LIKE_CUSTOM_EMOJI_ID = "5447485069386090205";
const SUMMARY_VOTE_DISLIKE_CUSTOM_EMOJI_ID = "5445146433923616423";
const SUMMARY_OPEN_BUTTON_CUSTOM_EMOJI_ID = "5235480870860660944";
const SUMMARY_SCORE_POSITIVE_CUSTOM_EMOJI_ID = "5445293605272984280";

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

function createActiveSummaryRecord(): Exclude<SummaryWithCommunityRecord, null> {
  return {
    community: {
      chatId: BigInt("-1001234567890"),
      isActive: true,
      summaryNotificationsEnabled: true,
    },
    createdAt: new Date("2026-02-12T00:00:00Z"),
    id: SUMMARY_ID,
    oneliner: "Daily recap",
  };
}

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
          return { message_id: 321 } as never;
        },
      },
    } as unknown as Bot;

    summaryResult = createActiveSummaryRecord();
    summaryVoteTotalsResult = {
      dislikes: 2,
      likes: 5,
    };

    const result = await sendSummaryById(bot, SUMMARY_ID);

    expect(result).toEqual({
      deliveredMessage: {
        destinationChatId: BigInt("-1001234567890"),
        messageId: 321,
        sourceCommunityChatId: BigInt("-1001234567890"),
      },
      sent: true,
    });
    expect(sendMessageCalls).toHaveLength(1);
    const [, messageText, messageOptions] = sendMessageCalls[0] as [
      number,
      string,
      {
        reply_markup: {
          inline_keyboard: Array<
            Array<{
              callback_data?: string;
              icon_custom_emoji_id?: string;
              style?: string;
              text?: string;
              url?: string;
            }>
          >;
        };
      },
    ];
    expect(messageText).toContain("Daily recap");
    expect(messageText).not.toContain("Summary:");
    expect(messageText).not.toContain("<tg-emoji");
    const rows = messageOptions.reply_markup.inline_keyboard;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(3);
    expect(rows[1]).toHaveLength(1);
    expect(rows[0][0]?.callback_data).toBe(
      `sv:u:${SUMMARY_ID}:${summaryResult!.community.chatId}`
    );
    expect(rows[0][0]?.text).toBe("Like");
    expect(rows[0][0]?.style).toBeUndefined();
    expect(rows[0][0]?.icon_custom_emoji_id).toBe(
      SUMMARY_VOTE_LIKE_CUSTOM_EMOJI_ID
    );
    expect(rows[0][1]?.text).toBe("Score: 3");
    expect(rows[0][1]?.icon_custom_emoji_id).toBe(
      SUMMARY_SCORE_POSITIVE_CUSTOM_EMOJI_ID
    );
    expect(rows[0][1]?.callback_data).toBe(
      `sv:s:${SUMMARY_ID}:${summaryResult!.community.chatId}`
    );
    expect(rows[0][2]?.callback_data).toBe(
      `sv:d:${SUMMARY_ID}:${summaryResult!.community.chatId}`
    );
    expect(rows[0][2]?.text).toBe("Dislike");
    expect(rows[0][2]?.style).toBeUndefined();
    expect(rows[0][2]?.icon_custom_emoji_id).toBe(
      SUMMARY_VOTE_DISLIKE_CUSTOM_EMOJI_ID
    );
    expect(rows[1][0]?.text).toBe("Open");
    expect(rows[1][0]?.style).toBe("primary");
    expect(rows[1][0]?.icon_custom_emoji_id).toBe(
      SUMMARY_OPEN_BUTTON_CUSTOM_EMOJI_ID
    );
    expect(rows[1][0]?.url).toBe(
      buildSummaryFeedMiniAppUrl(summaryResult!.community.chatId, SUMMARY_ID)
    );
  });

  test("sendLatestSummary returns delivered message metadata on success", async () => {
    const sendMessageCalls: unknown[] = [];
    const bot = {
      api: {
        sendMessage: async (...args: unknown[]) => {
          sendMessageCalls.push(args);
          return { message_id: 654 } as never;
        },
      },
    } as unknown as Bot;

    communityResult = {
      chatId: BigInt("-1001234567890"),
      id: "community-1",
      isActive: true,
      summaryNotificationsEnabled: true,
    };
    summaryResult = createActiveSummaryRecord();

    const result = await sendLatestSummary(bot, BigInt("-1001234567890"));

    expect(result).toEqual({
      deliveredMessage: {
        destinationChatId: BigInt("-1001234567890"),
        messageId: 654,
        sourceCommunityChatId: BigInt("-1001234567890"),
      },
      sent: true,
    });
    expect(sendMessageCalls).toHaveLength(1);
  });

  test("sendSummaryById uses reply result message id when reply send succeeds", async () => {
    const sendMessageCalls: unknown[] = [];
    const bot = {
      api: {
        sendMessage: async (...args: unknown[]) => {
          sendMessageCalls.push(args);
          return { message_id: 901 } as never;
        },
      },
    } as unknown as Bot;

    summaryResult = createActiveSummaryRecord();

    const result = await sendSummaryById(bot, SUMMARY_ID, {
      replyToMessageId: 42,
    });

    expect(result).toEqual({
      deliveredMessage: {
        destinationChatId: BigInt("-1001234567890"),
        messageId: 901,
        sourceCommunityChatId: BigInt("-1001234567890"),
      },
      sent: true,
    });
    expect(sendMessageCalls).toHaveLength(1);
    const [, , options] = sendMessageCalls[0] as [
      number,
      string,
      {
        reply_parameters?: {
          message_id: number;
        };
      },
    ];
    expect(options.reply_parameters?.message_id).toBe(42);
  });

  test("sendSummaryById falls back and returns fallback message id when reply send fails", async () => {
    const sendMessageCalls: unknown[] = [];
    const bot = {
      api: {
        sendMessage: async (...args: unknown[]) => {
          sendMessageCalls.push(args);
          const [, , options] = args as [
            number,
            string,
            { reply_parameters?: { message_id: number } },
          ];
          if (options.reply_parameters) {
            throw new Error("reply failed");
          }
          return { message_id: 902 } as never;
        },
      },
    } as unknown as Bot;

    summaryResult = createActiveSummaryRecord();

    const result = await sendSummaryById(bot, SUMMARY_ID, {
      replyToMessageId: 42,
    });

    expect(result).toEqual({
      deliveredMessage: {
        destinationChatId: BigInt("-1001234567890"),
        messageId: 902,
        sourceCommunityChatId: BigInt("-1001234567890"),
      },
      sent: true,
    });
    expect(sendMessageCalls).toHaveLength(2);
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
