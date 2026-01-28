import { and, asc, eq, gte } from "drizzle-orm";

import { getDatabase } from "@/lib/core/database";
import { messages, summaries, type Topic } from "@/lib/core/schema";
import { chatCompletion } from "@/lib/redpill";
import { SUMMARY_INTERVAL_MS } from "@/lib/telegram/utils";

export const MIN_MESSAGES_FOR_SUMMARY = 5;

export const SYSTEM_PROMPT = `You summarize group chat conversations into topics. Output JSON:
{"topics":[{"title":"Topic Name","content":"Summary paragraph","sources":["Name1","Name2"]}]}
Keep summaries concise. List 1-5 topics. Sources are participant names who contributed to each topic.`;

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

  await db.insert(summaries).values({
    communityId,
    chatTitle,
    messageCount: recentMessages.length,
    fromMessageId: recentMessages[0].telegramMessageId,
    toMessageId: recentMessages[recentMessages.length - 1].telegramMessageId,
    topics,
  });
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
