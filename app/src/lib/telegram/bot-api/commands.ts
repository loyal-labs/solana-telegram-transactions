import { eq } from "drizzle-orm";
import type { CommandContext, Context } from "grammy";
import { Bot, InlineKeyboard } from "grammy";

import { getDatabase } from "@/lib/core/database";
import { admins, communities, type Community, userSettings } from "@/lib/core/schema";
import { getOrCreateUser } from "@/lib/telegram/user-service";
import { getTelegramDisplayName, isCommunityChat } from "@/lib/telegram/utils";

import {
  createBotTrackingProperties,
  type MixpanelTrackProperties,
  trackBotEvent,
} from "./analytics";
import { CA_COMMAND_CHAT_ID } from "./constants";
import { getChat } from "./get-chat";
import { downloadTelegramFile } from "./get-file";
import { replyWithAutoCleanup } from "./helper-message-cleanup";
import { evictActiveCommunityCache } from "./message-handlers";
import { sendNotificationSettingsMessage } from "./notification-settings";
import { sendStartCarousel } from "./start-carousel";
import { sendLatestSummary } from "./summaries";
import type { HandleSummaryCommandOptions } from "./types";
import { sendUserSettingsMessage } from "./user-settings";

interface CommunityPhoto {
  base64: string;
  mimeType: string;
}

const SETTINGS_LOAD_ERROR_REPLY_TEXT =
  "Unable to load your settings right now. Please try again.";
type CommunityCommandName =
  | "/activate_community"
  | "/deactivate_community"
  | "/hide"
  | "/unhide"
  | "/summary"
  | "/notifications";

const BOT_START_COMMAND_EVENT = "Bot /start Command";
const BOT_SUMMARY_COMMAND_EVENT = "Bot /summary Command";

