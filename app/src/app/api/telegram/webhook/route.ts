import type { CommandContext, Context, InlineQueryContext } from "grammy";
import { webhookCallback } from "grammy";

import { getBot } from "@/lib/telegram/bot-api/bot";
import {
  handleActivateCommunityCommand,
  handleCaCommand,
  handleDeactivateCommunityCommand,
  handleStartCommand,
  handleSummaryCommand,
} from "@/lib/telegram/bot-api/commands";
import { handleBusinessConnection } from "@/lib/telegram/bot-api/handle-business-connection";
import { handleInlineQuery } from "@/lib/telegram/bot-api/inline";
import {
  handleCommunityMessage,
  handleGLoyalReaction,
} from "@/lib/telegram/bot-api/message-handlers";
import {
  handleStartCarouselCallback,
  START_CAROUSEL_CALLBACK_DATA_REGEX,
} from "@/lib/telegram/bot-api/start-carousel";
import { resolveSummaryCommunityPeerId } from "@/lib/telegram/bot-api/summary-chat-id";
import {
  handleDirectMessage,
  handleDirectTopicCreatedMessage,
} from "@/lib/telegram/conversation-service";
import { isPrivateChat } from "@/lib/telegram/utils";

const bot = await getBot();

bot.command("start", async (ctx: CommandContext<Context>) => {
  await handleStartCommand(ctx, bot);
});

bot.command("ca", async (ctx: CommandContext<Context>) => {
  await handleCaCommand(ctx, bot);
});

bot.command("activate_community", async (ctx: CommandContext<Context>) => {
  await handleActivateCommunityCommand(ctx, bot);
});

bot.command("deactivate_community", async (ctx: CommandContext<Context>) => {
  await handleDeactivateCommunityCommand(ctx, bot);
});

bot.command("summary", async (ctx: CommandContext<Context>) => {
  const summarySourceChatId = ctx.chat
    ? resolveSummaryCommunityPeerId(BigInt(ctx.chat.id))
    : undefined;

  await handleSummaryCommand(ctx, bot, {
    summarySourceChatId,
  });
});

bot.on("inline_query", async (ctx) => {
  await handleInlineQuery(ctx as InlineQueryContext<Context>);
});

bot.callbackQuery(START_CAROUSEL_CALLBACK_DATA_REGEX, async (ctx) => {
  await handleStartCarouselCallback(ctx);
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
