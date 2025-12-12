import type { CommandContext, Context } from "grammy";
import { webhookCallback } from "grammy";

import { getBot } from "../../../../lib/telegram/bot-api/bot";

const bot = await getBot();

bot.command("start", async (ctx: CommandContext<Context>) => {
  await ctx.reply("Hello World!");
});

export const POST = webhookCallback(bot, "std/http");
