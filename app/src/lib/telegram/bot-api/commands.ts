import { eq } from "drizzle-orm";
import type { CommandContext, Context } from "grammy";
import { Bot, InlineKeyboard } from "grammy";

import { getDatabase } from "@/lib/core/database";
import { admins, communities } from "@/lib/core/schema";
import { getOrCreateUser } from "@/lib/telegram/user-service";
import { getTelegramDisplayName, isCommunityChat } from "@/lib/telegram/utils";

import { CA_COMMAND_CHAT_ID } from "./constants";
import { getChat } from "./get-chat";
import { downloadTelegramFile } from "./get-file";
import { sendNotificationSettingsMessage } from "./notification-settings";
import { sendStartCarousel } from "./start-carousel";
import { sendLatestSummary } from "./summaries";
import type { HandleSummaryCommandOptions } from "./types";

interface CommunityPhoto {
  base64: string;
  mimeType: string;
}

/**
 * Fetches community profile photo and converts to base64.
 * Returns undefined if photo is unavailable or fetch fails.
 */
async function fetchCommunityPhoto(
  chatId: number | string
): Promise<CommunityPhoto | undefined> {
  try {
    const chatInfo = await getChat(chatId);
    if (!chatInfo.photo?.small_file_id) {
      return undefined;
    }
    const photo = await downloadTelegramFile(chatInfo.photo.small_file_id);
    return {
      base64: photo.body.toString("base64"),
      mimeType: photo.contentType,
    };
  } catch (error) {
    console.warn("Failed to fetch community photo:", error);
    return undefined;
  }
}

export async function handleStartCommand(
  ctx: CommandContext<Context>,
  bot: Bot
): Promise<void> {
  await sendStartCarousel(ctx, bot);
}

