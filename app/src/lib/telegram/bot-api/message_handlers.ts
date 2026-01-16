import { randomUUID } from "node:crypto";

import type { Bot, Context } from "grammy";

import { getReadyBuilderClient } from "@/lib/nillion/core/builder";
import { COMMUNITY_CHAT_MESSAGES_COLLECTION_ID } from "@/lib/nillion/schemas/community-chat-messages-schema";
import { COMMUNITY_CHAT_SUMMARIES_COLLECTION_ID } from "@/lib/nillion/schemas/community-chat-summaries-schema";
import { COMMUNITY_CHATS_COLLECTION_ID } from "@/lib/nillion/schemas/community-chats-schema";
import { USERS_COLLECTION_ID } from "@/lib/nillion/schemas/users-schema";

import { generateChatSummary } from "./summaries";

const POSITIVE_REACTIONS = [
  "❤",
  "🔥",
  "🎉",
  "🤩",
  "🙏",
  "😍",
  "❤‍🔥",
  "💯",
  "⚡",
] as const;

const GLOYAL_TRIGGER = "gloyal";

const pickRandomReaction = () => {
  const index = Math.floor(Math.random() * POSITIVE_REACTIONS.length);
  return POSITIVE_REACTIONS[index];
};

export const handleGLoyalReaction = async (ctx: Context, bot: Bot) => {
  const text = ctx.message?.text;
  if (!text) return;
  if (!text.toLowerCase().includes(GLOYAL_TRIGGER)) return;

  const chatId = ctx.chat?.id;
  const messageId = ctx.message?.message_id;
  const chatType = ctx.chat?.type;
  if (chatType !== "group" && chatType !== "supergroup") return;
  if (!chatId || !messageId) {
    console.error("Chat ID or message ID not found for gLoyal reaction");
    return;
  }

  const emoji = pickRandomReaction();
  await bot.api.setMessageReaction(chatId, messageId, [
    {
      type: "emoji",
      emoji,
    },
  ]);
};

// Cache of active chat IDs and known users to avoid repeated DB queries
const activeChatIds = new Set<string>();
const knownUserIds = new Set<string>();

// Cache last summary timestamps (chatId -> ISO date string)
const lastSummaryTimestamps = new Map<string, string>();
const SUMMARY_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const handleCommunityMessage = async (ctx: Context) => {
  const chat = ctx.chat;
  if (!chat) return;
  if (chat.type !== "group" && chat.type !== "supergroup") return;

  const chatId = String(chat.id);
  const message = ctx.message;
  if (!message?.text || !message.from) return;

  const builderClient = await getReadyBuilderClient();

  // Check if chat is active (use cache first)
  if (!activeChatIds.has(chatId)) {
    const result = await builderClient.findData({
      collection: COMMUNITY_CHATS_COLLECTION_ID,
      filter: { chat_id: chatId },
    });
    if (!result?.data?.length) return;
    activeChatIds.add(chatId);
  }

  const now = new Date().toISOString();
  const senderId = String(message.from.id);
  const senderName =
    message.from.first_name +
    (message.from.last_name ? ` ${message.from.last_name}` : "");

  // Store message
  await builderClient.createStandardData({
    collection: COMMUNITY_CHAT_MESSAGES_COLLECTION_ID,
    data: [
      {
        _id: randomUUID(),
        chat_id: chatId,
        message_id: message.message_id,
        sender_id: senderId,
        sender_name: senderName,
        content: message.text,
        created_at: now,
      },
    ],
  });

  // Store user if not already known (check cache, then DB)
  if (!knownUserIds.has(senderId)) {
    const userResult = await builderClient.findData({
      collection: USERS_COLLECTION_ID,
      filter: { telegram_id: senderId },
    });
    if (!userResult?.data?.length) {
      await builderClient.createStandardData({
        collection: USERS_COLLECTION_ID,
        data: [
          {
            _id: randomUUID(),
            telegram_id: senderId,
            username: message.from.username || "",
            display_name: senderName,
            settings: {},
            created_at: now,
            updated_at: now,
          },
        ],
      });
    }
    knownUserIds.add(senderId);
  }

  // Check if summary is needed
  const chatTitle =
    "title" in chat ? (chat.title as string) : `Chat ${chatId}`;
  checkAndTriggerSummary(chatId, chatTitle);
};

async function checkAndTriggerSummary(chatId: string, chatTitle: string) {
  const now = Date.now();

  // Check cache first
  const cachedTimestamp = lastSummaryTimestamps.get(chatId);
  if (cachedTimestamp) {
    const elapsed = now - new Date(cachedTimestamp).getTime();
    if (elapsed < SUMMARY_INTERVAL_MS) return;
  }

  const builderClient = await getReadyBuilderClient();

  // Check DB for last summary if not cached
  if (!cachedTimestamp) {
    const result = await builderClient.findData({
      collection: COMMUNITY_CHAT_SUMMARIES_COLLECTION_ID,
      filter: { chat_id: chatId },
    });
    if (result?.data?.length) {
      type SummaryRecord = { created_at: string };
      const data = result.data as SummaryRecord[];
      const latest = data.reduce((a, b) =>
        new Date(a.created_at) > new Date(b.created_at) ? a : b
      );
      lastSummaryTimestamps.set(chatId, latest.created_at);
      const elapsed = now - new Date(latest.created_at).getTime();
      if (elapsed < SUMMARY_INTERVAL_MS) return;
    }
  }

  // Generate summary (fire and forget - don't block message handling)
  generateChatSummary(chatId, chatTitle).catch(console.error);
  lastSummaryTimestamps.set(chatId, new Date().toISOString());
}
