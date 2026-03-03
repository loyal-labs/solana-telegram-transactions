import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Telegram Business Bot Rights - permissions granted to the bot.
 * All fields are optional booleans.
 */
export type BusinessBotRights = {
  can_reply?: boolean;
  can_read_messages?: boolean;
  can_delete_sent_messages?: boolean;
  can_delete_all_messages?: boolean;
  can_edit_name?: boolean;
  can_edit_bio?: boolean;
  can_edit_profile_photo?: boolean;
  can_edit_username?: boolean;
  can_manage_stories?: boolean;
};

/**
 * Sender type for bot conversation messages.
 */
export type SenderType = "user" | "bot" | "system";

/**
 * Thread status for bot conversations.
 */
export type ThreadStatus = "active" | "archived" | "closed";

/**
 * Allowed user actions for summary voting.
 */
export type SummaryVoteAction = "LIKE" | "DISLIKE";

/**
 * Allowed time-based summary notification frequency options.
 */
export type SummaryNotificationTimeHours = 24 | 48;

/**
 * Allowed message-count summary notification frequency options.
 */
export type SummaryNotificationMessageCount = 500 | 1000;

/**
 * Community ingestion parser type.
 */
export type CommunityParserType = "bot" | "userbot";

/**
 * Encrypted message content stored as JSONB.
 * Supports text now, extensible for images/voice later.
 */
export type EncryptedMessageContent = {
  type: "text" | "image" | "voice";
  ciphertext: string; // base64 encoded
  iv: string; // base64 encoded (12 bytes)
  metadata?: {
    fileName?: string;
    fileSize?: number;
    duration?: number; // for voice messages
    mimeType?: string;
  };
};

// ============================================================================
// TABLES
// ============================================================================

/**
 * Global admins whitelist for privileged community actions.
 * Users in this table can activate/deactivate communities and manage
 * notification settings.
 */
export const admins = pgTable(
  "admins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    telegramId: bigint("telegram_id", { mode: "bigint" }).notNull(),
    username: text("username"),
    displayName: text("display_name").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    addedBy: text("added_by"),
    notes: text("notes"),
  },
  (table) => [uniqueIndex("admins_telegram_id_idx").on(table.telegramId)]
);

/**
 * Telegram users who post messages in communities.
 * Created automatically when a user sends their first message.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    telegramId: bigint("telegram_id", { mode: "bigint" }).notNull(),
    username: text("username"),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    settings: jsonb("settings").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_telegram_id_idx").on(table.telegramId)]
);

/**
 * Per-user bot settings for private chat behavior.
 * Linked one-to-one with users.
 */
export const userSettings = pgTable(
  "user_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    model: text("model").default("phala/gpt-oss-120b").notNull(),
    notifications: boolean("notifications").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("user_settings_user_id_idx").on(table.userId)]
);

/**
 * Telegram group chats activated for message tracking.
 * Privileged management actions are controlled by the admins whitelist.
 */
export const communities = pgTable(
  "communities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: bigint("chat_id", { mode: "bigint" }).notNull(),
    chatTitle: text("chat_title").notNull(),
    activatedBy: bigint("activated_by", { mode: "bigint" }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    parserType: text("parser_type")
      .$type<CommunityParserType>()
      .default("bot")
      .notNull(),
    summaryNotificationsEnabled: boolean("summary_notifications_enabled")
      .default(true)
      .notNull(),
    summaryNotificationTimeHours: integer("summary_notification_time_hours")
      .$type<SummaryNotificationTimeHours | null>()
      .default(24),
    summaryNotificationMessageCount: integer(
      "summary_notification_message_count"
    )
      .$type<SummaryNotificationMessageCount | null>()
      .default(null),
    isPublic: boolean("is_public").default(true).notNull(),
    settings: jsonb("settings").default({}).notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("communities_chat_id_idx").on(table.chatId),
    index("communities_is_active_idx").on(table.isActive),
    index("communities_is_active_parser_type_idx").on(
      table.isActive,
      table.parserType
    ),
    check(
      "communities_summary_notification_time_hours_check",
      sql`${table.summaryNotificationTimeHours} IS NULL OR ${table.summaryNotificationTimeHours} IN (24, 48)`
    ),
    check(
      "communities_parser_type_check",
      sql`${table.parserType} IN ('bot', 'userbot')`
    ),
    check(
      "communities_summary_notification_message_count_check",
      sql`${table.summaryNotificationMessageCount} IS NULL OR ${table.summaryNotificationMessageCount} IN (500, 1000)`
    ),
  ]
);

/**
 * Many-to-many relationship between communities and users.
 * Tracks which users are members of which communities.
 */
