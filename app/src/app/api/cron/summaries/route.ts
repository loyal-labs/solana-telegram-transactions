import { timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/core/config/server";
import { getDatabase } from "@/lib/core/database";
import { communities } from "@/lib/core/schema";
import { getBot } from "@/lib/telegram/bot-api/bot";
import {
  generateOrGetSummaryForRun,
  type GenerateOrGetSummaryForRunResult,
  sendSummaryById,
  type SummaryRunContext,
} from "@/lib/telegram/bot-api/summaries";
import type { SendSummaryResult } from "@/lib/telegram/bot-api/types";
import { SUMMARY_INTERVAL_MS } from "@/lib/telegram/utils";

export const runtime = "nodejs";

type ActiveCommunityRecord = {
  id: string;
  chatId: bigint;
  chatTitle: string;
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
  deliveryAttempted: number;
  deliveryFailed: number;
  deliverySucceeded: number;
  errors: number;
  existingToday: number;
  generated: number;
  processed: number;
  skippedByMasterSwitch: number;
  skippedNotEnoughMessages: number;
};

type RunDailyCommunitySummariesOptions = {
  activeCommunityCount: number;
  communities: ActiveCommunityRecord[];
  deliverSummary: (summaryId: string) => Promise<SendSummaryResult>;
  generateSummaryForRun: (
    communityId: string,
    chatTitle: string
  ) => Promise<GenerateOrGetSummaryForRunResult>;
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

  let botPromise: Promise<Awaited<ReturnType<typeof getBot>>> | null = null;
  const result = await runDailyCommunitySummaries({
    activeCommunityCount: activeCommunities.length,
    communities: activeCommunities,
    deliverSummary: async (summaryId) => {
      if (!botPromise) {
        botPromise = getBot();
      }

      return sendSummaryById(await botPromise, summaryId);
    },
    generateSummaryForRun: (communityId, chatTitle) =>
      generateOrGetSummaryForRun({
        chatTitle,
        communityId,
        run,
      }),
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

export function buildDailySummaryRunContext(date: Date = new Date()): SummaryRunContext {
  const dayStartUtc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dayEndUtc = new Date(dayStartUtc.getTime() + 24 * 60 * 60 * 1000 - 1);

  return {
    dayEndUtc,
    dayStartUtc,
    windowEnd: date,
    windowStart: new Date(date.getTime() - SUMMARY_INTERVAL_MS),
  };
}

export async function runDailyCommunitySummaries(
  options: RunDailyCommunitySummariesOptions
): Promise<RunDailyCommunitySummariesResult> {
  const stats: SummaryCronStats = {
    activeCommunities: options.activeCommunityCount,
    deliveryAttempted: 0,
    deliveryFailed: 0,
    deliverySucceeded: 0,
    errors: 0,
    existingToday: 0,
    generated: 0,
    skippedByMasterSwitch: 0,
    processed: 0,
    skippedNotEnoughMessages: 0,
  };
  const errors: CommunityProcessingError[] = [];

  for (const community of options.communities) {
    stats.processed += 1;

    let generationResult: GenerateOrGetSummaryForRunResult;
    try {
      generationResult = await options.generateSummaryForRun(
        community.id,
        community.chatTitle
      );
    } catch (error) {
      stats.errors += 1;
      errors.push({
        chatId: String(community.chatId),
        communityId: community.id,
        error: error instanceof Error ? error.message : String(error),
        scope: "generation",
      });
      continue;
    }

    if (generationResult.status === "not_enough_messages") {
      stats.skippedNotEnoughMessages += 1;
      continue;
    }

    if (generationResult.status === "created") {
      stats.generated += 1;
    }

    if (generationResult.status === "existing") {
      stats.existingToday += 1;
    }

    if (!community.summaryNotificationsEnabled) {
      stats.skippedByMasterSwitch += 1;
      continue;
    }

    stats.deliveryAttempted += 1;
    try {
      const deliveryResult = await options.deliverSummary(generationResult.summaryId);
      if (!deliveryResult.sent) {
        stats.deliveryFailed += 1;
        stats.errors += 1;
        errors.push({
          chatId: String(community.chatId),
          communityId: community.id,
          error: `Summary delivery rejected: ${deliveryResult.reason}`,
          scope: "delivery",
          summaryId: generationResult.summaryId,
        });
        continue;
      }

      stats.deliverySucceeded += 1;
    } catch (error) {
      stats.deliveryFailed += 1;
      stats.errors += 1;
      errors.push({
        chatId: String(community.chatId),
        communityId: community.id,
        error: error instanceof Error ? error.message : String(error),
        scope: "delivery",
        summaryId: generationResult.summaryId,
      });
    }
  }

  return { errors, stats };
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
