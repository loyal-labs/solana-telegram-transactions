import { pgTable, uniqueIndex, uuid, bigint, text, timestamp, index, check, boolean, jsonb, integer, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const admins = pgTable("admins", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
	username: text(),
	displayName: text("display_name").notNull(),
	addedAt: timestamp("added_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	addedBy: text("added_by"),
	notes: text(),
}, (table) => [
	uniqueIndex("admins_telegram_id_idx").using("btree", table.telegramId.asc().nullsLast().op("int8_ops")),
]);

export const communities = pgTable("communities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	chatId: bigint("chat_id", { mode: "number" }).notNull(),
	chatTitle: text("chat_title").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	activatedBy: bigint("activated_by", { mode: "number" }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	settings: jsonb().default({}).notNull(),
	activatedAt: timestamp("activated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	summaryNotificationsEnabled: boolean("summary_notifications_enabled").default(true).notNull(),
	summaryNotificationTimeHours: integer("summary_notification_time_hours").default(24),
	summaryNotificationMessageCount: integer("summary_notification_message_count"),
	isPublic: boolean("is_public").default(true).notNull(),
}, (table) => [
	uniqueIndex("communities_chat_id_idx").using("btree", table.chatId.asc().nullsLast().op("int8_ops")),
	index("communities_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	check("communities_summary_notification_time_hours_check", sql`(summary_notification_time_hours IS NULL) OR (summary_notification_time_hours = ANY (ARRAY[24, 48]))`),
	check("communities_summary_notification_message_count_check", sql`(summary_notification_message_count IS NULL) OR (summary_notification_message_count = ANY (ARRAY[500, 1000]))`),
]);

export const summaries = pgTable("summaries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	communityId: uuid("community_id").notNull(),
	chatTitle: text("chat_title").notNull(),
	messageCount: integer("message_count").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fromMessageId: bigint("from_message_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	toMessageId: bigint("to_message_id", { mode: "number" }),
	topics: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	oneliner: text().notNull(),
	triggerType: text("trigger_type"),
	triggerKey: text("trigger_key"),
	notificationSentAt: timestamp("notification_sent_at", { withTimezone: true, mode: 'string' }),
	notificationClaimedAt: timestamp("notification_claimed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("summaries_community_created_idx").using("btree", table.communityId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	uniqueIndex("summaries_community_trigger_key_uidx").using("btree", table.communityId.asc().nullsLast().op("uuid_ops"), table.triggerKey.asc().nullsLast().op("text_ops")).where(sql`(trigger_key IS NOT NULL)`),
	index("summaries_notification_sent_idx").using("btree", table.triggerKey.asc().nullsLast().op("timestamptz_ops"), table.notificationSentAt.asc().nullsLast().op("timestamptz_ops")),
	index("summaries_trigger_key_idx").using("btree", table.triggerKey.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "summaries_community_id_communities_id_fk"
		}).onDelete("cascade"),
]);

export const communityMembers = pgTable("community_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	communityId: uuid("community_id").notNull(),
	userId: uuid("user_id").notNull(),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("community_members_unique_idx").using("btree", table.communityId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	index("community_members_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "community_members_community_id_communities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "community_members_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
	username: text(),
	displayName: text("display_name").notNull(),
	avatarUrl: text("avatar_url"),
	settings: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("users_telegram_id_idx").using("btree", table.telegramId.asc().nullsLast().op("int8_ops")),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	communityId: uuid("community_id").notNull(),
	userId: uuid("user_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	telegramMessageId: bigint("telegram_message_id", { mode: "number" }).notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("messages_community_created_idx").using("btree", table.communityId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	uniqueIndex("messages_community_telegram_id_idx").using("btree", table.communityId.asc().nullsLast().op("uuid_ops"), table.telegramMessageId.asc().nullsLast().op("int8_ops")),
	index("messages_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "messages_community_id_communities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "messages_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const businessConnections = pgTable("business_connections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	businessConnectionId: text("business_connection_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userChatId: bigint("user_chat_id", { mode: "number" }).notNull(),
	isEnabled: boolean("is_enabled").default(true).notNull(),
	rights: jsonb().default({}).notNull(),
	connectedAt: timestamp("connected_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("business_connections_is_enabled_idx").using("btree", table.isEnabled.asc().nullsLast().op("bool_ops")),
	uniqueIndex("business_connections_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "business_connections_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const botThreads = pgTable("bot_threads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	telegramChatId: bigint("telegram_chat_id", { mode: "number" }).notNull(),
	telegramThreadId: integer("telegram_thread_id"),
	title: text(),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("bot_threads_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	uniqueIndex("bot_threads_telegram_unique_idx").using("btree", table.telegramChatId.asc().nullsLast().op("int8_ops"), table.telegramThreadId.asc().nullsLast().op("int4_ops")),
	index("bot_threads_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "bot_threads_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const botMessages = pgTable("bot_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: uuid("thread_id").notNull(),
	senderType: text("sender_type").notNull(),
	encryptedContent: jsonb("encrypted_content").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	telegramMessageId: bigint("telegram_message_id", { mode: "number" }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("bot_messages_telegram_id_idx").using("btree", table.telegramMessageId.asc().nullsLast().op("int8_ops")),
	index("bot_messages_thread_created_idx").using("btree", table.threadId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [botThreads.id],
			name: "bot_messages_thread_id_bot_threads_id_fk"
		}).onDelete("cascade"),
]);

export const summaryVotes = pgTable("summary_votes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	summaryId: uuid("summary_id").notNull(),
	action: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("summary_votes_summary_action_idx").using("btree", table.summaryId.asc().nullsLast().op("text_ops"), table.action.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("summary_votes_summary_user_uidx").using("btree", table.summaryId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "summary_votes_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.summaryId],
			foreignColumns: [summaries.id],
			name: "summary_votes_summary_id_summaries_id_fk"
		}).onDelete("cascade"),
	check("summary_votes_action_check", sql`action = ANY (ARRAY['LIKE'::text, 'DISLIKE'::text])`),
]);
