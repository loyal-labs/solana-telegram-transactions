import { randomUUID } from "node:crypto";

import { getReadyBuilderClient } from "@/lib/nillion/core/builder";
import { COMMUNITY_CHAT_MESSAGES_COLLECTION_ID } from "@/lib/nillion/schemas/community-chat-messages-schema";
import { COMMUNITY_CHAT_SUMMARIES_COLLECTION_ID } from "@/lib/nillion/schemas/community-chat-summaries-schema";
import { chatCompletion } from "@/lib/redpill";

export async function generateChatSummary(chatId: string, chatTitle: string) {
  const builderClient = await getReadyBuilderClient();

  // Get messages from last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = await builderClient.findData({
    collection: COMMUNITY_CHAT_MESSAGES_COLLECTION_ID,
    filter: { chat_id: chatId },
  });

  type MessageRecord = {
    created_at: string;
    message_id: number;
    sender_name: string;
    content: string;
  };

  const messages = ((result?.data || []) as MessageRecord[])
    .filter((m) => m.created_at >= oneDayAgo)
    .sort((a, b) => a.message_id - b.message_id);

  if (messages.length < 5) return; // Not enough to summarize

  // Format messages for LLM
  const formattedMessages = messages
    .map((m) => `${m.sender_name}: ${m.content}`)
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

  const summaryText = response.choices[0].message.content;
  const parsed = JSON.parse(summaryText);

  // Store summary
  await builderClient.createStandardData({
    collection: COMMUNITY_CHAT_SUMMARIES_COLLECTION_ID,
    data: [
      {
        _id: randomUUID(),
        chat_id: chatId,
        chat_title: chatTitle,
        message_count: messages.length,
        from_message_id: messages[0].message_id,
        to_message_id: messages[messages.length - 1].message_id,
        topics: parsed.topics,
        created_at: new Date().toISOString(),
      },
    ],
  });
}
