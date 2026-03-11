import { z } from "zod";

import { getGridBrowserSdkClient } from "@/lib/passkeys/grid-browser-sdk";

type QueryLike = {
  get(name: string): string | null;
};

const baseQuerySchema = z.object({
  challenge: z.string().min(1),
  slotNumber: z.coerce.number().int().nonnegative(),
  sessionKey: z.string().min(1),
  expirationInSeconds: z.coerce.number().int().positive(),
  env: z
    .enum(["sandbox", "production", "devnet", "mainnet", "testnet"])
    .optional(),
  redirectUrl: z.string().url().optional(),
});

const createQuerySchema = baseQuerySchema.extend({
  appName: z.string().min(1),
  userId: z.string().min(1),
});

const authQuerySchema = baseQuerySchema;

export type ParsedCreatePasskeyQuery = z.infer<typeof createQuerySchema>;
export type ParsedAuthPasskeyQuery = z.infer<typeof authQuerySchema>;

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

function collectIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".") || "query";
    return `${path}: ${issue.message}`;
  });
}

function mapBaseQuery(query: QueryLike) {
  const optional = (value: string | null | undefined): string | undefined =>
    value == null ? undefined : value;

  const extracted = getGridBrowserSdkClient().extractPasskeyAuthParams(
    query as URLSearchParams
  );

  return {
    challenge: optional(extracted.challenge),
    slotNumber: optional(extracted.slotNumber),
    sessionKey: optional(extracted.sessionKey),
    expirationInSeconds: optional(extracted.expirationInSeconds),
    env: optional(extracted.env),
    redirectUrl: optional(extracted.redirectUrl),
  };
}

export function parseCreatePasskeyQuery(
  query: QueryLike
): ParseResult<ParsedCreatePasskeyQuery> {
  const optional = (value: string | null | undefined): string | undefined =>
    value == null ? undefined : value;
  const extracted = getGridBrowserSdkClient().extractPasskeyCreateParams(
    query as URLSearchParams
  );
  const mapped = {
    ...mapBaseQuery(query),
    appName: optional(extracted.appName),
    userId: optional(extracted.userId),
  };

  const parsed = createQuerySchema.safeParse(mapped);
  if (!parsed.success) {
    return { ok: false, errors: collectIssues(parsed.error) };
  }

  return { ok: true, data: parsed.data };
}

export function parseAuthPasskeyQuery(
  query: QueryLike
): ParseResult<ParsedAuthPasskeyQuery> {
  const parsed = authQuerySchema.safeParse(mapBaseQuery(query));
  if (!parsed.success) {
    return { ok: false, errors: collectIssues(parsed.error) };
  }

  return { ok: true, data: parsed.data };
}