function createCommandTrackingProperties(
  ctx: CommandContext<Context>
): MixpanelTrackProperties {
  return createBotTrackingProperties({
    chatId: ctx.chat?.id,
    chatType: ctx.chat?.type,
    userId: ctx.from?.id,
  });
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

async function isWhitelistedAdmin(
  db: ReturnType<typeof getDatabase>,
  telegramUserId: bigint
): Promise<boolean> {
  const admin = await db.query.admins.findFirst({
    where: eq(admins.telegramId, telegramUserId),
  });

  return Boolean(admin);
}

type CommunityReplyOptions = Parameters<typeof replyWithAutoCleanup>[2];

async function replyCommunitySuccess(
  ctx: CommandContext<Context>,
  text: string,
  options?: CommunityReplyOptions
): Promise<void> {
  await replyWithAutoCleanup(ctx, text, options);
}

function suppressCommunityFailure(
  command: CommunityCommandName,
  reason: string,
  ctx: CommandContext<Context>,
  error?: unknown
): void {
  const details = {
    command,
    reason,
    telegram_chat_id: ctx.chat ? String(ctx.chat.id) : null,
    telegram_chat_type: ctx.chat?.type ?? null,
    telegram_user_id: ctx.from ? String(ctx.from.id) : null,
  };

  if (error) {
    console.error("Suppressed community command reply", {
      ...details,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  console.warn("Suppressed community command reply", details);
}

async function findActiveCommunity(
  ctx: CommandContext<Context>,
  db: ReturnType<typeof getDatabase>
) {
  if (!ctx.chat) {
    return null;
  }

  const chatId = BigInt(ctx.chat.id);
  const existingCommunity = await db.query.communities.findFirst({
    where: eq(communities.chatId, chatId),
  });

  if (!existingCommunity || !existingCommunity.isActive) {
    return null;
  }

  return existingCommunity;
}

function mergeCommunitySettings(
  existingSettings: unknown,
  nextSettings: Record<string, unknown>
): Record<string, unknown> {
  const current =
    existingSettings && typeof existingSettings === "object"
      ? (existingSettings as Record<string, unknown>)
      : {};

  return {
    ...current,
    ...nextSettings,
  };
}

async function syncActivationForExistingCommunity(params: {
  ctx: CommandContext<Context>;
  db: ReturnType<typeof getDatabase>;
  existingCommunity: Community;
  settings: Record<string, unknown>;
}): Promise<void> {
  const mergedSettings = mergeCommunitySettings(
    params.existingCommunity.settings,
    params.settings
  );

  if (params.existingCommunity.isActive) {
    await params.db
      .update(communities)
      .set({
        chatTitle: params.ctx.chat?.title || "Untitled",
        settings: mergedSettings,
        updatedAt: new Date(),
      })
      .where(eq(communities.id, params.existingCommunity.id));
    await replyCommunitySuccess(
      params.ctx,
      "Community is already activated. Data updated!"
    );
    return;
  }

  await params.db
    .update(communities)
    .set({
      isActive: true,
      chatTitle: params.ctx.chat?.title || "Untitled",
      settings: mergedSettings,
      updatedAt: new Date(),
    })
    .where(eq(communities.id, params.existingCommunity.id));
  await replyCommunitySuccess(
    params.ctx,
    "Community reactivated for message tracking!"
  );
}

export async function handleStartCommand(
  ctx: CommandContext<Context>,
  bot: Bot
): Promise<void> {
  await sendStartCarousel(ctx, bot);
  trackBotEvent(BOT_START_COMMAND_EVENT, createCommandTrackingProperties(ctx));
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
    await replyWithAutoCleanup(
      ctx,
      "This command can only be used in group chats."
    );
    return;
  }

  const telegramUserId = BigInt(ctx.from.id);

  try {
    const db = getDatabase();

    if (!(await isWhitelistedAdmin(db, telegramUserId))) {
      suppressCommunityFailure("/activate_community", "unauthorized", ctx);
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
      await syncActivationForExistingCommunity({
        ctx,
        db,
        existingCommunity,
        settings,
      });
      return;
    }

    // Ensure user exists in the users table
    const displayName = getTelegramDisplayName(ctx.from);
    await getOrCreateUser(telegramUserId, {
      username: ctx.from.username || null,
      displayName,
    });

    // Race-safe insert: another request may activate the same chat concurrently.
    const inserted = await db
      .insert(communities)
      .values({
        chatId,
        chatTitle: ctx.chat.title || "Untitled",
        activatedBy: telegramUserId,
        isPublic: false,
        settings,
      })
      .onConflictDoNothing()
      .returning({ id: communities.id });

    if (inserted.length > 0) {
      await replyCommunitySuccess(
        ctx,
        "Community activated for message tracking!"
      );
      return;
    }

    const racedCommunity = await db.query.communities.findFirst({
      where: eq(communities.chatId, chatId),
    });
    if (!racedCommunity) {
      suppressCommunityFailure(
        "/activate_community",
        "insert_conflict_community_missing",
        ctx
      );
      return;
    }

    await syncActivationForExistingCommunity({
      ctx,
      db,
      existingCommunity: racedCommunity,
      settings,
    });
  } catch (error) {
    suppressCommunityFailure("/activate_community", "internal_error", ctx, error);
  }
}

export async function handleSummaryCommand(
  ctx: CommandContext<Context>,
  bot: Bot,
  options?: HandleSummaryCommandOptions
): Promise<void> {
  if (!ctx.chat) return;

  if (!isCommunityChat(ctx.chat.type)) {
    await replyWithAutoCleanup(
      ctx,
      "This command can only be used in group chats."
    );
    return;
  }

  const requestChatId = BigInt(ctx.chat.id);
  const summarySourceChatId = options?.summarySourceChatId ?? requestChatId;

  try {
    const result = await sendLatestSummary(bot, summarySourceChatId, {
      destinationChatId: requestChatId,
      replyToMessageId: ctx.msg?.message_id,
    });

    if (result.sent) {
      trackBotEvent(BOT_SUMMARY_COMMAND_EVENT, {
        ...createCommandTrackingProperties(ctx),
        summary_destination_chat_id: requestChatId.toString(),
        summary_source_chat_id: summarySourceChatId.toString(),
      });
      return;
    }

    suppressCommunityFailure("/summary", result.reason, ctx);
  } catch (error) {
    suppressCommunityFailure("/summary", "internal_error", ctx, error);
  }
}

export async function handleNotificationsCommand(
  ctx: CommandContext<Context>
): Promise<void> {
  if (!ctx.chat) return;

  if (!isCommunityChat(ctx.chat.type)) {
    await replyWithAutoCleanup(
      ctx,
      "This command can only be used in group chats."
    );
    return;
  }

  try {
    const db = getDatabase();
    if (!ctx.from) {
      suppressCommunityFailure("/notifications", "missing_user_context", ctx);
      return;
    }

    const telegramUserId = BigInt(ctx.from.id);
    if (!(await isWhitelistedAdmin(db, telegramUserId))) {
      suppressCommunityFailure("/notifications", "unauthorized", ctx);
      return;
    }

    const chatId = BigInt(ctx.chat.id);
    const community = await db.query.communities.findFirst({
      where: eq(communities.chatId, chatId),
    });

    if (!community || !community.isActive) {
      suppressCommunityFailure("/notifications", "not_activated", ctx);
      return;
    }

    await sendNotificationSettingsMessage(ctx, community);
  } catch (error) {
    suppressCommunityFailure("/notifications", "internal_error", ctx, error);
  }
}

export async function handleSettingsCommand(
  ctx: CommandContext<Context>
): Promise<void> {
  if (!ctx.from || !ctx.chat) return;
  if (ctx.chat.type !== "private") return;

  try {
    const db = getDatabase();
    const telegramUserId = BigInt(ctx.from.id);
    const userId = await getOrCreateUser(telegramUserId, {
      username: ctx.from.username || null,
      displayName: getTelegramDisplayName(ctx.from),
    });

    await db.insert(userSettings).values({ userId }).onConflictDoNothing();

    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });

    if (!settings) {
      await ctx.reply(SETTINGS_LOAD_ERROR_REPLY_TEXT);
      return;
    }

    await sendUserSettingsMessage(ctx, settings);
  } catch (error) {
    console.error("Failed to send user settings", error);
    await ctx.reply(SETTINGS_LOAD_ERROR_REPLY_TEXT);
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
    await replyWithAutoCleanup(
      ctx,
      "This command can only be used in group chats."
    );
    return;
  }

  const telegramUserId = BigInt(ctx.from.id);

  try {
    const db = getDatabase();

    if (!(await isWhitelistedAdmin(db, telegramUserId))) {
      suppressCommunityFailure("/deactivate_community", "unauthorized", ctx);
      return;
    }

    const chatId = BigInt(ctx.chat.id);

    // Find the community
    const existingCommunity = await db.query.communities.findFirst({
      where: eq(communities.chatId, chatId),
    });

    if (!existingCommunity) {
      suppressCommunityFailure("/deactivate_community", "not_activated", ctx);
      return;
    }

    if (!existingCommunity.isActive) {
      suppressCommunityFailure(
        "/deactivate_community",
        "already_deactivated",
        ctx
      );
      return;
    }

    // Deactivate the community
    await db
      .update(communities)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(communities.id, existingCommunity.id));

    evictActiveCommunityCache(chatId);
    await replyCommunitySuccess(
      ctx,
      "Community deactivated. Message tracking has been disabled."
    );
  } catch (error) {
    suppressCommunityFailure(
      "/deactivate_community",
      "internal_error",
      ctx,
      error
    );
  }
}

