import { randomUUID } from "node:crypto";

import type { CommandContext, Context } from "grammy";
import { Bot, InlineKeyboard } from "grammy";

import { getReadyBuilderClient } from "@/lib/nillion/core/builder";
import { COMMUNITY_CHATS_COLLECTION_ID } from "@/lib/nillion/schemas/community-chats-schema";

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
  const cmcEndpoint =
    "https://api.coinmarketcap.com/data-api/v3.3/cryptocurrency/detail/chart?id=39037&interval=3h&convertId=2781&range=All";
  const priceFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  const marketCapFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

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

  let priceValue = "N/A";
  let marketCapValue = "N/A";

  try {
    const response = await fetch(cmcEndpoint);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch CMC data: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    const points = data?.data?.points;
    const latestPoint =
      Array.isArray(points) && points.length > 0
        ? points[points.length - 1]
        : null;
    const latestValues = latestPoint?.v;
    const latestPrice = Array.isArray(latestValues)
      ? Number(latestValues[0])
      : NaN;
    const latestMarketCap = Array.isArray(latestValues)
      ? Number(latestValues[2])
      : NaN;

    if (Number.isFinite(latestPrice)) {
      priceValue = `$${priceFormatter.format(latestPrice)}`;
    }
    if (Number.isFinite(latestMarketCap)) {
      marketCapValue = `$${marketCapFormatter.format(latestMarketCap)}`;
    }
  } catch (error) {
    console.error("Failed to fetch CMC data for ca command", error);
  }

  const priceLine = `\n\nPrice: **${priceValue}**\nMarket cap: **${marketCapValue}**`;

  await bot.api.sendMessage(
    chatId,
    `$LOYAL's CA: ${caAddressMarkdown}${priceLine}`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
};

export const handleActivateCommunityCommand = async (
  ctx: CommandContext<Context>,
  bot: Bot
) => {
  if (!ctx.from || !ctx.chat) return;

  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") {
    await ctx.reply("This command can only be used in group chats.");
    return;
  }

  const member = await bot.api.getChatMember(ctx.chat.id, ctx.from.id);
  if (member.status !== "creator" && member.status !== "administrator") {
    await ctx.reply("Only admins can activate community tracking.");
    return;
  }

  const builderClient = await getReadyBuilderClient();
  const now = new Date().toISOString();

  await builderClient.createStandardData({
    collection: COMMUNITY_CHATS_COLLECTION_ID,
    data: [
      {
        _id: randomUUID(),
        chat_id: String(ctx.chat.id),
        chat_title: ctx.chat.title || "Untitled",
        activated_by: String(ctx.from.id),
        settings: {},
        activated_at: now,
        updated_at: now,
      },
    ],
  });

  await ctx.reply("Community activated for message tracking!");
};
