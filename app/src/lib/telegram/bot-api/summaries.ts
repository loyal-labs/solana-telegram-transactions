import {
  and,
  asc,
  desc,
  eq,
  gte,
  lte,
  sql,
} from "drizzle-orm";
import { type Bot } from "grammy";

import { getDatabase } from "@/lib/core/database";
import {
  communities,
  messages,
  summaries,
  type Summary,
  type Topic,
} from "@/lib/core/schema";
import { chatCompletion } from "@/lib/redpill";

import { buildSummaryMessageWithPreview } from "./build-summary-og-url";
import { buildSummaryVoteKeyboard, getSummaryVoteTotals } from "./summary-votes";
import type { SendLatestSummaryOptions, SendSummaryResult } from "./types";

export const MIN_MESSAGES_FOR_SUMMARY = 3;
const MAX_SUMMARY_INPUT_CHARS = 12_000;

export const SYSTEM_PROMPT = `You summarize group chat conversations into topics. Output JSON:
{"topics":[{"title":"Topic Name","content":"Summary paragraph","sources":["Name1","Name2"]}]}
Keep summaries concise. List 1-5 topics. Sources are participant names who contributed to each topic.`;

export const ONELINER_PROMPT = `Given these discussion topics from a group chat, write a single catchy sentence (max 110 characters) that captures the essence of daily conversation. Output only the sentence, no quotes or formatting.`;

export type SummaryRunContext = {
  dayEndUtc: Date;
  dayStartUtc: Date;
  windowEnd: Date;
  windowStart: Date;
};

export type GenerateOrGetSummaryForRunResult =
  | { status: "created"; summaryId: string; messageCount: number }
  | { status: "existing"; summaryId: string; messageCount: number }
  | { status: "not_enough_messages"; messageCount: number };

type SummaryWithCommunity = Summary & {
  community: {
    chatId: bigint;
    isActive: boolean;
    summaryNotificationsEnabled: boolean;
  };
};

