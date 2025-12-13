import type { CommandContext, Context } from "grammy";
import { InlineKeyboard } from "grammy";
import { webhookCallback } from "grammy";

import { getBot } from "../../../../lib/telegram/bot-api/bot";
import { MINI_APP_LINK } from "../../../../lib/telegram/bot-api/constants";

const bot = await getBot();

bot.command("start", async (ctx: CommandContext<Context>) => {
  const welcomeText = `<b>Welcome to Loyal!</b>\n\nThis bot utilizes Loyal private AI to summarize, prioritize and filter your Telegram chat.\n\nAll your messages are encrypted, and neither the Loyal team nor our compute providers can see them. For more info, visit our GitHub: https://github.com/loyal-labs\n\nWARNING: this product is in open test phase, so the functionality may be incomplete and you may encounter bugs.\n\nWe appreciate any feedback in our @loyal_tgchat`;
  const buttonText = "Go Loyal";
  const keyboard = new InlineKeyboard().url(buttonText, MINI_APP_LINK);

  const user = ctx.from;
  if (!user) {
    console.error("User not found in start command");
    return;
  }
  const userId = user.id;

  console.log(ctx);

  const welcomeMessage = await bot.api.sendMessage(userId, welcomeText, {
    reply_markup: keyboard,
    parse_mode: "HTML",
  });

  await bot.api.pinChatMessage(userId, welcomeMessage.message_id);
});

export const POST = webhookCallback(bot, "std/http");
