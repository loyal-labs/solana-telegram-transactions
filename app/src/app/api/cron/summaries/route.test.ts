import { afterEach, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

import type { SendSummaryResult } from "@/lib/telegram/bot-api/types";

mock.module("server-only", () => ({}));

const TEST_ENV_KEYS = ["CRON_SECRET"] as const;

function clearTestEnv(): void {
  for (const key of TEST_ENV_KEYS) {
    delete process.env[key];
  }
}

function createDeliveredSummaryResult(
  chatId: bigint,
  messageId: number
): SendSummaryResult {
  return {
    deliveredMessage: {
      destinationChatId: chatId,
      messageId,
      sourceCommunityChatId: chatId,
    },
    sent: true as const,
  };
}

mock.module("@/lib/core/database", () => ({
  getDatabase: () => ({
    query: {
      communities: {
        findMany: async () => [],
      },
    },
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

describe("cron summaries route", () => {
  beforeAll(async () => {
    const loadedModule = await import("./route");
    buildDailySummaryRunContext = loadedModule.buildDailySummaryRunContext;
    POST = loadedModule.POST;
    runDailyCommunitySummaries = loadedModule.runDailyCommunitySummaries;
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

  test("processes cron requests", async () => {
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

  test("builds a stable UTC daily run context", () => {
    const run = buildDailySummaryRunContext(new Date("2026-06-16T05:00:00Z"));
    expect(run.dayStartUtc.toISOString()).toBe("2026-06-16T00:00:00.000Z");
    expect(run.dayEndUtc.toISOString()).toBe("2026-06-16T23:59:59.999Z");
  });

  test("runs communities in one pass and applies master-switch gating during delivery", async () => {
    const deliveredSummaryIds: string[] = [];

    const result = await runDailyCommunitySummaries({
      activeCommunityCount: 3,
      communities: [
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
          summaryNotificationsEnabled: false,
        },
        {
          id: "community-3",
          chatId: BigInt(303),
          chatTitle: "C",
          summaryNotificationsEnabled: true,
        },
      ],
      deliverSummary: async (summaryId) => {
        deliveredSummaryIds.push(summaryId);
        return createDeliveredSummaryResult(BigInt(101), 5001);
      },
      generateSummaryForRun: async (communityId) => {
        if (communityId === "community-1") {
          return { status: "created", summaryId: "s1", messageCount: 3 };
        }
        if (communityId === "community-2") {
          return { status: "created", summaryId: "s2", messageCount: 4 };
        }
        return { status: "not_enough_messages", messageCount: 1 };
      },
    });

    expect(deliveredSummaryIds).toEqual(["s1"]);
    expect(result.stats.activeCommunities).toBe(3);
    expect(result.stats.processed).toBe(3);
    expect(result.stats.generated).toBe(2);
    expect(result.stats.existingToday).toBe(0);
    expect(result.stats.skippedByMasterSwitch).toBe(1);
    expect(result.stats.skippedNotEnoughMessages).toBe(1);
    expect(result.stats.deliveryAttempted).toBe(1);
    expect(result.stats.deliverySucceeded).toBe(1);
    expect(result.stats.deliveryFailed).toBe(0);
    expect(result.stats.errors).toBe(0);
  });

  test("captures delivery failure and reports error", async () => {
    const result = await runDailyCommunitySummaries({
      activeCommunityCount: 1,
      communities: [
        {
          id: "community-1",
          chatId: BigInt(101),
          chatTitle: "A",
          summaryNotificationsEnabled: true,
        },
      ],
      deliverSummary: async () => {
        throw new Error("telegram send failed");
      },
      generateSummaryForRun: async () => ({
        status: "created",
        summaryId: "s1",
        messageCount: 3,
      }),
    });

    expect(result.stats.deliveryAttempted).toBe(1);
    expect(result.stats.deliveryFailed).toBe(1);
    expect(result.stats.deliverySucceeded).toBe(0);
    expect(result.stats.errors).toBe(1);
    expect(result.errors[0]?.scope).toBe("delivery");
  });

  test("attempts delivery only for created and existing summaries", async () => {
    const deliveredSummaryIds: string[] = [];

    const result = await runDailyCommunitySummaries({
      activeCommunityCount: 3,
      communities: [
        {
          id: "community-1",
          chatId: BigInt(111),
          chatTitle: "A",
          summaryNotificationsEnabled: true,
        },
        {
          id: "community-2",
          chatId: BigInt(222),
          chatTitle: "B",
          summaryNotificationsEnabled: true,
        },
        {
          id: "community-3",
          chatId: BigInt(333),
          chatTitle: "C",
          summaryNotificationsEnabled: true,
        },
      ],
      deliverSummary: async (summaryId) => {
        deliveredSummaryIds.push(summaryId);
        return createDeliveredSummaryResult(BigInt(111), 5002);
      },
      generateSummaryForRun: async (communityId) => {
        if (communityId === "community-1") {
          return { status: "existing", summaryId: "existing-summary", messageCount: 8 };
        }
        if (communityId === "community-2") {
          return { status: "created", summaryId: "new-summary", messageCount: 8 };
        }
        return { status: "not_enough_messages", messageCount: 1 };
      },
    });

    expect(deliveredSummaryIds).toEqual(["existing-summary", "new-summary"]);
    expect(result.stats.processed).toBe(3);
    expect(result.stats.generated).toBe(1);
    expect(result.stats.existingToday).toBe(1);
    expect(result.stats.skippedByMasterSwitch).toBe(0);
    expect(result.stats.skippedNotEnoughMessages).toBe(1);
    expect(result.stats.deliveryAttempted).toBe(2);
    expect(result.stats.deliverySucceeded).toBe(2);
    expect(result.stats.deliveryFailed).toBe(0);
    expect(result.stats.errors).toBe(0);
  });

  test("allows duplicate sends across repeated daily cron runs", async () => {
    const deliveredSummaryIds: string[] = [];
    const options = {
      activeCommunityCount: 1,
      communities: [
        {
          id: "community-1",
          chatId: BigInt(111),
          chatTitle: "A",
          summaryNotificationsEnabled: true,
        },
      ],
      deliverSummary: async (summaryId: string) => {
        deliveredSummaryIds.push(summaryId);
        return createDeliveredSummaryResult(BigInt(111), 5003);
      },
      generateSummaryForRun: async () => ({
        status: "existing" as const,
        summaryId: "existing-summary",
        messageCount: 8,
      }),
    };

    await runDailyCommunitySummaries(options);
    await runDailyCommunitySummaries(options);

    expect(deliveredSummaryIds).toEqual(["existing-summary", "existing-summary"]);
  });

  test("forwards delivered summaries through quality control callback", async () => {
    const forwardedCalls: Array<{
      deliveredMessage: {
        destinationChatId: bigint;
        messageId: number;
        sourceCommunityChatId: bigint;
      };
      summaryId: string;
    }> = [];

    const result = await runDailyCommunitySummaries({
      activeCommunityCount: 1,
      communities: [
        {
          id: "community-1",
          chatId: BigInt(111),
          chatTitle: "A",
          summaryNotificationsEnabled: true,
        },
      ],
      deliverSummary: async () => createDeliveredSummaryResult(BigInt(111), 9001),
      forwardDeliveredSummary: async (summaryId, deliveredMessage) => {
        forwardedCalls.push({ deliveredMessage, summaryId });
      },
      generateSummaryForRun: async () => ({
        status: "created",
        summaryId: "new-summary",
        messageCount: 8,
      }),
    });

    expect(forwardedCalls).toEqual([
      {
        deliveredMessage: {
          destinationChatId: BigInt(111),
          messageId: 9001,
          sourceCommunityChatId: BigInt(111),
        },
        summaryId: "new-summary",
      },
    ]);
    expect(result.stats.deliverySucceeded).toBe(1);
    expect(result.stats.deliveryFailed).toBe(0);
    expect(result.stats.errors).toBe(0);
  });

  test("keeps cron delivery successful when quality control forwarding fails", async () => {
    const result = await runDailyCommunitySummaries({
      activeCommunityCount: 1,
      communities: [
        {
          id: "community-1",
          chatId: BigInt(111),
          chatTitle: "A",
          summaryNotificationsEnabled: true,
        },
      ],
      deliverSummary: async () => createDeliveredSummaryResult(BigInt(111), 9002),
      forwardDeliveredSummary: async () => {
        throw new Error("qc forward failed");
      },
      generateSummaryForRun: async () => ({
        status: "created",
        summaryId: "new-summary",
        messageCount: 8,
      }),
    });

    expect(result.stats.deliverySucceeded).toBe(1);
    expect(result.stats.deliveryFailed).toBe(0);
    expect(result.stats.errors).toBe(0);
    expect(result.errors).toEqual([]);
  });

  test("does not forward when summary delivery is rejected", async () => {
    let forwardedCallCount = 0;

    const result = await runDailyCommunitySummaries({
      activeCommunityCount: 1,
      communities: [
        {
          id: "community-1",
          chatId: BigInt(111),
          chatTitle: "A",
          summaryNotificationsEnabled: true,
        },
      ],
      deliverSummary: async () => ({
        sent: false as const,
        reason: "notifications_disabled" as const,
      }),
      forwardDeliveredSummary: async () => {
        forwardedCallCount += 1;
      },
      generateSummaryForRun: async () => ({
        status: "created",
        summaryId: "new-summary",
        messageCount: 8,
      }),
    });

    expect(forwardedCallCount).toBe(0);
    expect(result.stats.deliveryAttempted).toBe(1);
    expect(result.stats.deliverySucceeded).toBe(0);
    expect(result.stats.deliveryFailed).toBe(1);
    expect(result.stats.errors).toBe(1);
    expect(result.errors[0]?.error).toContain("Summary delivery rejected");
  });
});
