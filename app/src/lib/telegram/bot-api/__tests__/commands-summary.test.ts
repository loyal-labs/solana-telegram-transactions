import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { Bot, CommandContext, Context } from "grammy";

mock.module("server-only", () => ({}));

type MockSendSummaryResult =
  | { sent: true }
  | {
      sent: false;
      reason: "no_summaries" | "not_activated" | "notifications_disabled";
    };

let sendLatestSummaryResult: MockSendSummaryResult = { sent: true };
const sendLatestSummaryCalls: unknown[] = [];

mock.module("@/lib/core/database", () => ({
  getDatabase: () => ({}),
}));

mock.module("../get-chat", () => ({
  getChat: async () => ({}),
}));

mock.module("../get-file", () => ({
  downloadTelegramFile: async () => ({
    body: Buffer.from(""),
    contentType: "image/jpeg",
  }),
}));

mock.module("@/lib/telegram/user-service", () => ({
  getOrCreateUser: async () => "user-1",
}));

mock.module("../start-carousel", () => ({
  sendStartCarousel: async () => {},
}));

mock.module("../notification-settings", () => ({
  sendNotificationSettingsMessage: async () => {},
}));

mock.module("../summaries", () => ({
  sendLatestSummary: async (...args: unknown[]) => {
    sendLatestSummaryCalls.push(args);
    return sendLatestSummaryResult;
  },
}));

let handleSummaryCommand: typeof import("../commands").handleSummaryCommand;

function createSummaryCommandContext() {
  const replyCalls: string[] = [];

  const ctx = {
    chat: {
      id: -1009876543210,
      type: "supergroup",
    },
    msg: {
      message_id: 789,
    },
    reply: async (text: string) => {
      replyCalls.push(text);
      return {} as never;
    },
  } as unknown as CommandContext<Context>;

  return { ctx, replyCalls };
}

describe("handleSummaryCommand", () => {
  beforeAll(async () => {
    const loadedModule = await import("../commands");
    handleSummaryCommand = loadedModule.handleSummaryCommand;
  });

  beforeEach(() => {
    sendLatestSummaryResult = { sent: true };
    sendLatestSummaryCalls.length = 0;
  });

  test("replies when summary notifications are disabled for community", async () => {
    sendLatestSummaryResult = {
      sent: false,
      reason: "notifications_disabled",
    };
    const { ctx, replyCalls } = createSummaryCommandContext();

    await handleSummaryCommand(ctx, {} as Bot);

    expect(replyCalls).toEqual([
      "Summary notifications are turned off for this community. Use /notifications to turn them on.",
    ]);
    expect(sendLatestSummaryCalls).toHaveLength(1);
    expect(sendLatestSummaryCalls[0]).toEqual([
      {},
      BigInt(-1009876543210),
      {
        destinationChatId: BigInt(-1009876543210),
        replyToMessageId: 789,
      },
    ]);
  });

  test("keeps existing not_activated behavior", async () => {
    sendLatestSummaryResult = {
      sent: false,
      reason: "not_activated",
    };
    const { ctx, replyCalls } = createSummaryCommandContext();

    await handleSummaryCommand(ctx, {} as Bot);

    expect(replyCalls).toEqual([
      "This community is not activated. Use /activate_community to enable summaries.",
    ]);
  });

  test("keeps existing no_summaries behavior", async () => {
    sendLatestSummaryResult = {
      sent: false,
      reason: "no_summaries",
    };
    const { ctx, replyCalls } = createSummaryCommandContext();

    await handleSummaryCommand(ctx, {} as Bot);

    expect(replyCalls).toEqual([
      "No summaries available yet. Summaries are generated daily when there's enough activity.",
    ]);
  });
});