export async function handleCaCommand(
  ctx: CommandContext<Context>,
  bot: Bot
): Promise<void> {
  const caAddress = "LYLikzBQtpa9ZgVrJsqYGQpR3cC1WMJrBHaXGrQmeta";
  const caAddressMarkdown = `\`${caAddress}\``;
  const cmcEndpoint =
    "https://api.coinmarketcap.com/data-api/v3.3/cryptocurrency/detail/chart?id=39037&interval=3h&convertId=2781&range=All";
  const currencyFormatter = new Intl.NumberFormat("en-US", {
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

  // Only respond in the designated community chat
  if (chatId !== Number(CA_COMMAND_CHAT_ID)) {
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
      priceValue = `$${currencyFormatter.format(latestPrice)}`;
    }
    if (Number.isFinite(latestMarketCap)) {
      marketCapValue = `$${currencyFormatter.format(latestMarketCap)}`;
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
}

export async function handleActivateCommunityCommand(
  ctx: CommandContext<Context>
): Promise<void> {
  if (!ctx.from || !ctx.chat) return;

  // Delete the command message to keep chat clean
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.warn("Failed to delete /activate_community command message", error);
  }

  if (!isCommunityChat(ctx.chat.type)) {
    await ctx.reply("This command can only be used in group chats.");
    return;
  }

  const telegramUserId = BigInt(ctx.from.id);

  try {
    const db = getDatabase();

    // Check if user is in admin whitelist
    const admin = await db.query.admins.findFirst({
      where: eq(admins.telegramId, telegramUserId),
    });

    if (!admin) {
      await ctx.reply(
        "You are not authorized to activate communities. Contact an administrator to be added to the whitelist."
      );
      return;
    }

    const chatId = BigInt(ctx.chat.id);

    // Fetch community photo (non-blocking on failure)
    const photo = await fetchCommunityPhoto(ctx.chat.id);
    const settings = photo
      ? {
          photoBase64: photo.base64,
          photoMimeType: photo.mimeType,
          photoUpdatedAt: new Date().toISOString(),
        }
      : {};

    // Check if community already exists
    const existingCommunity = await db.query.communities.findFirst({
      where: eq(communities.chatId, chatId),
    });

    if (existingCommunity) {
      // Merge new settings with existing settings
      const mergedSettings = {
        ...((existingCommunity.settings as object) || {}),
        ...settings,
      };

      if (existingCommunity.isActive) {
        // Update community data even if already active
        await db
          .update(communities)
          .set({
            chatTitle: ctx.chat.title || "Untitled",
            settings: mergedSettings,
            updatedAt: new Date(),
          })
          .where(eq(communities.id, existingCommunity.id));
        await ctx.reply("Community is already activated. Data updated!");
        return;
      }

      // Reactivate the community with updated data
      await db
        .update(communities)
        .set({
          isActive: true,
          chatTitle: ctx.chat.title || "Untitled",
          settings: mergedSettings,
          updatedAt: new Date(),
        })
        .where(eq(communities.id, existingCommunity.id));
      await ctx.reply("Community reactivated for message tracking!");
      return;
    }

    // Ensure user exists in the users table
    const displayName = getTelegramDisplayName(ctx.from);
    await getOrCreateUser(telegramUserId, {
      username: ctx.from.username || null,
      displayName,
    });

    // Create new community
    await db.insert(communities).values({
      chatId,
      chatTitle: ctx.chat.title || "Untitled",
      activatedBy: telegramUserId,
      settings,
    });

    await ctx.reply("Community activated for message tracking!");
  } catch (error) {
    console.error("Failed to activate community", error);
    await ctx.reply(
      "An error occurred while activating the community. Please try again."
    );
  }
}

export async function handleSummaryCommand(
  ctx: CommandContext<Context>,
  bot: Bot,
  options?: HandleSummaryCommandOptions
): Promise<void> {
  if (!ctx.chat) return;

  if (!isCommunityChat(ctx.chat.type)) {
    await ctx.reply("This command can only be used in group chats.");
    return;
  }

  const requestChatId = BigInt(ctx.chat.id);
  const summarySourceChatId = options?.summarySourceChatId ?? requestChatId;

  try {
    const result = await sendLatestSummary(bot, summarySourceChatId, {
      destinationChatId: requestChatId,
      replyToMessageId: ctx.msg?.message_id,
    });

    if (!result.sent) {
      if (result.reason === "not_activated") {
        await ctx.reply(
          "This community is not activated. Use /activate_community to enable summaries."
        );
      } else if (result.reason === "notifications_disabled") {
        await ctx.reply(
          "Summary notifications are turned off for this community. Use /notifications to turn them on."
        );
      } else if (result.reason === "no_summaries") {
        await ctx.reply(
          "No summaries available yet. Summaries are generated daily when there's enough activity."
        );
      }
    }
  } catch (error) {
    console.error("Failed to send summary", error);
    await ctx.reply(
      "An error occurred while fetching the summary. Please try again."
    );
  }
}

export async function handleNotificationsCommand(
  ctx: CommandContext<Context>
): Promise<void> {
  if (!ctx.chat) return;

  if (!isCommunityChat(ctx.chat.type)) {
    await ctx.reply("This command can only be used in group chats.");
    return;
  }

  try {
    const db = getDatabase();
    const chatId = BigInt(ctx.chat.id);
    const community = await db.query.communities.findFirst({
      where: eq(communities.chatId, chatId),
    });

    if (!community || !community.isActive) {
      await ctx.reply(
        "This community is not activated. Use /activate_community to enable summaries."
      );
      return;
    }

    await sendNotificationSettingsMessage(ctx, community);
  } catch (error) {
    console.error("Failed to send notification settings", error);
    await ctx.reply(
      "An error occurred while loading notification settings. Please try again."
    );
  }
}

export async function handleDeactivateCommunityCommand(
  ctx: CommandContext<Context>
): Promise<void> {
  if (!ctx.from || !ctx.chat) return;

  // Delete the command message to keep chat clean
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.warn(
      "Failed to delete /deactivate_community command message",
      error
    );
  }

  if (!isCommunityChat(ctx.chat.type)) {
    await ctx.reply("This command can only be used in group chats.");
    return;
  }

  const telegramUserId = BigInt(ctx.from.id);

  try {
    const db = getDatabase();

    // Check if user is in admin whitelist
    const admin = await db.query.admins.findFirst({
      where: eq(admins.telegramId, telegramUserId),
    });

    if (!admin) {
      await ctx.reply(
        "You are not authorized to deactivate communities. Contact an administrator to be added to the whitelist."
      );
      return;
    }

    const chatId = BigInt(ctx.chat.id);

    // Find the community
    const existingCommunity = await db.query.communities.findFirst({
      where: eq(communities.chatId, chatId),
    });

    if (!existingCommunity) {
      await ctx.reply("This community is not activated.");
      return;
    }

    if (!existingCommunity.isActive) {
      await ctx.reply("This community is already deactivated.");
      return;
    }

    // Deactivate the community
    await db
      .update(communities)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(communities.id, existingCommunity.id));

    await ctx.reply("Community deactivated. Message tracking has been disabled.");
  } catch (error) {
    console.error("Failed to deactivate community", error);
    await ctx.reply(
      "An error occurred while deactivating the community. Please try again."
    );
  }
}
