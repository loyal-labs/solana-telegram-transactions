import { neon } from "@neondatabase/serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

let db: NeonHttpDatabase<typeof schema> | null = null;

export const getDatabase = (): NeonHttpDatabase<typeof schema> => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  if (db) return db;

  const sql = neon(databaseUrl);
  db = drizzle({ client: sql, schema });
  return db;
};
