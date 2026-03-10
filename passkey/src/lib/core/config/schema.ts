import { z } from "zod";

import type { PasskeyServerConfig } from "@/lib/core/config/types";

const hostnameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(
    (value) =>
      value.length > 0 &&
      !value.includes("://") &&
      !value.includes("/") &&
      !value.includes(":") &&
      value !== "localhost" &&
      /^[a-z0-9.-]+$/.test(value),
    "Must be a bare parent domain hostname"
  );

const serverConfigSchema = z.object({
  PASSKEY_GRID_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  PASSKEY_ALLOWED_PARENT_DOMAIN: hostnameSchema,
  PASSKEY_ALLOW_LOCALHOST: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  NEXT_PUBLIC_PASSKEY_RP_ID: hostnameSchema,
  PASSKEY_GRID_API_BASE_URL: z
    .string()
    .url()
    .default("https://grid.squads.xyz"),
  PASSKEY_APP_NAME: z.string().min(1).default("askloyal"),
  PASSKEY_GRID_API_KEY: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
  if (value.PASSKEY_ALLOWED_PARENT_DOMAIN !== value.NEXT_PUBLIC_PASSKEY_RP_ID) {
    ctx.addIssue({
      code: "custom",
      message:
        "NEXT_PUBLIC_PASSKEY_RP_ID must match PASSKEY_ALLOWED_PARENT_DOMAIN",
      path: ["NEXT_PUBLIC_PASSKEY_RP_ID"],
    });
  }
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
    allowedParentDomain: parsed.PASSKEY_ALLOWED_PARENT_DOMAIN,
    allowLocalhost: parsed.PASSKEY_ALLOW_LOCALHOST,
    sharedRpId: parsed.NEXT_PUBLIC_PASSKEY_RP_ID,
    gridApiBaseUrl: trimTrailingSlash(parsed.PASSKEY_GRID_API_BASE_URL),
    appName: parsed.PASSKEY_APP_NAME,
    gridApiKey: parsed.PASSKEY_GRID_API_KEY,
  };
}
