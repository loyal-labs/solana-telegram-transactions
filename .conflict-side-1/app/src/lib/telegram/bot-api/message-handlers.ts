import { and, eq } from "drizzle-orm";
import type { Bot, Context } from "grammy";

import { getDatabase } from "@/lib/core/database";
import {
  communities,
  communityMembers,
  messages,
  summaries,
} from "@/lib/core/schema";
import { getOrCreateUser } from "@/lib/telegram/user-service";
import {
  getTelegramDisplayName,
  isCommunityChat,
  isGroupChat,
  SUMMARY_INTERVAL_MS,
} from "@/lib/telegram/utils";

import { getBot } from "./bot";
import { generateChatSummary, sendLatestSummary } from "./summaries";

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

function pickRandomReaction(): (typeof POSITIVE_REACTIONS)[number] {
  const index = Math.floor(Math.random() * POSITIVE_REACTIONS.length);
  return POSITIVE_REACTIONS[index];
}

export async function handleGLoyalReaction(ctx: Context, bot: Bot): Promise<void> {
  const text = ctx.message?.text;
  if (!text) return;
  if (!text.toLowerCase().includes(GLOYAL_TRIGGER)) return;

  const chatId = ctx.chat?.id;
  const messageId = ctx.message?.message_id;
  const chatType = ctx.chat?.type;
  if (!chatType || !isGroupChat(chatType)) return;
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
}

// Cache of active community IDs (chatId string -> communityUUID)
const activeCommunities = new Map<string, string>();
// Cache last summary timestamps (communityUUID -> ISO date string)
const lastSummaryTimestamps = new Map<string, string>();

export async function handleCommunityMessage(ctx: Context): Promise<void> {
  const chat = ctx.chat;
  if (!chat) return;
  if (!isCommunityChat(chat.type)) return;

  const chatId = BigInt(chat.id);
  const chatIdStr = String(chat.id);
  const message = ctx.message;
  if (!message?.text || !message.from) return;

  try {
    const db = getDatabase();

    // Check if community is active (use cache first)
    let communityId = activeCommunities.get(chatIdStr);
    if (!communityId) {
      const community = await db.query.communities.findFirst({
        where: and(
          eq(communities.chatId, chatId),
          eq(communities.isActive, true)
        ),
      });
      if (!community) return;
      communityId = community.id;
      activeCommunities.set(chatIdStr, communityId);
    }

    const telegramUserId = BigInt(message.from.id);
    const displayName = getTelegramDisplayName(message.from);

    // Get or create user
    const userId = await getOrCreateUser(telegramUserId, {
      username: message.from.username || null,
      displayName,
    });

    // Ensure community membership exists (use onConflictDoNothing for race condition safety)
    await db
      .insert(communityMembers)
      .values({
        communityId,
        userId,
      })
      .onConflictDoNothing();

    // Store message (use onConflictDoNothing for duplicate message handling)
    await db
      .insert(messages)
      .values({
        communityId,
        userId,
        telegramMessageId: BigInt(message.message_id),
        content: message.text,
      })
      .onConflictDoNothing();

    // Check if summary is needed
    const chatTitle =
      "title" in chat ? (chat.title as string) : `Chat ${chatIdStr}`;
    triggerSummaryIfNeeded(communityId, chatTitle, chatId);
  } catch (error) {
    console.error("Failed to handle community message", error);
  }
}

function triggerSummaryIfNeeded(
  communityId: string,
  chatTitle: string,
  chatId: bigint
) {
  const now = Date.now();

  // Check cache first
  const cachedTimestamp = lastSummaryTimestamps.get(communityId);
  if (cachedTimestamp) {
    const elapsed = now - new Date(cachedTimestamp).getTime();
    if (elapsed < SUMMARY_INTERVAL_MS) return;
  }

  // Check DB for last summary if not cached (async, fire-and-forget style)
  checkAndTriggerSummary(communityId, chatTitle, cachedTimestamp, chatId).catch(
    console.error
  );
}

async function checkAndTriggerSummary(
  communityId: string,
  chatTitle: string,
  cachedTimestamp: string | undefined,
  chatId: bigint
) {
  const now = Date.now();
  const db = getDatabase();

  // Check DB for last summary if not cached
  if (!cachedTimestamp) {
    const latestSummary = await db.query.summaries.findFirst({
      where: eq(summaries.communityId, communityId),
      orderBy: (summaries, { desc }) => [desc(summaries.createdAt)],
    });

    if (latestSummary) {
      const timestamp = latestSummary.createdAt.toISOString();
      lastSummaryTimestamps.set(communityId, timestamp);
      const elapsed = now - latestSummary.createdAt.getTime();
      if (elapsed < SUMMARY_INTERVAL_MS) return;
    }
  }

  // Generate summary and only update timestamp on success
  try {
    await generateChatSummary(communityId, chatTitle);
    lastSummaryTimestamps.set(communityId, new Date().toISOString());

    // Auto-post the summary to the chat
    try {
      const bot = await getBot();
      await sendLatestSummary(bot, chatId);
    } catch (postError) {
      console.error("Failed to auto-post summary", postError);
    }
  } catch (error) {
    console.error("Summary generation failed, will retry later", error);
    // Don't update timestamp on failure - allows retry on next message
  }
}
