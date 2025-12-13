import type { CommandContext, Context } from "grammy";
import { webhookCallback } from "grammy";

import { getBot } from "@/lib/telegram/bot-api/bot";
import { sendBusinessConnectionMessage } from "@/lib/telegram/bot-api/handle-business-connection";
import { handleStartCommand } from "@/lib/telegram/bot-api/handle-start-command";

const bot = await getBot();

bot.command("start", async (ctx: CommandContext<Context>) => {
  await handleStartCommand(ctx, bot);
});

bot.on("business_connection:is_enabled", async (ctx) => {
  const connectionId = ctx.update.business_connection.id;
  const connectionEnabled = ctx.update.business_connection.is_enabled;
  const userId = ctx.businessConnection.user_chat_id;

  await sendBusinessConnectionMessage(connectionId, connectionEnabled, userId);
});

export const POST = webhookCallback(bot, "std/http");
