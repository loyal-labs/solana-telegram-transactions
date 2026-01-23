import { neon } from "@neondatabase/serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/neon-http";

let db: NeonHttpDatabase | null = null;

export const getDatabase = (): NeonHttpDatabase => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  if (db) return db;

  const sql = neon(databaseUrl);
  db = drizzle({ client: sql });
  return db;
};
