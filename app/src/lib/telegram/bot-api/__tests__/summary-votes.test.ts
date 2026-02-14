import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { CallbackQueryContext, Context } from "grammy";

import { MINI_APP_FEED_LINK } from "../constants";

mock.module("server-only", () => ({}));

type InsertedVoteValues = {
  action: "LIKE" | "DISLIKE";
  summaryId: string;
  userId: string;
};

const SUMMARY_ID = "123e4567-e89b-12d3-a456-426614174000";

let currentVoteTotals = { likes: 0, dislikes: 0 };
let insertBehavior: "inserted" | "duplicate" | "throw" = "inserted";
let insertCalls: InsertedVoteValues[] = [];
let getOrCreateUserCalls: unknown[] = [];
let userIdResult = "user-1";

mock.module("@/lib/core/database", () => ({
  getDatabase: () => ({
    insert: () => ({
      values: (values: InsertedVoteValues) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            insertCalls.push(values);
            if (insertBehavior === "duplicate") {
              return [];
            }
            if (insertBehavior === "throw") {
              throw new Error("insert failed");
            }
            return [{ id: "vote-1" }];
          },
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: () => ({
            groupBy: async () => [
              {
                dislikes: currentVoteTotals.dislikes,
                likes: currentVoteTotals.likes,
              },
            ],
          }),
        }),
      }),
    }),
  }),
}));

mock.module("@/lib/telegram/user-service", () => ({
  getOrCreateUser: async (...args: unknown[]) => {
    getOrCreateUserCalls.push(args);
    return userIdResult;
  },
}));

let buildSummaryVoteKeyboard: typeof import("../summary-votes").buildSummaryVoteKeyboard;
let encodeSummaryVoteCallbackData: typeof import("../summary-votes").encodeSummaryVoteCallbackData;
let handleSummaryVoteCallback: typeof import("../summary-votes").handleSummaryVoteCallback;
let parseSummaryVoteCallbackData: typeof import("../summary-votes").parseSummaryVoteCallbackData;
let SUMMARY_VOTE_CALLBACK_DATA_REGEX: typeof import("../summary-votes").SUMMARY_VOTE_CALLBACK_DATA_REGEX;

beforeAll(async () => {
  const loadedModule = await import("../summary-votes");
  buildSummaryVoteKeyboard = loadedModule.buildSummaryVoteKeyboard;
  encodeSummaryVoteCallbackData = loadedModule.encodeSummaryVoteCallbackData;
  handleSummaryVoteCallback = loadedModule.handleSummaryVoteCallback;
  parseSummaryVoteCallbackData = loadedModule.parseSummaryVoteCallbackData;
  SUMMARY_VOTE_CALLBACK_DATA_REGEX = loadedModule.SUMMARY_VOTE_CALLBACK_DATA_REGEX;
});

beforeEach(() => {
  currentVoteTotals = { likes: 0, dislikes: 0 };
  insertBehavior = "inserted";
  insertCalls = [];
  getOrCreateUserCalls = [];
  userIdResult = "user-1";
});

describe("summary vote callback parser", () => {
  test("parses valid callback data", () => {
    const data = encodeSummaryVoteCallbackData({
      action: "u",
      summaryId: SUMMARY_ID,
    });

    expect(parseSummaryVoteCallbackData(data)).toEqual({
      action: "u",
      summaryId: SUMMARY_ID,
    });
  });

  test("rejects invalid callback data", () => {
    expect(parseSummaryVoteCallbackData("sv:u:bad-id")).toBeNull();
    expect(parseSummaryVoteCallbackData("sv:u:123")).toBeNull();
    expect(parseSummaryVoteCallbackData("sv:u:123:0:0")).toBeNull();
    expect(parseSummaryVoteCallbackData("unknown")).toBeNull();
  });

  test("regex trigger only matches simplified callback format", () => {
    expect(SUMMARY_VOTE_CALLBACK_DATA_REGEX.test(`sv:s:${SUMMARY_ID}`)).toBe(
      true
    );
    expect(
      SUMMARY_VOTE_CALLBACK_DATA_REGEX.test(`sv:s:${SUMMARY_ID}:12:3`)
    ).toBe(false);
  });
});

describe("summary vote keyboard", () => {
  test("builds two rows with vote callbacks and mini app URL button", () => {
    const keyboard = buildSummaryVoteKeyboard(SUMMARY_ID, 5, 2);
    const rows = keyboard.inline_keyboard;

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(3);
    expect(rows[1]).toHaveLength(1);

    expect(rows[0][0]?.text).toBe("👍👍👍");
    expect(rows[0][0]?.callback_data).toBe(`sv:u:${SUMMARY_ID}`);

    expect(rows[0][1]?.text).toBe("Score: 3");
    expect(rows[0][1]?.callback_data).toBe(`sv:s:${SUMMARY_ID}`);

    expect(rows[0][2]?.text).toBe("👎👎👎");
    expect(rows[0][2]?.callback_data).toBe(`sv:d:${SUMMARY_ID}`);

    expect(rows[1][0]?.text).toBe("Read in full");
    expect(rows[1][0]?.url).toBe(MINI_APP_FEED_LINK);
  });
});