export const communityMembers = pgTable(
  "community_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("community_members_unique_idx").on(
      table.communityId,
      table.userId
    ),
    index("community_members_user_id_idx").on(table.userId),
  ]
);

/**
 * Chat messages from tracked communities.
 * High-volume table - optimized with composite indexes for date-range queries.
 */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    telegramMessageId: bigint("telegram_message_id", {
      mode: "bigint",
    }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Primary query pattern: messages by community + date range (for summaries)
    index("messages_community_created_idx").on(
      table.communityId,
      table.createdAt
    ),
    // Prevent duplicate telegram messages per community
    uniqueIndex("messages_community_telegram_id_idx").on(
      table.communityId,
      table.telegramMessageId
    ),
    // Secondary: lookup messages by user
    index("messages_user_id_idx").on(table.userId),
  ]
);

/**
 * Daily AI-generated chat summaries organized by topics.
 * Topics stored as JSONB array: [{title, content, sources[]}]
 */
export const summaries = pgTable(
  "summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    chatTitle: text("chat_title").notNull(),
    messageCount: integer("message_count").notNull(),
    fromMessageId: bigint("from_message_id", { mode: "bigint" }),
    toMessageId: bigint("to_message_id", { mode: "bigint" }),
    topics: jsonb("topics")
      .$type<{ title: string; content: string; sources: string[] }[]>()
      .notNull(),
    oneliner: text("oneliner").notNull(),
    triggerType: text("trigger_type"),
    triggerKey: text("trigger_key"),
    notificationSentAt: timestamp("notification_sent_at", {
      withTimezone: true,
    }),
    notificationClaimedAt: timestamp("notification_claimed_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Find latest summary per community (ORDER BY created_at DESC LIMIT 1)
    index("summaries_community_created_idx").on(
      table.communityId,
      table.createdAt
    ),
    uniqueIndex("summaries_community_trigger_key_uidx")
      .on(table.communityId, table.triggerKey)
      .where(sql`${table.triggerKey} IS NOT NULL`),
    index("summaries_trigger_key_idx").on(table.triggerKey),
    index("summaries_notification_sent_idx").on(
      table.triggerKey,
      table.notificationSentAt
    ),
  ]
);

/**
 * User votes for summaries.
 * A user can vote only once per summary.
 */
export const summaryVotes = pgTable(
  "summary_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    summaryId: uuid("summary_id")
      .notNull()
      .references(() => summaries.id, { onDelete: "cascade" }),
    action: text("action").$type<SummaryVoteAction>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("summary_votes_summary_user_uidx").on(
      table.summaryId,
      table.userId
    ),
    index("summary_votes_summary_action_idx").on(table.summaryId, table.action),
    check(
      "summary_votes_action_check",
      sql`${table.action} IN ('LIKE', 'DISLIKE')`
    ),
  ]
);

/**
 * Queue of helper bot messages scheduled for delayed deletion.
 * Entries are consumed by a minutely cron worker.
 */
export const telegramHelperMessageCleanup = pgTable(
  "telegram_helper_message_cleanup",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: bigint("chat_id", { mode: "bigint" }).notNull(),
    messageId: integer("message_id").notNull(),
    deleteAfter: timestamp("delete_after", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("telegram_helper_message_cleanup_delete_after_idx").on(
      table.deleteAfter
    ),
    uniqueIndex("telegram_helper_message_cleanup_chat_message_uidx").on(
      table.chatId,
      table.messageId
    ),
  ]
);

/**
 * Telegram Business connections - tracks bot connections to user business accounts.
 * One connection per user; soft-deleted by setting isEnabled to false.
 */
export const businessConnections = pgTable(
  "business_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessConnectionId: text("business_connection_id").notNull(),
    userChatId: bigint("user_chat_id", { mode: "bigint" }).notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    rights: jsonb("rights").$type<BusinessBotRights>().default({}).notNull(),
    connectedAt: timestamp("connected_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // One business connection per user
    uniqueIndex("business_connections_user_id_idx").on(table.userId),
    // Filter by active/inactive connections
    index("business_connections_is_enabled_idx").on(table.isEnabled),
  ]
);

/**
 * Bot conversation threads - represents a conversation session between user and bot.
 * Supports Telegram's threaded messages via message_thread_id.
 */
