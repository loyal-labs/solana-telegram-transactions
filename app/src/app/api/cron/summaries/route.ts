import { communities, pushTokens } from "@loyal-labs/db-core/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/core/database";
import { sendExpoPushNotifications } from "@/lib/push-notifications/send";
import { getBot } from "@/lib/telegram/bot-api/bot";
import {
  generateOrGetSummaryForRun,
  type GenerateOrGetSummaryForRunResult,
  sendSummaryById,
  type SummaryRunContext,
} from "@/lib/telegram/bot-api/summaries";
import type {
  SendSummaryResult,
  SummaryDeliveredMessage,
} from "@/lib/telegram/bot-api/types";
import { SUMMARY_INTERVAL_MS } from "@/lib/telegram/utils";

import { validateCronAuthHeader } from "../_shared/auth";

export const runtime = "nodejs";
const SUMMARY_QUALITY_CONTROL_CHAT_ID = BigInt("-5173720920");

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
  forwardDeliveredSummary?: (
    summaryId: string,
    deliveredMessage: SummaryDeliveredMessage
  ) => Promise<void>;
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
  const authErrorResponse = validateCronAuthHeader(request);
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
  const getOrCreateBot = async () => {
    if (!botPromise) {
      botPromise = getBot();
    }

    return botPromise;
  };

  const result = await runDailyCommunitySummaries({
    activeCommunityCount: activeCommunities.length,
    communities: activeCommunities,
    deliverSummary: async (summaryId) => {
      return sendSummaryById(await getOrCreateBot(), summaryId);
    },
    forwardDeliveredSummary: async (summaryId, deliveredMessage) => {
      await forwardSummaryToQualityControl(
        await getOrCreateBot(),
        summaryId,
        deliveredMessage
      );
    },
    generateSummaryForRun: (communityId, chatTitle) =>
      generateOrGetSummaryForRun({
        chatTitle,
        communityId,
        run,
      }),
  });

  // Send push notifications to mobile app users
  try {
    const tokens = await db.select().from(pushTokens);
    if (tokens.length > 0) {
      const messages = tokens.map((t) => ({
        to: t.token,
        title: "New Chat Highlights",
        body: "Your daily summaries are ready",
        data: { screen: "summaries" },
        sound: "default" as const,
      }));
      await sendExpoPushNotifications(messages);
    }
  } catch (error) {
    console.error("[cron/summaries] Failed to send push notifications:", error);
  }

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

      if (options.forwardDeliveredSummary) {
        // Quality-control forwarding is intentionally non-blocking.
        try {
          await options.forwardDeliveredSummary(
            generationResult.summaryId,
            deliveryResult.deliveredMessage
          );
        } catch (error) {
          logQualityControlForwardFailure(
            generationResult.summaryId,
            deliveryResult.deliveredMessage,
            error
          );
        }
      }
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

async function forwardSummaryToQualityControl(
  bot: Awaited<ReturnType<typeof getBot>>,
  summaryId: string,
  deliveredMessage: SummaryDeliveredMessage
): Promise<void> {
  await bot.api.forwardMessage(
    Number(SUMMARY_QUALITY_CONTROL_CHAT_ID),
    Number(deliveredMessage.destinationChatId),
    deliveredMessage.messageId
  );

  console.log("[cron/summaries] Forwarded summary to quality control chat", {
    destinationChatId: String(deliveredMessage.destinationChatId),
    messageId: deliveredMessage.messageId,
    qualityControlChatId: String(SUMMARY_QUALITY_CONTROL_CHAT_ID),
    sourceCommunityChatId: String(deliveredMessage.sourceCommunityChatId),
    summaryId,
  });
}

function logQualityControlForwardFailure(
  summaryId: string,
  deliveredMessage: SummaryDeliveredMessage,
  error: unknown
): void {
  console.error("[cron/summaries] Failed to forward summary to quality control chat", {
    destinationChatId: String(deliveredMessage.destinationChatId),
    error: error instanceof Error ? error.message : String(error),
    messageId: deliveredMessage.messageId,
    qualityControlChatId: String(SUMMARY_QUALITY_CONTROL_CHAT_ID),
    sourceCommunityChatId: String(deliveredMessage.sourceCommunityChatId),
    summaryId,
  });
}
