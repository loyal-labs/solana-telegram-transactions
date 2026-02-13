import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

type SummaryRecord = {
  id: string;
  messageCount: number;
} | null;

type MessageRecord = {
  content: string;
  telegramMessageId: bigint;
  user: { displayName: string };
};

const chatCompletionCalls: unknown[] = [];
const insertedSummaryValues: unknown[] = [];

let countResult = 0;
let recentMessages: MessageRecord[] = [];
let summariesFindFirstResults: SummaryRecord[] = [];
let insertReturningQueue: Array<Array<{ id: string; messageCount: number }>> = [
  [{ id: "summary-1", messageCount: 5 }],
];

mock.module("@/lib/core/database", () => ({
  getDatabase: () => ({
    query: {
      summaries: {
        findFirst: async () => summariesFindFirstResults.shift() ?? null,
      },
      messages: {
        findMany: async () => recentMessages,
      },
    },
    select: () => ({
      from: () => ({
        where: async () => [{ count: countResult }],
      }),
    }),
    insert: () => ({
      values: (values: unknown) => {
        insertedSummaryValues.push(values);
        return {
          returning: async () => insertReturningQueue.shift() ?? [],
        };
      },
    }),
  }),
}));

mock.module("@/lib/redpill", () => ({
  chatCompletion: async (payload: unknown) => {
    chatCompletionCalls.push(payload);
    if (chatCompletionCalls.length % 2 === 1) {
      return {
        choices: [
          {
            message: {
              content:
                '{"topics":[{"title":"Launch","content":"Team discussed launch scope","sources":["Alice","Bob"]}]}',
            },
          },
        ],
      };
    }

    return {
      choices: [{ message: { content: "Launch scope tightened before ship date" } }],
    };
  },
}));

let generateOrGetSummaryForRun: typeof import("../summaries").generateOrGetSummaryForRun;

const run = {
  dayEndUtc: new Date("2026-02-13T23:59:59.999Z"),
  dayStartUtc: new Date("2026-02-13T00:00:00.000Z"),
  windowEnd: new Date("2026-02-13T06:00:00Z"),
  windowStart: new Date("2026-02-12T06:00:00Z"),
};

describe("generateOrGetSummaryForRun", () => {
  beforeAll(async () => {
    const loadedModule = await import("../summaries");
    generateOrGetSummaryForRun = loadedModule.generateOrGetSummaryForRun;
  });

  beforeEach(() => {
    chatCompletionCalls.length = 0;
    insertedSummaryValues.length = 0;
    countResult = 0;
    recentMessages = [];
    summariesFindFirstResults = [];
    insertReturningQueue = [[{ id: "summary-1", messageCount: 5 }]];
  });

  test("skips generation when fewer than minimum messages exist", async () => {
    countResult = 2;

    const result = await generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });

    expect(result).toEqual({ status: "not_enough_messages", messageCount: 2 });
    expect(chatCompletionCalls).toHaveLength(0);
    expect(insertedSummaryValues).toHaveLength(0);
  });

  test("returns existing summary when one already exists for today", async () => {
    countResult = 9;
    summariesFindFirstResults = [{ id: "existing-1", messageCount: 9 }];

    const result = await generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });

    expect(result).toEqual({
      status: "existing",
      summaryId: "existing-1",
      messageCount: 9,
    });
    expect(chatCompletionCalls).toHaveLength(0);
    expect(insertedSummaryValues).toHaveLength(0);
  });

  test("creates a summary when enough messages exist and no summary exists for today", async () => {
    countResult = 5;
    summariesFindFirstResults = [null];
    recentMessages = Array.from({ length: 5 }, (_, index) => ({
      content: `msg ${index + 1}`,
      telegramMessageId: BigInt(index + 1),
      user: { displayName: `User${index + 1}` },
    }));

    const result = await generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });

    expect(result).toEqual({
      status: "created",
      summaryId: "summary-1",
      messageCount: 5,
    });
    expect(chatCompletionCalls).toHaveLength(2);
    expect(insertedSummaryValues).toHaveLength(1);
  });

  test("creates a summary when message count reaches the minimum threshold", async () => {
    countResult = 3;
    summariesFindFirstResults = [null];
    insertReturningQueue = [[{ id: "summary-1", messageCount: 3 }]];
    recentMessages = Array.from({ length: 3 }, (_, index) => ({
      content: `msg ${index + 1}`,
      telegramMessageId: BigInt(index + 1),
      user: { displayName: `User${index + 1}` },
    }));

    const result = await generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });

    expect(result).toEqual({
      status: "created",
      summaryId: "summary-1",
      messageCount: 3,
    });
    expect(chatCompletionCalls).toHaveLength(2);
    expect(insertedSummaryValues).toHaveLength(1);
  });

  test("does not create duplicate summaries on repeated runs for the same day", async () => {
    countResult = 4;
    summariesFindFirstResults = [null, { id: "existing-2", messageCount: 4 }];
    insertReturningQueue = [[{ id: "summary-1", messageCount: 4 }]];
    recentMessages = Array.from({ length: 4 }, (_, index) => ({
      content: `msg ${index + 1}`,
      telegramMessageId: BigInt(index + 1),
      user: { displayName: `User${index + 1}` },
    }));

    const firstRun = await generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });
    const secondRun = await generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });

    expect(firstRun).toEqual({
      status: "created",
      summaryId: "summary-1",
      messageCount: 4,
    });
    expect(secondRun).toEqual({
      status: "existing",
      summaryId: "existing-2",
      messageCount: 4,
    });
    expect(insertedSummaryValues).toHaveLength(1);
  });
});
