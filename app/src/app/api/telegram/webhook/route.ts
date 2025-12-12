import { Bot, webhookCallback } from "grammy";
import { getBot } from "../../../lib/telegram/bot";

const bot = getBot();

bot.command("start", async (ctx: any) => {
  await ctx.reply("Hello World!");
});

export const POST = webhookCallback(bot, "std/http");
