import { communities, communityMembers, messages } from "@loyal-labs/db-core/schema";
import { and, eq } from "drizzle-orm";
import type { Bot, Context } from "grammy";

import { getDatabase } from "@/lib/core/database";
import { getOrCreateUser } from "@/lib/telegram/user-service";
import { getTelegramDisplayName, isCommunityChat, isGroupChat } from "@/lib/telegram/utils";

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

export function evictActiveCommunityCache(
  chatId: bigint | number | string
): void {
  activeCommunities.delete(String(chatId));
}

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
  } catch (error) {
    console.error("Failed to handle community message", error);
  }
}