export async function handleHideCommunityCommand(
  ctx: CommandContext<Context>
): Promise<void> {
  if (!ctx.from || !ctx.chat) return;

  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.warn("Failed to delete /hide command message", error);
  }

  if (!isCommunityChat(ctx.chat.type)) {
    await replyWithAutoCleanup(
      ctx,
      "This command can only be used in group chats."
    );
    return;
  }

  const telegramUserId = BigInt(ctx.from.id);

  try {
    const db = getDatabase();
    if (!(await isWhitelistedAdmin(db, telegramUserId))) {
      suppressCommunityFailure("/hide", "unauthorized", ctx);
      return;
    }

    const existingCommunity = await findActiveCommunity(ctx, db);
    if (!existingCommunity) {
      suppressCommunityFailure("/hide", "not_activated", ctx);
      return;
    }

    if (!existingCommunity.isPublic) {
      suppressCommunityFailure("/hide", "already_hidden", ctx);
      return;
    }

    await db
      .update(communities)
      .set({ isPublic: false, updatedAt: new Date() })
      .where(eq(communities.id, existingCommunity.id));

    await replyCommunitySuccess(ctx, "Community hidden from public summaries.");
  } catch (error) {
    suppressCommunityFailure("/hide", "internal_error", ctx, error);
  }
}

export async function handleUnhideCommunityCommand(
  ctx: CommandContext<Context>
): Promise<void> {
  if (!ctx.from || !ctx.chat) return;

  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.warn("Failed to delete /unhide command message", error);
  }

  if (!isCommunityChat(ctx.chat.type)) {
    await replyWithAutoCleanup(
      ctx,
      "This command can only be used in group chats."
    );
    return;
  }

  const telegramUserId = BigInt(ctx.from.id);

  try {
    const db = getDatabase();
    if (!(await isWhitelistedAdmin(db, telegramUserId))) {
      suppressCommunityFailure("/unhide", "unauthorized", ctx);
      return;
    }

    const existingCommunity = await findActiveCommunity(ctx, db);
    if (!existingCommunity) {
      suppressCommunityFailure("/unhide", "not_activated", ctx);
      return;
    }

    if (existingCommunity.isPublic) {
      suppressCommunityFailure("/unhide", "already_visible", ctx);
      return;
    }

    await db
      .update(communities)
      .set({ isPublic: true, updatedAt: new Date() })
      .where(eq(communities.id, existingCommunity.id));

    await replyCommunitySuccess(
      ctx,
      "Community is now visible in public summaries."
    );
  } catch (error) {
    suppressCommunityFailure("/unhide", "internal_error", ctx, error);
  }
}