export async function generateOrGetSummaryForRun(input: {
  chatTitle: string;
  communityId: string;
  run: SummaryRunContext;
}): Promise<GenerateOrGetSummaryForRunResult> {
  const db = getDatabase();
  const messageCount = await countMessagesInWindow(input.communityId, input.run);

  if (messageCount < MIN_MESSAGES_FOR_SUMMARY) {
    return { status: "not_enough_messages", messageCount };
  }

  const existingSummary = await findTodaySummary(
    input.communityId,
    input.run.dayStartUtc,
    input.run.dayEndUtc
  );
  if (existingSummary) {
    return {
      status: "existing",
      summaryId: existingSummary.id,
      messageCount: existingSummary.messageCount,
    };
  }

  const recentMessages = await db.query.messages.findMany({
    where: and(
      eq(messages.communityId, input.communityId),
      gte(messages.createdAt, input.run.windowStart),
      lte(messages.createdAt, input.run.windowEnd)
    ),
    with: { user: true },
    orderBy: [asc(messages.telegramMessageId)],
  });

  if (recentMessages.length < MIN_MESSAGES_FOR_SUMMARY) {
    return { status: "not_enough_messages", messageCount: recentMessages.length };
  }

  const formattedMessages = buildSummaryInput(recentMessages);
  if (!formattedMessages) {
    return { status: "not_enough_messages", messageCount: recentMessages.length };
  }

  const response = await chatCompletion({
    model: "phala/gpt-oss-120b",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Summarize this chat:\n\n${formattedMessages}` },
    ],
    temperature: 0.3,
  });

  const summaryText = response.choices?.[0]?.message?.content;
  if (!summaryText) {
    throw new Error("Empty response from LLM");
  }

  const topics = parseAndValidateTopics(summaryText);
  const oneliner = await generateOneliner(topics);

  const insertedSummary = await db
    .insert(summaries)
    .values({
      communityId: input.communityId,
      chatTitle: input.chatTitle,
      fromMessageId: recentMessages[0].telegramMessageId,
      toMessageId: recentMessages[recentMessages.length - 1].telegramMessageId,
      messageCount,
      oneliner,
      topics,
    })
    .returning({ id: summaries.id, messageCount: summaries.messageCount });

  if (insertedSummary.length === 0) {
    throw new Error("Failed to create summary");
  }

  return {
    status: "created",
    summaryId: insertedSummary[0].id,
    messageCount: insertedSummary[0].messageCount,
  };
}

export async function generateOneliner(topics: Topic[]): Promise<string> {
  const topicsSummary = topics.map((t) => `${t.title}: ${t.content}`).join("\n");

  const response = await chatCompletion({
    model: "phala/gpt-oss-120b",
    messages: [
      { role: "system", content: ONELINER_PROMPT },
      { role: "user", content: topicsSummary },
    ],
    temperature: 0.5,
  });

  const oneliner = response.choices?.[0]?.message?.content?.trim() ?? "";
  return oneliner.slice(0, 110);
}

export function parseAndValidateTopics(summaryText: string): Topic[] {
  let parsed: { topics: unknown };
  try {
    parsed = JSON.parse(summaryText);
  } catch {
    throw new Error(`Invalid JSON from LLM: ${summaryText.slice(0, 100)}...`);
  }

  if (!parsed.topics || !Array.isArray(parsed.topics)) {
    throw new Error("Invalid summary format: missing topics array");
  }

  for (const topic of parsed.topics) {
    if (!isValidTopic(topic)) {
      throw new Error("Invalid topic structure in summary");
    }
  }

  return parsed.topics as Topic[];
}

function isValidTopic(topic: unknown): topic is Topic {
  if (typeof topic !== "object" || topic === null) return false;
  const t = topic as Record<string, unknown>;
  return (
    typeof t.title === "string" &&
    typeof t.content === "string" &&
    Array.isArray(t.sources)
  );
}

export async function sendLatestSummary(
  bot: Bot,
  sourceChatId: bigint,
  options?: SendLatestSummaryOptions
): Promise<SendSummaryResult> {
  const db = getDatabase();
  const destinationChatId = options?.destinationChatId ?? sourceChatId;
  const replyToMessageId = options?.replyToMessageId;

  const community = await db.query.communities.findFirst({
    where: and(
      eq(communities.chatId, sourceChatId),
      eq(communities.isActive, true)
    ),
  });

  if (!community) {
    return { sent: false, reason: "not_activated" };
  }

  if (!community.summaryNotificationsEnabled) {
    return { sent: false, reason: "notifications_disabled" };
  }

  const latestSummary = await db.query.summaries.findFirst({
    where: eq(summaries.communityId, community.id),
    orderBy: [desc(summaries.createdAt)],
  });

  if (!latestSummary) {
    return { sent: false, reason: "no_summaries" };
  }

  await sendSummaryToChat(
    bot,
    {
      createdAt: latestSummary.createdAt,
      id: latestSummary.id,
      oneliner: latestSummary.oneliner,
    },
    {
      destinationChatId,
      sourceCommunityChatId: sourceChatId,
      replyToMessageId,
    }
  );

  return { sent: true };
}

export async function sendSummaryById(
  bot: Bot,
  summaryId: string,
  options?: SendLatestSummaryOptions
): Promise<SendSummaryResult> {
  const summary = await getSummaryWithCommunity(summaryId);
  if (!summary) {
    return { sent: false, reason: "no_summaries" };
  }

  if (!summary.community.isActive) {
    return { sent: false, reason: "not_activated" };
  }

  if (!summary.community.summaryNotificationsEnabled) {
    return { sent: false, reason: "notifications_disabled" };
  }

  await sendSummaryToChat(
    bot,
    {
      createdAt: summary.createdAt,
      id: summary.id,
      oneliner: summary.oneliner,
    },
    {
      destinationChatId: options?.destinationChatId ?? summary.community.chatId,
      sourceCommunityChatId: summary.community.chatId,
      replyToMessageId: options?.replyToMessageId,
    }
  );

  return { sent: true };
}

async function countMessagesInWindow(
  communityId: string,
  run: SummaryRunContext
): Promise<number> {
  const db = getDatabase();
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        eq(messages.communityId, communityId),
        gte(messages.createdAt, run.windowStart),
        lte(messages.createdAt, run.windowEnd)
      )
    );

  return Number(result?.count ?? 0);
}

async function findTodaySummary(
  communityId: string,
  dayStartUtc: Date,
  dayEndUtc: Date
): Promise<Summary | null> {
  const db = getDatabase();
  return (
    (await db.query.summaries.findFirst({
      where: and(
        eq(summaries.communityId, communityId),
        gte(summaries.createdAt, dayStartUtc),
        lte(summaries.createdAt, dayEndUtc)
      ),
      orderBy: [desc(summaries.createdAt)],
    })) ?? null
  );
}

async function getSummaryWithCommunity(
  summaryId: string
): Promise<SummaryWithCommunity | null> {
  const db = getDatabase();
  return (
    (await db.query.summaries.findFirst({
      where: eq(summaries.id, summaryId),
      with: {
        community: {
          columns: {
            chatId: true,
            isActive: true,
            summaryNotificationsEnabled: true,
          },
        },
      },
    })) ?? null
  );
}

function buildSummaryInput(
  recentMessages: Array<{ content: string; user: { displayName: string } }>
): string {
  let output = "";

  for (const message of recentMessages) {
    const line = `${message.user.displayName}: ${message.content}`;
    const nextLength = output.length === 0 ? line.length : output.length + 1 + line.length;

    if (nextLength > MAX_SUMMARY_INPUT_CHARS) {
      if (!output) {
        return line.slice(0, MAX_SUMMARY_INPUT_CHARS);
      }
      break;
    }

    output = output.length === 0 ? line : `${output}\n${line}`;
  }

  return output;
}

async function sendSummaryToChat(
  bot: Bot,
  summary: Pick<Summary, "createdAt" | "id" | "oneliner">,
  options: {
    destinationChatId: bigint;
    sourceCommunityChatId: bigint;
    replyToMessageId?: number;
  }
): Promise<void> {
  const safeOneliner = escapeTelegramHtml(summary.oneliner);
  const messageBody = `Summary: ${safeOneliner}`;

  const messageWithPreview = buildSummaryMessageWithPreview(
    messageBody,
    summary.oneliner,
    summary.createdAt
  );

  const voteTotals = await getSummaryVoteTotals(summary.id);
  const keyboard = buildSummaryVoteKeyboard(
    options.sourceCommunityChatId,
    summary.id,
    voteTotals.likes,
    voteTotals.dislikes
  );

  const messageOptions = {
    parse_mode: "HTML" as const,
    link_preview_options: { prefer_large_media: true },
    reply_markup: keyboard,
  };

  if (options.replyToMessageId) {
    try {
      await bot.api.sendMessage(Number(options.destinationChatId), messageWithPreview, {
        ...messageOptions,
        reply_parameters: { message_id: options.replyToMessageId },
      });
      return;
    } catch (error) {
      console.log("Failed to send summary as reply, sending without reply", error);
    }
  }

  await bot.api.sendMessage(
    Number(options.destinationChatId),
    messageWithPreview,
    messageOptions
  );
}

function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
