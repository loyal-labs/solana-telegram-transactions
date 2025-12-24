import type { CommandContext, Context } from "grammy";
import { Bot, InlineKeyboard } from "grammy";

import { MINI_APP_LINK } from "./constants";

export const handleStartCommand = async (
  ctx: CommandContext<Context>,
  bot: Bot
) => {
  const welcomeText = `<b>Welcome to Loyal!</b>\n\nThis bot utilizes Loyal private AI to summarize, prioritize and filter your Telegram chat.\n\nAll your messages are encrypted, and neither the Loyal team nor our compute providers can see them. For more info, visit our GitHub: https://github.com/loyal-labs\n\nWARNING: this product is in open test phase, so the functionality may be incomplete and you may encounter bugs.\n\nWe appreciate any feedback in our @loyal_tgchat`;
  const buttonText = "Go Loyal";
  const keyboard = new InlineKeyboard().url(buttonText, MINI_APP_LINK);

  const user = ctx.from;
  if (!user) {
    console.error("User not found in start command");
    return;
  }
  const userId = user.id;

  const welcomeMessage = await bot.api.sendMessage(userId, welcomeText, {
    reply_markup: keyboard,
    parse_mode: "HTML",
  });

  await bot.api.pinChatMessage(userId, welcomeMessage.message_id);
};

export const handleCaCommand = async (
  ctx: CommandContext<Context>,
  bot: Bot
) => {
  const caAddress = "LYLikzBQtpa9ZgVrJsqYGQpR3cC1WMJrBHaXGrQmeta";
  const caAddressMarkdown = `\`${caAddress}\``;

  const keyboard = new InlineKeyboard()
    .url("Jupiter", `https://jup.ag/tokens/${caAddress}`)
    .url("Dexscreener", `https://dexscreener.com/solana/${caAddress}`)
    .row()
    .copyText("Copy CA to clipboard", caAddress);

  const chatId = ctx.chat?.id;
  if (!chatId) {
    console.error("Chat ID not found in ca command");
    return;
  }

  await bot.api.sendMessage(chatId, `$LOYAL's CA: ${caAddressMarkdown}`, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
};
