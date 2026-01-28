import type { CommandContext, Context, InlineQueryContext } from "grammy";
import { webhookCallback } from "grammy";

import { getBot } from "@/lib/telegram/bot-api/bot";
import {
  handleActivateCommunityCommand,
  handleCaCommand,
  handleStartCommand,
} from "@/lib/telegram/bot-api/commands";
import { sendBusinessConnectionMessage } from "@/lib/telegram/bot-api/handle-business-connection";
import { handleInlineQuery } from "@/lib/telegram/bot-api/inline";
import {
  handleCommunityMessage,
  handleGLoyalReaction,
} from "@/lib/telegram/bot-api/message-handlers";

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

bot.on("inline_query", async (ctx) => {
  await handleInlineQuery(ctx as InlineQueryContext<Context>);
});

bot.on("business_connection:is_enabled", async (ctx) => {
  const connectionId = ctx.update.business_connection.id;
  const connectionEnabled = ctx.update.business_connection.is_enabled;
  const userId = ctx.businessConnection.user_chat_id;

  await sendBusinessConnectionMessage(connectionId, connectionEnabled, userId);
});

bot.on("message:text", async (ctx) => {
  await Promise.all([
    handleGLoyalReaction(ctx, bot),
    handleCommunityMessage(ctx),
  ]);
});

export const POST = webhookCallback(bot, "std/http");
