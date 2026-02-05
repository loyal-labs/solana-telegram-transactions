# Database

Neon PostgreSQL integration using Drizzle ORM.

## Overview

| File | Purpose |
|------|---------|
| `src/lib/core/database.ts` | Database connection singleton |
| `src/lib/core/schema.ts` | Drizzle table definitions |
| `drizzle.config.ts` | Migration configuration |

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

| Command | Description |
|---------|-------------|
| `bun db:generate` | Generate migrations from schema changes |
| `bun db:migrate` | Apply migrations to database |
| `bun db:studio` | Open Drizzle Studio GUI |

## Environment

Requires `DATABASE_URL` in `.env.local`:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.aws.neon.tech/dbname?sslmode=require
```

See [Environment Variables](./environment-vars.md) for full setup.
