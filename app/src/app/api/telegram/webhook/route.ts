import type { CommandContext, Context } from "grammy";
import { webhookCallback } from "grammy";

import { getBot } from "@/lib/telegram/bot-api/bot";
import {
  handleCaCommand,
  handleStartCommand,
} from "@/lib/telegram/bot-api/commands";
import { sendBusinessConnectionMessage } from "@/lib/telegram/bot-api/handle-business-connection";

const bot = await getBot();

bot.command("start", async (ctx: CommandContext<Context>) => {
  await handleStartCommand(ctx, bot);
});

bot.command("ca", async (ctx: CommandContext<Context>) => {
  await handleCaCommand(ctx, bot);
});

bot.on("business_connection:is_enabled", async (ctx) => {
  const connectionId = ctx.update.business_connection.id;
  const connectionEnabled = ctx.update.business_connection.is_enabled;
  const userId = ctx.businessConnection.user_chat_id;

  await sendBusinessConnectionMessage(connectionId, connectionEnabled, userId);
});

export const POST = webhookCallback(bot, "std/http");
