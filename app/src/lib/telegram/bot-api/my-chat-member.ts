import { eq } from "drizzle-orm";
import type { Context } from "grammy";

import { getDatabase } from "@/lib/core/database";
import { communities } from "@/lib/core/schema";
import { isCommunityChat } from "@/lib/telegram/utils";

import { createBotTrackingProperties, trackBotEvent } from "./analytics";
import { evictActiveCommunityCache } from "./message-handlers";

const ONBOARDING_MESSAGE =
  "Thanks for adding me. Run /activate_community to enable summaries for this community.\nAfter activation, summaries are available in this chat and in the app.\nUse /notifications to set notification cycles.\nUse /hide or /unhide to control public visibility.";
const BOT_ADDED_TO_GROUP_EVENT = "Bot Added to Group";
const BOT_REMOVED_FROM_GROUP_EVENT = "Bot Removed from Group";

function isFreshJoinTransition(oldStatus: string, newStatus: string): boolean {
  const joinedFrom = oldStatus === "left" || oldStatus === "kicked";
  const joinedTo = newStatus === "member" || newStatus === "administrator";
  return joinedFrom && joinedTo;
}

function isRemovalTransition(oldStatus: string, newStatus: string): boolean {
  const removedTo = newStatus === "left" || newStatus === "kicked";
  const removedFrom =
    oldStatus === "member" ||
    oldStatus === "administrator" ||
    oldStatus === "creator" ||
    oldStatus === "restricted";
  return removedFrom && removedTo;
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
  const isJoinTransition = isFreshJoinTransition(oldStatus, newStatus);
  const isRemovedTransition = isRemovalTransition(oldStatus, newStatus);

  if (!isJoinTransition && !isRemovedTransition) {
    return;
  }

  const chatId = BigInt(myChatMemberUpdate.chat.id);
  const chatTitle = myChatMemberUpdate.chat.title || "Untitled";
  const activatedBy = BigInt(myChatMemberUpdate.from.id);
  const upsertTimestamp = new Date();
  const deactivatedCommunityState = {
    chatTitle,
    isActive: false,
    isPublic: false,
    updatedAt: upsertTimestamp,
  };
  let isDatabaseOperationSuccessful = false;

  try {
    const db = getDatabase();
    if (isJoinTransition) {
      await db
        .insert(communities)
        .values({
          activatedBy,
          chatId,
          ...deactivatedCommunityState,
        })
        .onConflictDoUpdate({
          target: communities.chatId,
          set: deactivatedCommunityState,
        });
      isDatabaseOperationSuccessful = true;
    } else if (isRemovedTransition) {
      await db
        .update(communities)
        .set(deactivatedCommunityState)
        .where(eq(communities.chatId, chatId));
      isDatabaseOperationSuccessful = true;
    }
  } catch (error) {
    console.error(
      "Failed to update community state from my_chat_member update",
      error
    );
  } finally {
    evictActiveCommunityCache(chatId);
  }

  if (!isDatabaseOperationSuccessful) {
    return;
  }

  const eventName = isJoinTransition
    ? BOT_ADDED_TO_GROUP_EVENT
    : BOT_REMOVED_FROM_GROUP_EVENT;
  trackBotEvent(
    eventName,
    createBotTrackingProperties({
      chatId: myChatMemberUpdate.chat.id,
      chatType: myChatMemberUpdate.chat.type,
      userId: myChatMemberUpdate.from.id,
    })
  );

  if (!isJoinTransition) {
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
