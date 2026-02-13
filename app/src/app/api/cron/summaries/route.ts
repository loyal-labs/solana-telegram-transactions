import { timingSafeEqual } from "crypto";
import {
  and,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/core/config/server";
import { getDatabase } from "@/lib/core/database";
import { communities, messages, summaries } from "@/lib/core/schema";
import { getBot } from "@/lib/telegram/bot-api/bot";
import {
  attemptSummaryNotificationDelivery,
  type AttemptSummaryNotificationDeliveryResult,
  generateOrGetSummaryForRun,
  type GenerateOrGetSummaryForRunResult,
  MIN_MESSAGES_FOR_SUMMARY,
  type SummaryRunContext,
} from "@/lib/telegram/bot-api/summaries";
import { SUMMARY_INTERVAL_MS } from "@/lib/telegram/utils";

export const runtime = "nodejs";

const DAILY_TRIGGER_TYPE = "cron_daily_la";

type ActiveCommunityRecord = {
  id: string;
  chatId: bigint;
  chatTitle: string;
  summaryNotificationsEnabled: boolean;
};

type PendingDeliveryRecord = {
  chatId: bigint;
  communityId: string;
  isActive: boolean;
  summaryId: string;
  summaryNotificationsEnabled: boolean;
};

type CommunityProcessingError = {
  chatId?: string;
  communityId?: string;
  error: string;
  scope: "delivery" | "generation";
  summaryId?: string;
};

export type SummaryCronStats = {
  activeCommunities: number;
  candidates: number;
  deliveryAttempted: number;
  deliveryFailed: number;
  deliverySucceeded: number;
  errors: number;
  existingForRun: number;
  generated: number;
  processed: number;
  skippedNotEnoughMessages: number;
};

type RunDailyCommunitySummariesOptions = {
  activeCommunityCount: number;
  candidateCommunities: ActiveCommunityRecord[];
  deliverSummary: (
    summaryId: string
  ) => Promise<AttemptSummaryNotificationDeliveryResult>;
  generateSummaryForRun: (
    communityId: string,
    chatTitle: string
  ) => Promise<GenerateOrGetSummaryForRunResult>;
  listPendingDeliveries: () => Promise<PendingDeliveryRecord[]>;
};

type RunDailyCommunitySummariesResult = {
  errors: CommunityProcessingError[];
  stats: SummaryCronStats;
};

export async function GET(request: Request): Promise<NextResponse> {
  return POST(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  const authErrorResponse = validateAuthHeader(request);
  if (authErrorResponse) {
    return authErrorResponse;
  }

  const now = new Date();
  const run = buildDailySummaryRunContext(now);
  const db = getDatabase();

  const activeCommunities = await db.query.communities.findMany({
    columns: {
      chatId: true,
      chatTitle: true,
      id: true,
      summaryNotificationsEnabled: true,
    },
    where: eq(communities.isActive, true),
  });

  const messageCountsByCommunityId = await loadMessageCountsByCommunityForRun(
    activeCommunities.map((community) => community.id),
    run
  );

  const communitiesMeetingVolume = Array.from(messageCountsByCommunityId.entries())
    .filter(([, messageCount]) => messageCount >= MIN_MESSAGES_FOR_SUMMARY)
    .map(([communityId]) => communityId);

  const existingSummaryCommunityIds = await loadExistingSummaryCommunityIdsForRun(
    communitiesMeetingVolume,
    run
  );

  const candidateCommunities = selectCandidateCommunities({
    activeCommunities,
    existingSummaryCommunityIds,
    messageCountsByCommunityId,
  });

  let botPromise: Promise<Awaited<ReturnType<typeof getBot>>> | null = null;
  const result = await runDailyCommunitySummaries({
    activeCommunityCount: activeCommunities.length,
    candidateCommunities,
    deliverSummary: async (summaryId) => {
      if (!botPromise) {
        botPromise = getBot();
      }

      return attemptSummaryNotificationDelivery(await botPromise, summaryId);
    },
    generateSummaryForRun: (communityId, chatTitle) =>
      generateOrGetSummaryForRun({
        chatTitle,
        communityId,
        run,
      }),
    listPendingDeliveries: () => loadPendingRunSummaryDeliveries(run),
  });

  const hasErrors = result.stats.errors > 0;
  return NextResponse.json(
    {
      errors: result.errors,
      ok: !hasErrors,
      run,
      skipped: false,
      stats: result.stats,
    },
    { status: hasErrors ? 500 : 200 }
  );
}

export function getLosAngelesDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Los_Angeles",
    year: "numeric",
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;

  if (!day || !month || !year) {
    throw new Error("Unable to resolve Los Angeles local date key");
  }

  return `${year}-${month}-${day}`;
}

export function buildDailySummaryRunContext(date: Date = new Date()): SummaryRunContext {
  return {
    triggerKey: `cron-daily-la:${getLosAngelesDateKey(date)}`,
    triggerType: DAILY_TRIGGER_TYPE,
    windowEnd: date,
    windowStart: new Date(date.getTime() - SUMMARY_INTERVAL_MS),
  };
}

export function selectCandidateCommunities(input: {
  activeCommunities: ActiveCommunityRecord[];
  existingSummaryCommunityIds: Set<string>;
  messageCountsByCommunityId: Map<string, number>;
}): ActiveCommunityRecord[] {
  return input.activeCommunities.filter((community) => {
    const messageCount = input.messageCountsByCommunityId.get(community.id) ?? 0;
    if (messageCount < MIN_MESSAGES_FOR_SUMMARY) {
      return false;
    }

    return !input.existingSummaryCommunityIds.has(community.id);
  });
}

export async function runDailyCommunitySummaries(
  options: RunDailyCommunitySummariesOptions
): Promise<RunDailyCommunitySummariesResult> {
  const stats: SummaryCronStats = {
    activeCommunities: options.activeCommunityCount,
    candidates: options.candidateCommunities.length,
    deliveryAttempted: 0,
    deliveryFailed: 0,
    deliverySucceeded: 0,
    errors: 0,
    existingForRun: 0,
    generated: 0,
    processed: 0,
    skippedNotEnoughMessages: 0,
  };
  const errors: CommunityProcessingError[] = [];

  for (const community of options.candidateCommunities) {
    stats.processed += 1;

    try {
      const generationResult = await options.generateSummaryForRun(
        community.id,
        community.chatTitle
      );

      if (generationResult.status === "created") {
        stats.generated += 1;
        continue;
      }

      if (generationResult.status === "existing") {
        stats.existingForRun += 1;
        continue;
      }

      stats.skippedNotEnoughMessages += 1;
    } catch (error) {
      stats.errors += 1;
      errors.push({
        chatId: String(community.chatId),
        communityId: community.id,
        error: error instanceof Error ? error.message : String(error),
        scope: "generation",
      });
    }
  }

  const pendingDeliveries = await options.listPendingDeliveries();
  for (const pending of pendingDeliveries) {
    if (!pending.isActive || !pending.summaryNotificationsEnabled) {
      continue;
    }

    stats.deliveryAttempted += 1;

    try {
      const deliveryResult = await options.deliverSummary(pending.summaryId);
      if (!deliveryResult.delivered) {
        if (deliveryResult.reason === "not_found") {
          stats.deliveryFailed += 1;
          stats.errors += 1;
          errors.push({
            chatId: String(pending.chatId),
            communityId: pending.communityId,
            error: "Summary not found during delivery",
            scope: "delivery",
            summaryId: pending.summaryId,
          });
        }
        continue;
      }

      stats.deliverySucceeded += 1;
    } catch (error) {
      stats.deliveryFailed += 1;
      stats.errors += 1;
      errors.push({
        chatId: String(pending.chatId),
        communityId: pending.communityId,
        error: error instanceof Error ? error.message : String(error),
        scope: "delivery",
        summaryId: pending.summaryId,
      });
    }
  }

  return { errors, stats };
}

async function loadMessageCountsByCommunityForRun(
  activeCommunityIds: string[],
  run: SummaryRunContext
): Promise<Map<string, number>> {
  if (activeCommunityIds.length === 0) {
    return new Map();
  }

  const db = getDatabase();
  const rows = await db
    .select({
      communityId: messages.communityId,
      messageCount: sql<number>`count(*)`,
    })
    .from(messages)
    .where(
      and(
        inArray(messages.communityId, activeCommunityIds),
        gte(messages.createdAt, run.windowStart),
        lte(messages.createdAt, run.windowEnd)
      )
    )
    .groupBy(messages.communityId);

  return new Map(
    rows.map((row) => [row.communityId, Number(row.messageCount)])
  );
}

async function loadExistingSummaryCommunityIdsForRun(
  communityIds: string[],
  run: SummaryRunContext
): Promise<Set<string>> {
  if (communityIds.length === 0) {
    return new Set();
  }

  const db = getDatabase();
  const rows = await db
    .select({ communityId: summaries.communityId })
    .from(summaries)
    .where(
      and(
        inArray(summaries.communityId, communityIds),
        eq(summaries.triggerType, run.triggerType),
        eq(summaries.triggerKey, run.triggerKey)
      )
    );

  return new Set(rows.map((row) => row.communityId));
}

async function loadPendingRunSummaryDeliveries(
  run: SummaryRunContext
): Promise<PendingDeliveryRecord[]> {
  const db = getDatabase();
  const unsentSummaries = await db.query.summaries.findMany({
    columns: {
      communityId: true,
      id: true,
    },
    where: and(
      eq(summaries.triggerType, run.triggerType),
      eq(summaries.triggerKey, run.triggerKey),
      isNull(summaries.notificationSentAt)
    ),
    with: {
      community: {
        columns: {
          chatId: true,
          isActive: true,
          summaryNotificationsEnabled: true,
        },
      },
    },
  });

  return unsentSummaries.map((summary) => ({
    chatId: summary.community.chatId,
    communityId: summary.communityId,
    isActive: summary.community.isActive,
    summaryId: summary.id,
    summaryNotificationsEnabled: summary.community.summaryNotificationsEnabled,
  }));
}

function validateAuthHeader(request: Request): NextResponse | null {
  let expectedToken: string;
  try {
    expectedToken = serverEnv.cronSecret;
  } catch {
    console.error("CRON_SECRET environment variable is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expected = Buffer.from(`Bearer ${expectedToken}`);
  const provided = Buffer.from(authHeader);
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
