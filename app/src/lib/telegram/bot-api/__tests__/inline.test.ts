import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { Context, InlineQueryContext } from "grammy";
import type { InlineQueryResultArticle } from "grammy/types";

import { MINI_APP_LINK } from "@/lib/telegram/constants";
import { buildSummaryFeedMiniAppUrl } from "@/lib/telegram/mini-app/start-param";

mock.module("server-only", () => ({}));

type CommunityRecord = {
  chatId: bigint;
  chatTitle: string;
  id: string;
  isActive: boolean;
};

type SummaryRecord = {
  createdAt: Date;
  id: string;
  oneliner: string;
  topics: Array<{
    content: string;
    sources: string[];
    title: string;
  }>;
};

let communityRecord: CommunityRecord | null = null;
let summaryRecords: SummaryRecord[] = [];
let summaryVoteTotalsResult = { dislikes: 1, likes: 3 };

mock.module("@/lib/core/database", () => ({
  getDatabase: () => ({
    query: {
      communities: {
        findFirst: async () => communityRecord,
      },
      summaries: {
        findMany: async (options?: { limit?: number }) =>
          typeof options?.limit === "number"
            ? summaryRecords.slice(0, options.limit)
            : summaryRecords,
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
    throw new Error("chatCompletion should not be called in inline tests");
  },
}));

let handleInlineQuery: typeof import("../inline").handleInlineQuery;
let handleSummaryInlineQuery: typeof import("../inline").handleSummaryInlineQuery;
let SUMMARY_INLINE_QUERY_REGEX: typeof import("../inline").SUMMARY_INLINE_QUERY_REGEX;

function createSummaryRecord(id: string, createdAt: string): SummaryRecord {
  return {
    createdAt: new Date(createdAt),
    id,
    oneliner: `Summary ${id}`,
    topics: [
      {
        content: "Team discussed launch scope. Second sentence should not appear.",
        sources: ["Alice", "Bob"],
        title: "Launch",
      },
      {
        content: "Finalized rollout timeline! More context not shown.",
        sources: ["Alice"],
        title: "Rollout",
      },
    ],
  };
}

function createInlineContext(match?: unknown) {
  const answerInlineQueryCalls: unknown[][] = [];

  const ctx = {
    answerInlineQuery: async (...args: unknown[]) => {
      answerInlineQueryCalls.push(args);
    },
    match,
  } as unknown as InlineQueryContext<Context>;

  return { answerInlineQueryCalls, ctx };
}

describe("inline query handlers", () => {
  beforeAll(async () => {
    const inlineModule = await import("../inline");
    handleInlineQuery = inlineModule.handleInlineQuery;
    handleSummaryInlineQuery = inlineModule.handleSummaryInlineQuery;
    SUMMARY_INLINE_QUERY_REGEX = inlineModule.SUMMARY_INLINE_QUERY_REGEX;
  });

  beforeEach(() => {
    communityRecord = {
      chatId: BigInt("-1001234567890"),
      chatTitle: "Loyal Alpha",
      id: "community-1",
      isActive: true,
    };
    summaryRecords = [
      createSummaryRecord("123e4567-e89b-12d3-a456-426614174000", "2026-02-12T00:00:00Z"),
      createSummaryRecord("123e4567-e89b-12d3-a456-426614174001", "2026-02-11T00:00:00Z"),
      createSummaryRecord("123e4567-e89b-12d3-a456-426614174002", "2026-02-10T00:00:00Z"),
      createSummaryRecord("123e4567-e89b-12d3-a456-426614174003", "2026-02-09T00:00:00Z"),
      createSummaryRecord("123e4567-e89b-12d3-a456-426614174004", "2026-02-08T00:00:00Z"),
      createSummaryRecord("123e4567-e89b-12d3-a456-426614174005", "2026-02-07T00:00:00Z"),
    ];
    summaryVoteTotalsResult = { dislikes: 1, likes: 3 };
  });

  test("summary inline regex matches summary:<chat_id> queries", () => {
    const match = "summary:-1001234567890".match(SUMMARY_INLINE_QUERY_REGEX);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe("-1001234567890");
    expect("summary:{-1001234567890}".match(SUMMARY_INLINE_QUERY_REGEX)).toBeNull();
    expect("hello world".match(SUMMARY_INLINE_QUERY_REGEX)).toBeNull();
  });

  test("handleSummaryInlineQuery returns up to five summaries with summary payload formatting", async () => {
    const match = "summary:-1001234567890".match(SUMMARY_INLINE_QUERY_REGEX);
    const { answerInlineQueryCalls, ctx } = createInlineContext(match);

    await handleSummaryInlineQuery(ctx);

    expect(answerInlineQueryCalls).toHaveLength(1);
    const [results, options] = answerInlineQueryCalls[0] as [
      InlineQueryResultArticle[],
      {
        button: {
          text: string;
          web_app: { url: string };
        };
      },
    ];

    expect(options.button.text).toBe("Loyal Wallet");
    expect(options.button.web_app.url).toBe(MINI_APP_LINK);
    expect(results).toHaveLength(5);

    const firstResult = results[0];
    expect(firstResult.type).toBe("article");
    expect(firstResult.id).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(firstResult.title).toBe("Loyal Alpha • 2026-02-12");

    const inputMessageContent = firstResult.input_message_content as {
      link_preview_options?: { prefer_large_media?: boolean };
      message_text: string;
      parse_mode?: string;
    };
    expect(inputMessageContent.parse_mode).toBe("HTML");
    expect(inputMessageContent.link_preview_options?.prefer_large_media).toBe(true);
    expect(inputMessageContent.message_text).toContain(
      '<tg-emoji emoji-id="5255883309841422076">🔹</tg-emoji> Team discussed launch scope.'
    );
    expect(inputMessageContent.message_text).toContain(
      '<tg-emoji emoji-id="5255883309841422076">🔹</tg-emoji> Finalized rollout timeline!'
    );
    expect(inputMessageContent.message_text).not.toContain(
      "Second sentence should not appear."
    );

    const keyboard = firstResult.reply_markup as {
      inline_keyboard: Array<
        Array<{
          callback_data?: string;
          text?: string;
          url?: string;
        }>
      >;
    };

    expect(keyboard.inline_keyboard[0]?.[0]?.callback_data).toBe(
      "sv:u:123e4567-e89b-12d3-a456-426614174000:-1001234567890"
    );
    expect(keyboard.inline_keyboard[0]?.[1]?.text).toBe("Score: 2");
    expect(keyboard.inline_keyboard[0]?.[2]?.callback_data).toBe(
      "sv:d:123e4567-e89b-12d3-a456-426614174000:-1001234567890"
    );
    expect(keyboard.inline_keyboard[1]?.[0]?.url).toBe(
      buildSummaryFeedMiniAppUrl(
        BigInt("-1001234567890"),
        "123e4567-e89b-12d3-a456-426614174000"
      )
    );
  });

  test("handleSummaryInlineQuery returns empty results when community is missing", async () => {
    communityRecord = null;
    const match = "summary:-1001234567890".match(SUMMARY_INLINE_QUERY_REGEX);
    const { answerInlineQueryCalls, ctx } = createInlineContext(match);

    await handleSummaryInlineQuery(ctx);

    expect(answerInlineQueryCalls).toHaveLength(1);
    const [results, options] = answerInlineQueryCalls[0] as [
      InlineQueryResultArticle[],
      {
        button: {
          text: string;
          web_app: { url: string };
        };
      },
    ];

    expect(results).toEqual([]);
    expect(options.button.text).toBe("Loyal Wallet");
    expect(options.button.web_app.url).toBe(MINI_APP_LINK);
  });

  test("handleSummaryInlineQuery returns empty results when no summaries are found", async () => {
    summaryRecords = [];
    const match = "summary:-1001234567890".match(SUMMARY_INLINE_QUERY_REGEX);
    const { answerInlineQueryCalls, ctx } = createInlineContext(match);

    await handleSummaryInlineQuery(ctx);

    expect(answerInlineQueryCalls).toHaveLength(1);
    const [results, options] = answerInlineQueryCalls[0] as [
      InlineQueryResultArticle[],
      {
        button: {
          text: string;
          web_app: { url: string };
        };
      },
    ];

    expect(results).toEqual([]);
    expect(options.button.text).toBe("Loyal Wallet");
    expect(options.button.web_app.url).toBe(MINI_APP_LINK);
  });

  test("handleInlineQuery keeps fallback behavior for non-matching queries", async () => {
    const { answerInlineQueryCalls, ctx } = createInlineContext();

    await handleInlineQuery(ctx);

    expect(answerInlineQueryCalls).toHaveLength(1);
    const [results, options] = answerInlineQueryCalls[0] as [
      InlineQueryResultArticle[],
      {
        button: {
          text: string;
          web_app: { url: string };
        };
      },
    ];

    expect(results).toEqual([]);
    expect(options.button.text).toBe("Loyal Wallet");
    expect(options.button.web_app.url).toBe(MINI_APP_LINK);
  });
});