export const botThreads = pgTable(
  "bot_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    telegramChatId: bigint("telegram_chat_id", { mode: "bigint" }).notNull(),
    telegramThreadId: integer("telegram_thread_id"), // Telegram's message_thread_id
    title: text("title"),
    status: text("status").$type<ThreadStatus>().default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Primary query: find user's threads
    index("bot_threads_user_id_idx").on(table.userId),
    // Unique thread per telegram chat + thread combination
    uniqueIndex("bot_threads_telegram_unique_idx").on(
      table.telegramChatId,
      table.telegramThreadId
    ),
    // Filter by status
    index("bot_threads_status_idx").on(table.status),
  ]
);

/**
 * Individual messages within bot threads.
 * Content is encrypted as JSONB with type discriminators for extensibility.
 */
export const botMessages = pgTable(
  "bot_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => botThreads.id, { onDelete: "cascade" }),
    senderType: text("sender_type").$type<SenderType>().notNull(),
    encryptedContent: jsonb("encrypted_content")
      .$type<EncryptedMessageContent>()
      .notNull(),
    telegramMessageId: bigint("telegram_message_id", { mode: "bigint" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Primary query: get thread messages in chronological order
    index("bot_messages_thread_created_idx").on(
      table.threadId,
      table.createdAt
    ),
    // Lookup by telegram message ID (for deduplication)
    index("bot_messages_telegram_id_idx").on(table.telegramMessageId),
  ]
);

/**
 * Push notification tokens for mobile app users.
 * Stores Expo push tokens linked to Telegram user IDs.
 */
export const pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    token: text("token").notNull(),
    telegramUserId: bigint("telegram_user_id", { mode: "bigint" }).notNull(),
    platform: text("platform").notNull(), // "ios" | "android"
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("push_tokens_token_unique").on(table.token),
    index("push_tokens_telegram_user_id_idx").on(table.telegramUserId),
  ]
);

// ============================================================================
// RELATIONS (for type-safe queries with Drizzle)
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  messages: many(messages),
  communityMemberships: many(communityMembers),
  businessConnection: one(businessConnections),
  botThreads: many(botThreads),
  summaryVotes: many(summaryVotes),
  userSettings: one(userSettings),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const communitiesRelations = relations(communities, ({ many }) => ({
  members: many(communityMembers),
  messages: many(messages),
  summaries: many(summaries),
}));

export const communityMembersRelations = relations(
  communityMembers,
  ({ one }) => ({
    community: one(communities, {
      fields: [communityMembers.communityId],
      references: [communities.id],
    }),
    user: one(users, {
      fields: [communityMembers.userId],
      references: [users.id],
    }),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  community: one(communities, {
    fields: [messages.communityId],
    references: [communities.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const summariesRelations = relations(summaries, ({ one, many }) => ({
  community: one(communities, {
    fields: [summaries.communityId],
    references: [communities.id],
  }),
  summaryVotes: many(summaryVotes),
}));

export const summaryVotesRelations = relations(summaryVotes, ({ one }) => ({
  summary: one(summaries, {
    fields: [summaryVotes.summaryId],
    references: [summaries.id],
  }),
  user: one(users, {
    fields: [summaryVotes.userId],
    references: [users.id],
  }),
}));

export const businessConnectionsRelations = relations(
  businessConnections,
  ({ one }) => ({
    user: one(users, {
      fields: [businessConnections.userId],
      references: [users.id],
    }),
  })
);

export const botThreadsRelations = relations(botThreads, ({ one, many }) => ({
  user: one(users, {
    fields: [botThreads.userId],
    references: [users.id],
  }),
  messages: many(botMessages),
}));

export const botMessagesRelations = relations(botMessages, ({ one }) => ({
  thread: one(botThreads, {
    fields: [botMessages.threadId],
    references: [botThreads.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

export type Community = typeof communities.$inferSelect;
export type InsertCommunity = typeof communities.$inferInsert;

export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertCommunityMember = typeof communityMembers.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type Summary = typeof summaries.$inferSelect;
export type InsertSummary = typeof summaries.$inferInsert;

export type SummaryVote = typeof summaryVotes.$inferSelect;
export type InsertSummaryVote = typeof summaryVotes.$inferInsert;

export type TelegramHelperMessageCleanup =
  typeof telegramHelperMessageCleanup.$inferSelect;
export type InsertTelegramHelperMessageCleanup =
  typeof telegramHelperMessageCleanup.$inferInsert;

export type BusinessConnection = typeof businessConnections.$inferSelect;
export type InsertBusinessConnection = typeof businessConnections.$inferInsert;

export type BotThread = typeof botThreads.$inferSelect;
export type InsertBotThread = typeof botThreads.$inferInsert;

export type BotMessage = typeof botMessages.$inferSelect;
export type InsertBotMessage = typeof botMessages.$inferInsert;

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

export type Topic = { title: string; content: string; sources: string[] };
