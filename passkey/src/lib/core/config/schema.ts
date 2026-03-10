import { z } from "zod";

import type { PasskeyServerConfig } from "@/lib/core/config/types";

const serverConfigSchema = z.object({
  PASSKEY_GRID_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  PASSKEY_CUSTOM_DOMAIN_BASE_URL: z.string().url(),
  PASSKEY_GRID_API_BASE_URL: z
    .string()
    .url()
    .default("https://grid.squads.xyz"),
  PASSKEY_APP_NAME: z.string().min(1).default("askloyal"),
  PASSKEY_GRID_API_KEY: z.string().min(1).optional(),
});

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function parsePasskeyServerConfig(
  env: Record<string, string | undefined>
): PasskeyServerConfig {
  const parsed = serverConfigSchema.parse(env);
  return {
    gridEnvironment: parsed.PASSKEY_GRID_ENVIRONMENT,
    customDomainBaseUrl: trimTrailingSlash(parsed.PASSKEY_CUSTOM_DOMAIN_BASE_URL),
    gridApiBaseUrl: trimTrailingSlash(parsed.PASSKEY_GRID_API_BASE_URL),
    appName: parsed.PASSKEY_APP_NAME,
    gridApiKey: parsed.PASSKEY_GRID_API_KEY,
  };
}
