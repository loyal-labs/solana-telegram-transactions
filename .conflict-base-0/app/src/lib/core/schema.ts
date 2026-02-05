import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
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
// TABLES
// ============================================================================

/**
 * Global admins whitelist - Telegram users who can activate communities.
 * Must be both in this table AND a Telegram group admin to activate.
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
 * Telegram group chats activated for message tracking.
 * Only users in the admins whitelist can activate communities.
 */
export const communities = pgTable(
  "communities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: bigint("chat_id", { mode: "bigint" }).notNull(),
    chatTitle: text("chat_title").notNull(),
    activatedBy: bigint("activated_by", { mode: "bigint" }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
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
  ]
);

// ============================================================================
// RELATIONS (for type-safe queries with Drizzle)
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  communityMemberships: many(communityMembers),
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

export const summariesRelations = relations(summaries, ({ one }) => ({
  community: one(communities, {
    fields: [summaries.communityId],
    references: [communities.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Community = typeof communities.$inferSelect;
export type InsertCommunity = typeof communities.$inferInsert;

export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertCommunityMember = typeof communityMembers.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type Summary = typeof summaries.$inferSelect;
export type InsertSummary = typeof summaries.$inferInsert;

export type Topic = { title: string; content: string; sources: string[] };
