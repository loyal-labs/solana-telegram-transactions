-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" bigint NOT NULL,
	"username" text,
	"display_name" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"added_by" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" bigint NOT NULL,
	"chat_title" text NOT NULL,
	"activated_by" bigint NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"summary_notifications_enabled" boolean DEFAULT true NOT NULL,
	"summary_notification_time_hours" integer DEFAULT 24,
	"summary_notification_message_count" integer,
	"is_public" boolean DEFAULT true NOT NULL,
	CONSTRAINT "communities_summary_notification_time_hours_check" CHECK ((summary_notification_time_hours IS NULL) OR (summary_notification_time_hours = ANY (ARRAY[24, 48]))),
	CONSTRAINT "communities_summary_notification_message_count_check" CHECK ((summary_notification_message_count IS NULL) OR (summary_notification_message_count = ANY (ARRAY[500, 1000])))
);
--> statement-breakpoint
CREATE TABLE "summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"chat_title" text NOT NULL,
	"message_count" integer NOT NULL,
	"from_message_id" bigint,
	"to_message_id" bigint,
	"topics" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"oneliner" text NOT NULL,
	"trigger_type" text,
	"trigger_key" text,
	"notification_sent_at" timestamp with time zone,
	"notification_claimed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "community_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" bigint NOT NULL,
	"username" text,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"telegram_message_id" bigint NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_connection_id" text NOT NULL,
	"user_chat_id" bigint NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"rights" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"connected_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"telegram_chat_id" bigint NOT NULL,
	"telegram_thread_id" integer,
	"title" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_type" text NOT NULL,
	"encrypted_content" jsonb NOT NULL,
	"telegram_message_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summary_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"summary_id" uuid NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "summary_votes_action_check" CHECK (action = ANY (ARRAY['LIKE'::text, 'DISLIKE'::text]))
);
--> statement-breakpoint
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_connections" ADD CONSTRAINT "business_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_threads" ADD CONSTRAINT "bot_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_messages" ADD CONSTRAINT "bot_messages_thread_id_bot_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."bot_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summary_votes" ADD CONSTRAINT "summary_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summary_votes" ADD CONSTRAINT "summary_votes_summary_id_summaries_id_fk" FOREIGN KEY ("summary_id") REFERENCES "public"."summaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admins_telegram_id_idx" ON "admins" USING btree ("telegram_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "communities_chat_id_idx" ON "communities" USING btree ("chat_id" int8_ops);--> statement-breakpoint
CREATE INDEX "communities_is_active_idx" ON "communities" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "summaries_community_created_idx" ON "summaries" USING btree ("community_id" timestamptz_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "summaries_community_trigger_key_uidx" ON "summaries" USING btree ("community_id" uuid_ops,"trigger_key" text_ops) WHERE (trigger_key IS NOT NULL);--> statement-breakpoint
CREATE INDEX "summaries_notification_sent_idx" ON "summaries" USING btree ("trigger_key" timestamptz_ops,"notification_sent_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "summaries_trigger_key_idx" ON "summaries" USING btree ("trigger_key" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "community_members_unique_idx" ON "community_members" USING btree ("community_id" uuid_ops,"user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "community_members_user_id_idx" ON "community_members" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "users_telegram_id_idx" ON "users" USING btree ("telegram_id" int8_ops);--> statement-breakpoint
CREATE INDEX "messages_community_created_idx" ON "messages" USING btree ("community_id" timestamptz_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "messages_community_telegram_id_idx" ON "messages" USING btree ("community_id" uuid_ops,"telegram_message_id" int8_ops);--> statement-breakpoint
CREATE INDEX "messages_user_id_idx" ON "messages" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "business_connections_is_enabled_idx" ON "business_connections" USING btree ("is_enabled" bool_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "business_connections_user_id_idx" ON "business_connections" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "bot_threads_status_idx" ON "bot_threads" USING btree ("status" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "bot_threads_telegram_unique_idx" ON "bot_threads" USING btree ("telegram_chat_id" int8_ops,"telegram_thread_id" int4_ops);--> statement-breakpoint
CREATE INDEX "bot_threads_user_id_idx" ON "bot_threads" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "bot_messages_telegram_id_idx" ON "bot_messages" USING btree ("telegram_message_id" int8_ops);--> statement-breakpoint
CREATE INDEX "bot_messages_thread_created_idx" ON "bot_messages" USING btree ("thread_id" timestamptz_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "summary_votes_summary_action_idx" ON "summary_votes" USING btree ("summary_id" text_ops,"action" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "summary_votes_summary_user_uidx" ON "summary_votes" USING btree ("summary_id" uuid_ops,"user_id" uuid_ops);
*/