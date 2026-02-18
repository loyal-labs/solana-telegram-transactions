import { neon } from "@neondatabase/serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/neon-http";

import { serverEnv } from "./config/server";
import * as schema from "./schema";

let db: NeonHttpDatabase<typeof schema> | null = null;

export const getDatabase = (): NeonHttpDatabase<typeof schema> => {
  const databaseUrl = serverEnv.databaseUrl;

  if (db) return db;

  const sql = neon(databaseUrl);
  db = drizzle({ client: sql, schema });
  return db;
};
