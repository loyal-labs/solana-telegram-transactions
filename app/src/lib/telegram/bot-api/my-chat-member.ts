import type { Context } from "grammy";

import { getDatabase } from "@/lib/core/database";
import { communities } from "@/lib/core/schema";
import { isCommunityChat } from "@/lib/telegram/utils";

import { evictActiveCommunityCache } from "./message-handlers";

const ONBOARDING_MESSAGE =
  "Thanks for adding me. Run /activate_community to enable summaries for this community.\nAfter activation, summaries are available in this chat and in the app.\nUse /notifications to set notification cycles.\nUse /hide or /unhide to control public visibility.";

function isFreshJoinTransition(oldStatus: string, newStatus: string): boolean {
  const joinedFrom = oldStatus === "left" || oldStatus === "kicked";
  const joinedTo = newStatus === "member" || newStatus === "administrator";
  return joinedFrom && joinedTo;
}

function isSupportedCommunityChat(chatType: string): boolean {
  return isCommunityChat(chatType);
}

export async function handleMyChatMemberUpdate(ctx: Context): Promise<void> {
  const myChatMemberUpdate = ctx.update.my_chat_member;
  if (!myChatMemberUpdate) {
    return;
  }

  if (!isSupportedCommunityChat(myChatMemberUpdate.chat.type)) {
    return;
  }

  const oldStatus = myChatMemberUpdate.old_chat_member.status;
  const newStatus = myChatMemberUpdate.new_chat_member.status;
  if (!isFreshJoinTransition(oldStatus, newStatus)) {
    return;
  }

  const chatId = BigInt(myChatMemberUpdate.chat.id);
  const chatTitle = myChatMemberUpdate.chat.title || "Untitled";
  const activatedBy = BigInt(myChatMemberUpdate.from.id);
  const upsertTimestamp = new Date();
  let isCommunityUpserted = false;

  try {
    const db = getDatabase();
    await db
      .insert(communities)
      .values({
        activatedBy,
        chatId,
        chatTitle,
        isActive: false,
        isPublic: false,
        updatedAt: upsertTimestamp,
      })
      .onConflictDoUpdate({
        target: communities.chatId,
        set: {
          chatTitle,
          isActive: false,
          isPublic: false,
          updatedAt: upsertTimestamp,
        },
      });
    isCommunityUpserted = true;
  } catch (error) {
    console.error("Failed to upsert community from my_chat_member update", error);
  } finally {
    evictActiveCommunityCache(chatId);
  }

  if (!isCommunityUpserted) {
    return;
  }

  try {
    await ctx.api.sendMessage(myChatMemberUpdate.chat.id, ONBOARDING_MESSAGE);
  } catch (error) {
    console.error(
      "Failed to send onboarding message for my_chat_member update",
      error
    );
  }
}
