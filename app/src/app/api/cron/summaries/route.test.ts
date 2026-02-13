import { afterEach, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

const TEST_ENV_KEYS = ["CRON_SECRET"] as const;

function clearTestEnv(): void {
  for (const key of TEST_ENV_KEYS) {
    delete process.env[key];
  }
}

mock.module("@/lib/core/database", () => ({
  getDatabase: () => ({
    query: {
      communities: {
        findMany: async () => [],
      },
      summaries: {
        findMany: async () => [],
      },
    },
    select: () => ({
      from: () => ({
        where: () => ({
          groupBy: async () => [],
        }),
      }),
    }),
  }),
}));

mock.module("@/lib/telegram/bot-api/bot", () => ({
  getBot: async () => ({
    api: {},
  }),
}));

let POST: (request: Request) => Promise<Response>;
let buildDailySummaryRunContext: typeof import("./route").buildDailySummaryRunContext;
let runDailyCommunitySummaries: typeof import("./route").runDailyCommunitySummaries;
let selectCandidateCommunities: typeof import("./route").selectCandidateCommunities;

describe("cron summaries route", () => {
  beforeAll(async () => {
    const loadedModule = await import("./route");
    buildDailySummaryRunContext = loadedModule.buildDailySummaryRunContext;
    POST = loadedModule.POST;
    runDailyCommunitySummaries = loadedModule.runDailyCommunitySummaries;
    selectCandidateCommunities = loadedModule.selectCandidateCommunities;
  });

  beforeEach(() => {
    clearTestEnv();
  });

  afterEach(() => {
    clearTestEnv();
  });

  test("returns 500 when CRON_SECRET is missing", async () => {
    const request = new Request("http://localhost/api/cron/summaries", {
      method: "POST",
      headers: { authorization: "Bearer any-token" },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const payload = await response.json();
    expect(payload).toEqual({ error: "Server misconfigured" });
  });

  test("returns 401 when Authorization does not match CRON_SECRET", async () => {
    process.env.CRON_SECRET = "expected-secret";

    const request = new Request("http://localhost/api/cron/summaries", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const payload = await response.json();
    expect(payload).toEqual({ error: "Unauthorized" });
  });

  test("processes cron requests without LA-hour skip gating", async () => {
    process.env.CRON_SECRET = "expected-secret";
    const request = new Request("http://localhost/api/cron/summaries", {
      method: "POST",
      headers: { authorization: "Bearer expected-secret" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.reason).toBeUndefined();
    expect(payload.skipped).toBe(false);
    expect(payload.ok).toBe(true);
    expect(payload.run).toBeDefined();
    expect(payload.stats).toBeDefined();
  });

  test("builds a stable daily trigger key in Los Angeles time", () => {
    const run = buildDailySummaryRunContext(new Date("2026-06-16T05:00:00Z"));
    expect(run.triggerType).toBe("cron_daily_la");
    expect(run.triggerKey).toBe("cron-daily-la:2026-06-15");
  });

  test("selects only communities with enough messages and no existing summary", () => {
    const candidates = selectCandidateCommunities({
      activeCommunities: [
        {
          id: "community-1",
          chatId: BigInt(101),
          chatTitle: "A",
          summaryNotificationsEnabled: true,
        },
        {
          id: "community-2",
          chatId: BigInt(202),
          chatTitle: "B",
          summaryNotificationsEnabled: true,
        },
        {
          id: "community-3",
          chatId: BigInt(303),
          chatTitle: "C",
          summaryNotificationsEnabled: true,
        },
      ],
      existingSummaryCommunityIds: new Set(["community-2"]),
      messageCountsByCommunityId: new Map([
        ["community-1", 7],
        ["community-2", 9],
        ["community-3", 2],
      ]),
    });

    expect(candidates.map((item) => item.id)).toEqual(["community-1"]);
  });

  test("tracks generation and delivery stats with notification filtering", async () => {
    const deliveredSummaryIds: string[] = [];

    const result = await runDailyCommunitySummaries({
      activeCommunityCount: 3,
      candidateCommunities: [
        {
          id: "community-1",
          chatId: BigInt(101),
          chatTitle: "A",
          summaryNotificationsEnabled: true,
        },
        {
          id: "community-2",
          chatId: BigInt(202),
          chatTitle: "B",
          summaryNotificationsEnabled: true,
        },
      ],
      deliverSummary: async (summaryId) => {
        deliveredSummaryIds.push(summaryId);
        return { delivered: true };
      },
      generateSummaryForRun: async (communityId) => {
        if (communityId === "community-1") {
          return { status: "created", summaryId: "s1", messageCount: 7 };
        }
        return { status: "existing", summaryId: "s2", messageCount: 8 };
      },
      listPendingDeliveries: async () => [
        {
          chatId: BigInt(101),
          communityId: "community-1",
          isActive: true,
          summaryId: "s1",
          summaryNotificationsEnabled: true,
        },
        {
          chatId: BigInt(202),
          communityId: "community-2",
          isActive: true,
          summaryId: "s2",
          summaryNotificationsEnabled: false,
        },
      ],
    });

    expect(deliveredSummaryIds).toEqual(["s1"]);
    expect(result.stats.activeCommunities).toBe(3);
    expect(result.stats.candidates).toBe(2);
    expect(result.stats.generated).toBe(1);
    expect(result.stats.existingForRun).toBe(1);
    expect(result.stats.deliveryAttempted).toBe(1);
    expect(result.stats.deliverySucceeded).toBe(1);
    expect(result.stats.deliveryFailed).toBe(0);
    expect(result.stats.errors).toBe(0);
  });

  test("captures delivery failure and reports error", async () => {
    const result = await runDailyCommunitySummaries({
      activeCommunityCount: 1,
      candidateCommunities: [],
      deliverSummary: async () => {
        throw new Error("telegram send failed");
      },
      generateSummaryForRun: async () => ({
        status: "not_enough_messages",
        messageCount: 0,
      }),
      listPendingDeliveries: async () => [
        {
          chatId: BigInt(101),
          communityId: "community-1",
          isActive: true,
          summaryId: "s1",
          summaryNotificationsEnabled: true,
        },
      ],
    });

    expect(result.stats.deliveryAttempted).toBe(1);
    expect(result.stats.deliveryFailed).toBe(1);
    expect(result.stats.deliverySucceeded).toBe(0);
    expect(result.stats.errors).toBe(1);
    expect(result.errors[0]?.scope).toBe("delivery");
  });
});
