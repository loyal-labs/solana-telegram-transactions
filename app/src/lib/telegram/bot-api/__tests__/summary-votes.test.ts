import { describe, expect, test } from "bun:test";
import type { CallbackQueryContext, Context } from "grammy";

import { MINI_APP_FEED_LINK } from "../constants";
import {
  buildSummaryVoteKeyboard,
  encodeSummaryVoteCallbackData,
  handleSummaryVoteCallback,
  parseSummaryVoteCallbackData,
  SUMMARY_VOTE_CALLBACK_DATA_REGEX,
} from "../summary-votes";

const SUMMARY_ID = "123e4567-e89b-12d3-a456-426614174000";
const MAX_VOTE_COUNT = 2_147_483_647;

describe("summary vote callback parser", () => {
  test("parses valid callback data", () => {
    const data = encodeSummaryVoteCallbackData({
      action: "u",
      dislikes: 4,
      likes: 7,
      summaryId: SUMMARY_ID,
    });

    expect(parseSummaryVoteCallbackData(data)).toEqual({
      action: "u",
      dislikes: 4,
      likes: 7,
      summaryId: SUMMARY_ID,
    });
  });

  test("rejects invalid callback data", () => {
    expect(parseSummaryVoteCallbackData("sv:u:bad-id:0:0")).toBeNull();
    expect(parseSummaryVoteCallbackData("sv:u:123:0:0")).toBeNull();
    expect(parseSummaryVoteCallbackData("sv:u:123:0")).toBeNull();
    expect(parseSummaryVoteCallbackData("unknown")).toBeNull();
  });

  test("rejects callback data with counts above int32 max", () => {
    expect(
      parseSummaryVoteCallbackData(`sv:u:${SUMMARY_ID}:${MAX_VOTE_COUNT + 1}:0`)
    ).toBeNull();
    expect(
      parseSummaryVoteCallbackData(`sv:d:${SUMMARY_ID}:0:${MAX_VOTE_COUNT + 1}`)
    ).toBeNull();
  });

  test("regex trigger only matches expected callback format", () => {
    expect(
      SUMMARY_VOTE_CALLBACK_DATA_REGEX.test(`sv:s:${SUMMARY_ID}:12:3`)
    ).toBe(true);
    expect(
      SUMMARY_VOTE_CALLBACK_DATA_REGEX.test(`sv:s:${SUMMARY_ID}:12:3:extra`)
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
    expect(rows[0][0]?.callback_data).toBe(`sv:u:${SUMMARY_ID}:5:2`);

    expect(rows[0][1]?.text).toBe("Score: 3");
    expect(rows[0][1]?.callback_data).toBe(`sv:s:${SUMMARY_ID}:5:2`);

    expect(rows[0][2]?.text).toBe("👎👎👎");
    expect(rows[0][2]?.callback_data).toBe(`sv:d:${SUMMARY_ID}:5:2`);

    expect(rows[1][0]?.text).toBe("Read in full");
    expect(rows[1][0]?.url).toBe(MINI_APP_FEED_LINK);
  });
});

describe("handleSummaryVoteCallback", () => {
  test("shows score alert for score button", async () => {
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
        data: `sv:s:${SUMMARY_ID}:4:1`,
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

  test("increments likes and updates keyboard for upvote", async () => {
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
        data: `sv:u:${SUMMARY_ID}:1:2`,
        message: {
          chat: { id: -1001234 },
          message_id: 99,
        },
      },
    } as unknown as CallbackQueryContext<Context>;

    await handleSummaryVoteCallback(ctx);

    expect(editCalls).toHaveLength(1);
    const [, , payload] = editCalls[0] as [number, number, { reply_markup: { inline_keyboard: Array<Array<{ callback_data?: string }>> } }];
    expect(payload.reply_markup.inline_keyboard[0]?.[1]?.callback_data).toBe(
      `sv:s:${SUMMARY_ID}:2:2`
    );
    expect(answerCalls).toEqual([undefined]);
  });

  test("clamps likes at int32 max during upvote", async () => {
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
        data: `sv:u:${SUMMARY_ID}:${MAX_VOTE_COUNT}:1`,
        message: {
          chat: { id: -1001234 },
          message_id: 99,
        },
      },
    } as unknown as CallbackQueryContext<Context>;

    await handleSummaryVoteCallback(ctx);

    expect(editCalls).toHaveLength(1);
    const [, , payload] = editCalls[0] as [
      number,
      number,
      {
        reply_markup: {
          inline_keyboard: Array<Array<{ callback_data?: string }>>;
        };
      },
    ];
    expect(payload.reply_markup.inline_keyboard[0]?.[1]?.callback_data).toBe(
      `sv:s:${SUMMARY_ID}:${MAX_VOTE_COUNT}:1`
    );
    expect(answerCalls).toEqual([undefined]);
  });

  test("increments dislikes and updates keyboard for downvote", async () => {
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
        data: `sv:d:${SUMMARY_ID}:2:1`,
        message: {
          chat: { id: -1001234 },
          message_id: 99,
        },
      },
    } as unknown as CallbackQueryContext<Context>;

    await handleSummaryVoteCallback(ctx);

    expect(editCalls).toHaveLength(1);
    const [, , payload] = editCalls[0] as [number, number, { reply_markup: { inline_keyboard: Array<Array<{ callback_data?: string }>> } }];
    expect(payload.reply_markup.inline_keyboard[0]?.[1]?.callback_data).toBe(
      `sv:s:${SUMMARY_ID}:2:2`
    );
    expect(answerCalls).toEqual([undefined]);
  });

  test("clamps dislikes at int32 max during downvote", async () => {
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
        data: `sv:d:${SUMMARY_ID}:1:${MAX_VOTE_COUNT}`,
        message: {
          chat: { id: -1001234 },
          message_id: 99,
        },
      },
    } as unknown as CallbackQueryContext<Context>;

    await handleSummaryVoteCallback(ctx);

    expect(editCalls).toHaveLength(1);
    const [, , payload] = editCalls[0] as [
      number,
      number,
      {
        reply_markup: {
          inline_keyboard: Array<Array<{ callback_data?: string }>>;
        };
      },
    ];
    expect(payload.reply_markup.inline_keyboard[0]?.[1]?.callback_data).toBe(
      `sv:s:${SUMMARY_ID}:1:${MAX_VOTE_COUNT}`
    );
    expect(answerCalls).toEqual([undefined]);
  });

  test("answers callback when vote callback has no message payload", async () => {
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
        data: `sv:u:${SUMMARY_ID}:1:1`,
      },
    } as unknown as CallbackQueryContext<Context>;

    await handleSummaryVoteCallback(ctx);

    expect(editCalls).toHaveLength(0);
    expect(answerCalls).toEqual([undefined]);
  });

  test("silently handles message-is-not-modified edit errors", async () => {
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
        data: `sv:u:${SUMMARY_ID}:5:5`,
        message: {
          chat: { id: -1001234 },
          message_id: 99,
        },
      },
    } as unknown as CallbackQueryContext<Context>;

    await handleSummaryVoteCallback(ctx);

    expect(answerCalls).toEqual([undefined]);
  });
});
