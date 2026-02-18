# Database

Neon PostgreSQL integration using Drizzle ORM.

## Overview

| File                       | Purpose                       |
| -------------------------- | ----------------------------- |
| `src/lib/core/database.ts` | Database connection singleton |
| `src/lib/core/schema.ts`   | Drizzle table definitions     |
| `drizzle.config.ts`        | Migration configuration       |

## Usage

```typescript
import { getDatabase } from "@/lib/core/database";

const db = getDatabase();
const users = await db.select().from(usersTable);
```

## Schema Management

Define tables in `src/lib/core/schema.ts`:

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Migration Commands

Run from `/app` directory:

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `bun db:generate` | Generate migrations from schema changes |
| `bun db:migrate`  | Apply migrations to database            |
| `bun db:studio`   | Open Drizzle Studio GUI                 |

## Environment

Requires `DATABASE_URL` in `.env.local`:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.aws.neon.tech/dbname?sslmode=require
```

See [Environment Variables](./environment-vars.md) for full setup.

## Schema Patterns

### Typed JSONB Columns

Use `.$type<T>()` for type-safe JSONB columns:

```typescript
// Array of objects
topics: jsonb("topics")
  .$type<{ title: string; content: string; sources: string[] }[]>()
  .notNull();

// Discriminated union (for encrypted content)
encryptedContent: jsonb("encrypted_content")
  .$type<EncryptedMessageContent>()
  .notNull();
```

### Relations Setup

Define relations separately from tables for type-safe eager loading:

```typescript
export const usersRelations = relations(users, ({ one, many }) => ({
  messages: many(messages),
  botThreads: many(botThreads),
  businessConnection: one(businessConnections),
}));

// Usage with type-safe `with:`
const user = await db.query.users.findFirst({
  where: eq(users.telegramId, telegramId),
  with: { botThreads: true },
});
```

### Type Exports

Always export both select and insert types:

```typescript
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

### Index Strategies

| Index Type        | Use Case                               | Example                                          |
| ----------------- | -------------------------------------- | ------------------------------------------------ |
| `uniqueIndex`     | Prevent duplicates, enforce uniqueness | `uniqueIndex().on(table.telegramId)`             |
| Composite `index` | Optimize multi-column queries          | `index().on(table.communityId, table.createdAt)` |
| Filter `index`    | Optimize status/flag filtering         | `index().on(table.isActive)`                     |

## Tables Reference

| Table                 | Purpose                                                                                |
| --------------------- | -------------------------------------------------------------------------------------- |
| `admins`              | Global admin whitelist for privileged community actions (activate/deactivate/settings) |
| `users`               | Telegram users who interact with the bot                                               |
| `communities`         | Telegram communities tracked by the bot lifecycle; may be pre-activation/inactive      |
| `communityMembers`    | Many-to-many: users ↔ communities                                                      |
| `messages`            | Chat messages from tracked communities                                                 |
| `summaries`           | AI-generated daily chat summaries with topics                                          |
| `businessConnections` | Telegram Business bot connections to user accounts                                     |
| `botThreads`          | Bot conversation sessions (supports Telegram threaded messages)                        |
| `botMessages`         | Individual encrypted messages within bot threads                                       |
