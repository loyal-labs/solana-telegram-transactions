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
  GRID_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  GRID_ALLOWED_PARENT_DOMAIN: hostnameSchema,
  GRID_ALLOW_LOCALHOST: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  GRID_RP_ID: hostnameSchema,
  GRID_API_BASE_URL: z
    .string()
    .url()
    .default("https://grid.squads.xyz"),
  GRID_APP_NAME: z.string().min(1).default("askloyal"),
  GRID_API_KEY: z.string().min(1).optional(),
  AUTH_JWT_SECRET: z.string().min(32),
  AUTH_JWT_RS256_PRIVATE_KEY: z.string().min(1).optional(),
  AUTH_JWT_RS256_PUBLIC_KEY: z.string().min(1).optional(),
  AUTH_JWT_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
}).superRefine((value, ctx) => {
  if (value.GRID_ALLOWED_PARENT_DOMAIN !== value.GRID_RP_ID) {
    ctx.addIssue({
      code: "custom",
      message: "GRID_RP_ID must match GRID_ALLOWED_PARENT_DOMAIN",
      path: ["GRID_RP_ID"],
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
    gridEnvironment: parsed.GRID_ENVIRONMENT,
    allowedParentDomain: parsed.GRID_ALLOWED_PARENT_DOMAIN,
    allowLocalhost: parsed.GRID_ALLOW_LOCALHOST,
    rpId: parsed.GRID_RP_ID,
    gridApiBaseUrl: trimTrailingSlash(parsed.GRID_API_BASE_URL),
    appName: parsed.GRID_APP_NAME,
    gridApiKey: parsed.GRID_API_KEY,
    authJwtSecret: parsed.AUTH_JWT_SECRET,
    authRs256PrivateKey: parsed.AUTH_JWT_RS256_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    authRs256PublicKey: parsed.AUTH_JWT_RS256_PUBLIC_KEY?.replace(/\\n/g, "\n"),
    authJwtTtlSeconds: parsed.AUTH_JWT_TTL_SECONDS,
  };
}
