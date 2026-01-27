import { and, asc, eq, gte } from "drizzle-orm";

import { getDatabase } from "@/lib/core/database";
import { messages, summaries, type Topic } from "@/lib/core/schema";
import { chatCompletion } from "@/lib/redpill";
import { SUMMARY_INTERVAL_MS } from "@/lib/telegram/utils";

export async function generateChatSummary(
  communityId: string,
  chatTitle: string
) {
  const db = getDatabase();

  // Get messages from last 24h
  const oneDayAgo = new Date(Date.now() - SUMMARY_INTERVAL_MS);

  const recentMessages = await db.query.messages.findMany({
    where: and(
      eq(messages.communityId, communityId),
      gte(messages.createdAt, oneDayAgo)
    ),
    with: {
      user: true,
    },
    orderBy: [asc(messages.telegramMessageId)],
  });

  if (recentMessages.length < 5) return; // Not enough to summarize

  // Format messages for LLM
  const formattedMessages = recentMessages
    .map((m) => `${m.user.displayName}: ${m.content}`)
    .join("\n");

  // Generate summary via RedPill
  const response = await chatCompletion({
    model: "phala/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content: `You summarize group chat conversations into topics. Output JSON:
{"topics":[{"title":"Topic Name","content":"Summary paragraph","sources":["Name1","Name2"]}]}
Keep summaries concise. List 1-5 topics. Sources are participant names who contributed to each topic.`,
      },
      {
        role: "user",
        content: `Summarize this chat:\n\n${formattedMessages}`,
      },
    ],
    temperature: 0.3,
  });

  // Safely extract and parse LLM response
  const summaryText = response.choices?.[0]?.message?.content;
  if (!summaryText) {
    throw new Error("Empty response from LLM");
  }

  let parsed: { topics: Topic[] };
  try {
    parsed = JSON.parse(summaryText);
  } catch {
    throw new Error(`Invalid JSON from LLM: ${summaryText.slice(0, 100)}...`);
  }

  if (!parsed.topics || !Array.isArray(parsed.topics)) {
    throw new Error("Invalid summary format: missing topics array");
  }

  // Validate topic structure
  for (const topic of parsed.topics) {
    if (!topic.title || !topic.content || !Array.isArray(topic.sources)) {
      throw new Error("Invalid topic structure in summary");
    }
  }

  // Store summary
  await db.insert(summaries).values({
    communityId,
    chatTitle,
    messageCount: recentMessages.length,
    fromMessageId: recentMessages[0].telegramMessageId,
    toMessageId: recentMessages[recentMessages.length - 1].telegramMessageId,
    topics: parsed.topics,
  });
}
