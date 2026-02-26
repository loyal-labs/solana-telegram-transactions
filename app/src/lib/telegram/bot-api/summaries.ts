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
import type {
  SendLatestSummaryOptions,
  SendSummaryResult,
  SummaryDeliveredMessage,
} from "./types";

export const MIN_MESSAGES_FOR_SUMMARY = 3;
const MAX_SUMMARY_INPUT_CHARS = 12_000;
const MAX_SUMMARY_BULLET_COUNT = 5;
const MAX_SUMMARY_BULLET_CONTENT_CHARS = 450;
const MAX_SUMMARY_OG_TEXT_CHARS = 110;
const SUMMARY_BULLET_FALLBACK_CONTENT = "No detailed points available today.";
const SUMMARY_BULLET_CUSTOM_EMOJI_ID = "5255883309841422076";
const SUMMARY_BULLET_TAG = `<tg-emoji emoji-id="${SUMMARY_BULLET_CUSTOM_EMOJI_ID}">🔹</tg-emoji>`;

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

  const deliveredMessage = await sendSummaryToChat(
    bot,
    {
      createdAt: latestSummary.createdAt,
      id: latestSummary.id,
      oneliner: latestSummary.oneliner,
      topics: latestSummary.topics,
    },
    {
      destinationChatId,
      sourceCommunityChatId: sourceChatId,
      replyToMessageId,
    }
  );

  return { deliveredMessage, sent: true };
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

  const deliveredMessage = await sendSummaryToChat(
    bot,
    {
      createdAt: summary.createdAt,
      id: summary.id,
      oneliner: summary.oneliner,
      topics: summary.topics,
    },
    {
      destinationChatId: options?.destinationChatId ?? summary.community.chatId,
      sourceCommunityChatId: summary.community.chatId,
      replyToMessageId: options?.replyToMessageId,
    }
  );

  return { deliveredMessage, sent: true };
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
  summary: Pick<Summary, "createdAt" | "id" | "oneliner" | "topics">,
  options: {
    destinationChatId: bigint;
    sourceCommunityChatId: bigint;
    replyToMessageId?: number;
  }
): Promise<SummaryDeliveredMessage> {
  const { firstBulletContent, messageBody } = buildSummaryMessageBody(summary.topics);
  const ogText = buildSummaryOgText(summary.oneliner, firstBulletContent);

  const messageWithPreview = buildSummaryMessageWithPreview(
    messageBody,
    ogText,
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

  const sentMessage = await sendSummaryMessage(bot, {
    destinationChatId: options.destinationChatId,
    messageOptions,
    messageText: messageWithPreview,
    replyToMessageId: options.replyToMessageId,
  });

  return {
    destinationChatId: options.destinationChatId,
    messageId: sentMessage.message_id,
    sourceCommunityChatId: options.sourceCommunityChatId,
  };
}

function buildSummaryMessageBody(topics: Topic[]): {
  firstBulletContent: string;
  messageBody: string;
} {
  const normalizedBullets = topics
    .slice(0, MAX_SUMMARY_BULLET_COUNT)
    .map((topic) => {
      const firstSentence = extractFirstSentence(topic.content);
      if (firstSentence.length === 0) {
        return null;
      }

      return {
        content: truncateForBullet(firstSentence),
      };
    })
    .filter((bullet): bullet is { content: string } =>
      Boolean(bullet)
    );

  if (normalizedBullets.length === 0) {
    return {
      firstBulletContent: SUMMARY_BULLET_FALLBACK_CONTENT,
      messageBody: `${SUMMARY_BULLET_TAG} ${escapeTelegramHtml(
        SUMMARY_BULLET_FALLBACK_CONTENT
      )}`,
    };
  }

  const bulletLines = normalizedBullets.map(
    (bullet) => `${SUMMARY_BULLET_TAG} ${escapeTelegramHtml(bullet.content)}`
  );

  return {
    firstBulletContent: normalizedBullets[0].content,
    messageBody: bulletLines.join("\n\n"),
  };
}

function buildSummaryOgText(oneliner: string, firstBulletContent: string): string {
  const normalizedOneliner = normalizeWhitespace(oneliner);
  if (normalizedOneliner.length > 0) {
    return normalizedOneliner.slice(0, MAX_SUMMARY_OG_TEXT_CHARS);
  }

  return firstBulletContent.slice(0, MAX_SUMMARY_OG_TEXT_CHARS);
}

function truncateForBullet(content: string): string {
  if (content.length <= MAX_SUMMARY_BULLET_CONTENT_CHARS) {
    return content;
  }

  return `${content.slice(0, MAX_SUMMARY_BULLET_CONTENT_CHARS - 1).trimEnd()}…`;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractFirstSentence(text: string): string {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return "";
  }

  const match = normalized.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0] : normalized;
}

async function sendSummaryMessage(
  bot: Bot,
  params: {
    destinationChatId: bigint;
    messageOptions: {
      parse_mode: "HTML";
      link_preview_options: { prefer_large_media: boolean };
      reply_markup: ReturnType<typeof buildSummaryVoteKeyboard>;
    };
    messageText: string;
    replyToMessageId?: number;
  }
) {
  if (params.replyToMessageId) {
    try {
      return await bot.api.sendMessage(
        Number(params.destinationChatId),
        params.messageText,
        {
          ...params.messageOptions,
          reply_parameters: { message_id: params.replyToMessageId },
        }
      );
    } catch (error) {
      console.log("Failed to send summary as reply, sending without reply", error);
    }
  }

  return bot.api.sendMessage(
    Number(params.destinationChatId),
    params.messageText,
    params.messageOptions
  );
}

function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
