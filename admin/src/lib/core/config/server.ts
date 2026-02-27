import "server-only";

import { getRequiredEnv } from "./shared";

export const serverEnv = {
  get databaseUrl(): string {
    return getRequiredEnv("DATABASE_URL");
  },
} as const;
