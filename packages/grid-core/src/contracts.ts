import { z } from "zod";

export const gridEnvironmentSchema = z.enum(["sandbox", "production"]);
export const sessionEnvironmentSchema = z.enum([
  "sandbox",
  "production",
  "devnet",
  "mainnet",
  "testnet",
]);

export const sessionKeySchema = z.object({
  key: z.unknown(),
  expiration: z.number().int().positive(),
});

export const sessionKeyBackendSchema = z.object({
  key: z.array(z.number().int().min(0).max(255)),
  expiration: z.number().int().positive(),
});

export const startPasskeyRegistrationRequestSchema = z
  .object({
    sessionKey: sessionKeySchema,
    env: sessionEnvironmentSchema,
    metaInfo: z.record(z.string(), z.unknown()).default({}),
  })
  .passthrough();

export const startPasskeySignInRequestSchema = z
  .object({
    sessionKey: sessionKeySchema.optional(),
    metaInfo: z
      .object({
        appName: z.string().min(1),
        redirectUrl: z.string().url().optional(),
      })
      .passthrough(),
    baseUrl: z.string().url().optional(),
    accountAddress: z.string().optional(),
  })
  .passthrough();

export const submitSessionRequestSchema = z
  .object({
    ceremonyType: z.enum(["create", "auth"]),
    sessionKey: sessionKeyBackendSchema,
    slotNumber: z.coerce.number().int().nonnegative(),
    authenticatorResponse: z.unknown(),
  })
  .passthrough();

export const createAccountRequestSchema = z
  .object({
    sessionKey: sessionKeySchema,
    slotNumber: z.coerce.number().int().nonnegative(),
    authenticatorResponse: z.unknown(),
    adminAddress: z.string().optional(),
    memo: z.string().optional(),
  })
  .passthrough();

export const findAccountRequestSchema = z
  .object({
    sessionKey: sessionKeySchema,
    authenticatorResponse: z.unknown(),
  })
  .passthrough();

export const passkeyAccountParamSchema = z.object({
  passkeyAddress: z.string().min(1),
});

export const gridPasskeyUpstreamApiPaths = {
  createSession: "/passkeys",
  authorizeSession: "/passkeys/auth",
  submitSession: "/passkeys/submit",
  createAccount: "/passkeys/account",
  getAccount: (passkeyAddress: string) => `/passkeys/account/${passkeyAddress}`,
  findAccount: "/passkeys/find",
} as const;

export const gridAuthRoutePaths = {
  startPasskeyRegistration: "/api/passkeys/session/create",
  startPasskeySignIn: "/api/passkeys/session/authorize",
  getPasskeyAccount: (passkeyAddress: string) =>
    `/api/passkeys/account/${passkeyAddress}`,
} as const;

export type StartPasskeyRegistrationRequest = z.infer<
  typeof startPasskeyRegistrationRequestSchema
>;
export type StartPasskeySignInRequest = z.infer<
  typeof startPasskeySignInRequestSchema
>;
export type SubmitSessionRequest = z.infer<typeof submitSessionRequestSchema>;
export type CreateAccountRequest = z.infer<typeof createAccountRequestSchema>;
export type FindAccountRequest = z.infer<typeof findAccountRequestSchema>;
