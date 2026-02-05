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
import { handleDirectMessage } from "@/lib/telegram/conversation-service";
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
  await handleSummaryCommand(ctx, bot);
});

bot.on("inline_query", async (ctx) => {
  await handleInlineQuery(ctx as InlineQueryContext<Context>);
});

bot.on("business_connection", async (ctx) => {
  try {
    await handleBusinessConnection(ctx.update.business_connection);
  } catch (error) {
    console.error("Failed to handle business connection", error);
  }
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
