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

const summaryGenerationCalls: unknown[] = [];
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
          onConflictDoNothing: () => ({
            returning: async () => insertReturningQueue.shift() ?? [],
          }),
          returning: async () => insertReturningQueue.shift() ?? [],
        };
      },
    }),
  }),
}));

let createSummariesService: typeof import("../summaries").createSummariesService;
let summariesService: ReturnType<typeof createSummariesService>;

const run = {
  dayEndUtc: new Date("2026-02-13T23:59:59.999Z"),
  dayStartUtc: new Date("2026-02-13T00:00:00.000Z"),
  windowEnd: new Date("2026-02-13T06:00:00Z"),
  windowStart: new Date("2026-02-12T06:00:00Z"),
};

describe("generateOrGetSummaryForRun", () => {
  beforeAll(async () => {
    const loadedModule = await import("../summaries");
    createSummariesService = loadedModule.createSummariesService;
  });

  beforeEach(() => {
    summaryGenerationCalls.length = 0;
    insertedSummaryValues.length = 0;
    countResult = 0;
    recentMessages = [];
    summariesFindFirstResults = [];
    insertReturningQueue = [[{ id: "summary-1", messageCount: 5 }]];

    summariesService = createSummariesService({
      summaryGenerationService: {
        generate: async (payload) => {
          summaryGenerationCalls.push(payload);
          return {
            diagnostics: {
              attempts: 2,
              failureReasons: [],
              finalModel: "deepseek/deepseek-v3.2",
              latencyMs: 120,
              usedExampleSet: "summaries/examples/v1",
            },
            oneliner: "Launch scope tightened before ship date",
            topics: [
              {
                content: "Team discussed launch scope",
                sources: ["Alice", "Bob"],
                title: "Launch",
              },
            ],
          };
        },
      },
      summaryModelResolver: () => "deepseek/deepseek-v3.2",
    });
  });

  test("skips generation when fewer than minimum messages exist", async () => {
    countResult = 2;

    const result = await summariesService.generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });

    expect(result).toEqual({ status: "not_enough_messages", messageCount: 2 });
    expect(summaryGenerationCalls).toHaveLength(0);
    expect(insertedSummaryValues).toHaveLength(0);
  });

  test("returns existing summary when one already exists for today", async () => {
    countResult = 9;
    summariesFindFirstResults = [{ id: "existing-1", messageCount: 9 }];

    const result = await summariesService.generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });

    expect(result).toEqual({
      status: "existing",
      summaryId: "existing-1",
      messageCount: 9,
    });
    expect(summaryGenerationCalls).toHaveLength(0);
    expect(insertedSummaryValues).toHaveLength(0);
  });

  test("falls back to legacy created-at day lookup when trigger key is absent", async () => {
    countResult = 9;
    summariesFindFirstResults = [null, { id: "existing-legacy", messageCount: 9 }];

    const result = await summariesService.generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });

    expect(result).toEqual({
      status: "existing",
      summaryId: "existing-legacy",
      messageCount: 9,
    });
    expect(summaryGenerationCalls).toHaveLength(0);
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

    const result = await summariesService.generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });

    expect(result).toEqual({
      status: "created",
      summaryId: "summary-1",
      messageCount: 5,
    });
    expect(summaryGenerationCalls).toHaveLength(1);
    expect(summaryGenerationCalls[0]).toMatchObject({
      dayKeyUtc: "2026-02-13",
      modelKey: "deepseek/deepseek-v3.2",
      participants: ["User1", "User2", "User3", "User4", "User5"],
    });
    expect(insertedSummaryValues).toHaveLength(1);
    expect(insertedSummaryValues[0]).toMatchObject({
      oneliner: "Launch scope tightened before ship date",
      triggerKey: "daily:2026-02-13",
      triggerType: "daily",
    });
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

    const result = await summariesService.generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });

    expect(result).toEqual({
      status: "created",
      summaryId: "summary-1",
      messageCount: 3,
    });
    expect(summaryGenerationCalls).toHaveLength(1);
    expect(insertedSummaryValues).toHaveLength(1);
  });

  test("does not create duplicate summaries on repeated runs for the same day", async () => {
    countResult = 4;
    summariesFindFirstResults = [null, null, { id: "existing-2", messageCount: 4 }];
    insertReturningQueue = [[{ id: "summary-1", messageCount: 4 }]];
    recentMessages = Array.from({ length: 4 }, (_, index) => ({
      content: `msg ${index + 1}`,
      telegramMessageId: BigInt(index + 1),
      user: { displayName: `User${index + 1}` },
    }));

    const firstRun = await summariesService.generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });
    const secondRun = await summariesService.generateOrGetSummaryForRun({
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

  test("returns existing summary when insert conflicts on trigger key", async () => {
    countResult = 4;
    summariesFindFirstResults = [null, null, { id: "existing-3", messageCount: 4 }];
    insertReturningQueue = [[]];
    recentMessages = Array.from({ length: 4 }, (_, index) => ({
      content: `msg ${index + 1}`,
      telegramMessageId: BigInt(index + 1),
      user: { displayName: `User${index + 1}` },
    }));

    const result = await summariesService.generateOrGetSummaryForRun({
      chatTitle: "General",
      communityId: "community-1",
      run,
    });

    expect(result).toEqual({
      status: "existing",
      summaryId: "existing-3",
      messageCount: 4,
    });
    expect(insertedSummaryValues).toHaveLength(1);
  });
});
