import type { CommandContext, Context, InlineQueryContext } from "grammy";
import { webhookCallback } from "grammy";

import { getBot } from "@/lib/telegram/bot-api/bot";
import {
  handleActivateCommunityCommand,
  handleCaCommand,
  handleDeactivateCommunityCommand,
  handleHideCommunityCommand,
  handleNotificationsCommand,
  handleSettingsCommand,
  handleStartCommand,
  handleSummaryCommand,
  handleUnhideCommunityCommand,
} from "@/lib/telegram/bot-api/commands";
import { handleBusinessConnection } from "@/lib/telegram/bot-api/handle-business-connection";
import { handleInlineQuery } from "@/lib/telegram/bot-api/inline";
import {
  handleCommunityMessage,
  handleGLoyalReaction,
} from "@/lib/telegram/bot-api/message-handlers";
import { handleMyChatMemberUpdate } from "@/lib/telegram/bot-api/my-chat-member";
import {
  handleNotificationSettingsCallback,
  NOTIFICATION_SETTINGS_CALLBACK_DATA_REGEX,
} from "@/lib/telegram/bot-api/notification-settings";
import {
  handleStartCarouselCallback,
  START_CAROUSEL_CALLBACK_DATA_REGEX,
} from "@/lib/telegram/bot-api/start-carousel";
import { resolveSummaryCommunityPeerId } from "@/lib/telegram/bot-api/summary-chat-id";
import {
  handleSummaryVoteCallback,
  SUMMARY_VOTE_CALLBACK_DATA_REGEX,
} from "@/lib/telegram/bot-api/summary-votes";
import {
  handleUserSettingsCallback,
  USER_SETTINGS_CALLBACK_DATA_REGEX,
} from "@/lib/telegram/bot-api/user-settings";
import {
  handleDirectMessage,
  handleDirectTopicCreatedMessage,
} from "@/lib/telegram/conversation-service";
import { isPrivateChat } from "@/lib/telegram/utils";

const bot = await getBot();

bot.command("start", async (ctx: CommandContext<Context>) => {
  await handleStartCommand(ctx, bot);
});

bot.chatType("private").command("settings", async (ctx) => {
  await handleSettingsCommand(ctx);
});

bot.command("ca", async (ctx: CommandContext<Context>) => {
  await handleCaCommand(ctx, bot);
});

bot.command("activate_community", async (ctx: CommandContext<Context>) => {
  await handleActivateCommunityCommand(ctx);
});

bot.command("deactivate_community", async (ctx: CommandContext<Context>) => {
  await handleDeactivateCommunityCommand(ctx);
});

bot.command("hide", async (ctx: CommandContext<Context>) => {
  await handleHideCommunityCommand(ctx);
});

bot.command("unhide", async (ctx: CommandContext<Context>) => {
  await handleUnhideCommunityCommand(ctx);
});

bot.command("summary", async (ctx: CommandContext<Context>) => {
  const summarySourceChatId = ctx.chat
    ? resolveSummaryCommunityPeerId(BigInt(ctx.chat.id))
    : undefined;

  await handleSummaryCommand(ctx, bot, {
    summarySourceChatId,
  });
});

bot.command("notifications", async (ctx: CommandContext<Context>) => {
  await handleNotificationsCommand(ctx);
});

bot.on("inline_query", async (ctx) => {
  await handleInlineQuery(ctx as InlineQueryContext<Context>);
});

bot.callbackQuery(START_CAROUSEL_CALLBACK_DATA_REGEX, async (ctx) => {
  await handleStartCarouselCallback(ctx);
});

bot.callbackQuery(NOTIFICATION_SETTINGS_CALLBACK_DATA_REGEX, async (ctx) => {
  await handleNotificationSettingsCallback(ctx);
});

bot.callbackQuery(USER_SETTINGS_CALLBACK_DATA_REGEX, async (ctx) => {
  await handleUserSettingsCallback(ctx);
});

bot.callbackQuery(SUMMARY_VOTE_CALLBACK_DATA_REGEX, async (ctx) => {
  await handleSummaryVoteCallback(ctx);
});

// Keep this fallback at the end so unknown callback queries don't show
// a perpetual loading state in Telegram clients.
bot.on("callback_query:data", async (ctx) => {
  await ctx.answerCallbackQuery();
});

bot.on("business_connection", async (ctx) => {
  try {
    await handleBusinessConnection(ctx.update.business_connection);
  } catch (error) {
    console.error("Failed to handle business connection", error);
  }
});

bot.on("my_chat_member", async (ctx) => {
  await handleMyChatMemberUpdate(ctx);
});

bot.on("message:forum_topic_created", async (ctx) => {
  const chatType = ctx.chat?.type;
  if (!chatType || !isPrivateChat(chatType)) {
    return;
  }

  await handleDirectTopicCreatedMessage(ctx);
});

bot.on("message:text", async (ctx) => {
  const chatType = ctx.chat?.type;

  // Route private DMs to conversation handler (skip commands)
  if (chatType && isPrivateChat(chatType)) {
    // Commands are handled by bot.command() handlers above
    if (!ctx.message?.text?.startsWith("/")) {
      await handleDirectMessage(ctx, bot);
    }
    return;
  }

  // Handle group/community messages
  await Promise.all([
    handleGLoyalReaction(ctx, bot),
    handleCommunityMessage(ctx),
  ]);
});

export const POST = webhookCallback(bot, "std/http");
