import { and, asc, desc, eq, gte } from "drizzle-orm";
import { type Bot,InlineKeyboard } from "grammy";

import { getDatabase } from "@/lib/core/database";
import {
  communities,
  messages,
  summaries,
  type Topic,
} from "@/lib/core/schema";
import { chatCompletion } from "@/lib/redpill";
import { SUMMARY_INTERVAL_MS } from "@/lib/telegram/utils";

import { buildSummaryMessageWithPreview } from "./build-summary-og-url";
import { MINI_APP_LINK } from "./constants";

export const MIN_MESSAGES_FOR_SUMMARY = 5;

export const SYSTEM_PROMPT = `You summarize group chat conversations into topics. Output JSON:
{"topics":[{"title":"Topic Name","content":"Summary paragraph","sources":["Name1","Name2"]}]}
Keep summaries concise. List 1-5 topics. Sources are participant names who contributed to each topic.`;

export const ONELINER_PROMPT = `Given these discussion topics from a group chat, write a single catchy sentence (max 110 characters) that captures the essence of the day's conversation. Output only the sentence, no quotes or formatting.`;

export async function generateChatSummary(
  communityId: string,
  chatTitle: string
): Promise<void> {
  const db = getDatabase();
  const oneDayAgo = new Date(Date.now() - SUMMARY_INTERVAL_MS);

  const recentMessages = await db.query.messages.findMany({
    where: and(
      eq(messages.communityId, communityId),
      gte(messages.createdAt, oneDayAgo)
    ),
    with: { user: true },
    orderBy: [asc(messages.telegramMessageId)],
  });

  if (recentMessages.length < MIN_MESSAGES_FOR_SUMMARY) return;

  const formattedMessages = recentMessages
    .map((m) => `${m.user.displayName}: ${m.content}`)
    .join("\n");

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

  await db.insert(summaries).values({
    communityId,
    chatTitle,
    messageCount: recentMessages.length,
    fromMessageId: recentMessages[0].telegramMessageId,
    toMessageId: recentMessages[recentMessages.length - 1].telegramMessageId,
    topics,
    oneliner,
  });
}

export async function generateOneliner(topics: Topic[]): Promise<string> {
  const topicsSummary = topics
    .map((t) => `${t.title}: ${t.content}`)
    .join("\n");

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

export type SendSummaryResult =
  | { sent: true }
  | { sent: false; reason: "not_activated" | "no_summaries" };

export async function sendLatestSummary(
  bot: Bot,
  chatId: bigint,
  replyToMessageId?: number
): Promise<SendSummaryResult> {
  const db = getDatabase();

  const community = await db.query.communities.findFirst({
    where: and(eq(communities.chatId, chatId), eq(communities.isActive, true)),
  });

  if (!community) {
    return { sent: false, reason: "not_activated" };
  }

  const latestSummary = await db.query.summaries.findFirst({
    where: eq(summaries.communityId, community.id),
    orderBy: [desc(summaries.createdAt)],
  });

  if (!latestSummary) {
    return { sent: false, reason: "no_summaries" };
  }

  const safeOneliner = escapeTelegramHtml(latestSummary.oneliner);
  const messageBody = `Summary: ${safeOneliner}`;

  const messageWithPreview = buildSummaryMessageWithPreview(
    messageBody,
    latestSummary.oneliner,
    latestSummary.createdAt
  );

  const keyboard = new InlineKeyboard().url("Read in full", MINI_APP_LINK);

  const messageOptions = {
    parse_mode: "HTML" as const,
    link_preview_options: { prefer_large_media: true },
    reply_markup: keyboard,
  };

  if (replyToMessageId) {
    try {
      await bot.api.sendMessage(Number(chatId), messageWithPreview, {
        ...messageOptions,
        reply_parameters: { message_id: replyToMessageId },
      });
      return { sent: true };
    } catch (error) {
      console.log("Failed to send summary as reply, sending without reply", error);
    }
  }

  await bot.api.sendMessage(Number(chatId), messageWithPreview, messageOptions);
  return { sent: true };
}

function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