describe("handleSummaryVoteCallback", () => {
  test("shows DB-backed score alert for score button", async () => {
    currentVoteTotals = { likes: 4, dislikes: 1 };

    const answerCalls: unknown[] = [];
    const editCalls: unknown[] = [];

    const ctx = {
      answerCallbackQuery: async (payload?: unknown) => {
        answerCalls.push(payload);
      },
      api: {
        editMessageReplyMarkup: async (...args: unknown[]) => {
          editCalls.push(args);
        },
      },
      callbackQuery: {
        data: `sv:s:${SUMMARY_ID}`,
      },
    } as unknown as CallbackQueryContext<Context>;

    await handleSummaryVoteCallback(ctx);

    expect(editCalls).toHaveLength(0);
    expect(answerCalls).toEqual([
      {
        show_alert: true,
        text: "Current summary score is 3.",
      },
    ]);
  });

  test("creates first vote and updates keyboard with DB totals", async () => {
    currentVoteTotals = { likes: 2, dislikes: 1 };

    const answerCalls: unknown[] = [];
    const editCalls: unknown[] = [];

    const ctx = {
      answerCallbackQuery: async (payload?: unknown) => {
        answerCalls.push(payload);
      },
      api: {
        editMessageReplyMarkup: async (...args: unknown[]) => {
          editCalls.push(args);
        },
      },
      callbackQuery: {
        data: `sv:u:${SUMMARY_ID}`,
        message: {
          chat: { id: -1001234 },
          message_id: 99,
        },
      },
      from: {
        first_name: "Test",
        id: 123,
        username: "tester",
      },
    } as unknown as CallbackQueryContext<Context>;

    await handleSummaryVoteCallback(ctx);

    expect(insertCalls).toEqual([
      {
        action: "LIKE",
        summaryId: SUMMARY_ID,
        userId: "user-1",
      },
    ]);
    expect(getOrCreateUserCalls).toHaveLength(1);
    expect(editCalls).toHaveLength(1);

    const [, , payload] = editCalls[0] as [
      number,
      number,
      {
        reply_markup: {
          inline_keyboard: Array<Array<{ callback_data?: string; text?: string }>>;
        };
      },
    ];

    expect(payload.reply_markup.inline_keyboard[0]?.[0]?.callback_data).toBe(
      `sv:u:${SUMMARY_ID}`
    );
    expect(payload.reply_markup.inline_keyboard[0]?.[1]?.text).toBe("Score: 1");
    expect(payload.reply_markup.inline_keyboard[0]?.[1]?.callback_data).toBe(
      `sv:s:${SUMMARY_ID}`
    );

    expect(answerCalls).toEqual([undefined]);
  });

  test("shows duplicate vote alert when user already voted", async () => {
    insertBehavior = "duplicate";

    const answerCalls: unknown[] = [];
    const editCalls: unknown[] = [];

    const ctx = {
      answerCallbackQuery: async (payload?: unknown) => {
        answerCalls.push(payload);
      },
      api: {
        editMessageReplyMarkup: async (...args: unknown[]) => {
          editCalls.push(args);
        },
      },
      callbackQuery: {
        data: `sv:d:${SUMMARY_ID}`,
        message: {
          chat: { id: -1001234 },
          message_id: 99,
        },
      },
      from: {
        first_name: "Test",
        id: 123,
      },
    } as unknown as CallbackQueryContext<Context>;

    await handleSummaryVoteCallback(ctx);

    expect(editCalls).toHaveLength(0);
    expect(answerCalls).toEqual([
      {
        show_alert: true,
        text: "You've voted already!",
      },
    ]);
  });

  test("answers callback when vote callback has no message payload", async () => {
    const answerCalls: unknown[] = [];

    const ctx = {
      answerCallbackQuery: async (payload?: unknown) => {
        answerCalls.push(payload);
      },
      api: {
        editMessageReplyMarkup: async () => ({}) as never,
      },
      callbackQuery: {
        data: `sv:u:${SUMMARY_ID}`,
      },
      from: {
        first_name: "Test",
        id: 123,
      },
    } as unknown as CallbackQueryContext<Context>;

    await handleSummaryVoteCallback(ctx);

    expect(insertCalls).toHaveLength(0);
    expect(answerCalls).toEqual([undefined]);
  });

  test("silently handles message-is-not-modified edit errors", async () => {
    currentVoteTotals = { likes: 7, dislikes: 2 };

    const answerCalls: unknown[] = [];

    const ctx = {
      answerCallbackQuery: async (payload?: unknown) => {
        answerCalls.push(payload);
      },
      api: {
        editMessageReplyMarkup: async () => {
          throw {
            description: "Bad Request: message is not modified",
          };
        },
      },
      callbackQuery: {
        data: `sv:u:${SUMMARY_ID}`,
        message: {
          chat: { id: -1001234 },
          message_id: 99,
        },
      },
      from: {
        first_name: "Test",
        id: 123,
      },
    } as unknown as CallbackQueryContext<Context>;

    await handleSummaryVoteCallback(ctx);

    expect(answerCalls).toEqual([undefined]);
  });
});
