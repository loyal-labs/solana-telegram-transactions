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

export const emailAuthModeSchema = z.enum(["create", "auth"]);

export const sessionKeyBackendSchema = z.object({
  key: z.array(z.number().int().min(0).max(255)),
  expiration: z.number().int().positive(),
});

export const startEmailAuthRequestSchema = z.object({
  email: z.string().trim().email(),
  turnstileToken: z.string().trim().min(1).optional(),
});

export const startEmailAuthResponseSchema = z.object({
  authTicketId: z.string().uuid(),
  expiresAt: z.string().datetime(),
  maskedEmail: z.string().min(1),
});

export const authMethodSchema = z.enum(["email", "passkey"]);

export const emailAuthUserSchema = z.object({
  email: z.string().trim().email(),
  gridUserId: z.string().min(1),
  accountAddress: z.string().min(1),
  provider: z.string().min(1).optional(),
});

export const authSessionUserSchema = z.object({
  authMethod: authMethodSchema,
  accountAddress: z.string().min(1),
  email: z.string().trim().email().optional(),
  gridUserId: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  passkeyAccount: z.string().min(1).optional(),
  sessionKey: sessionKeySchema.optional(),
});

export const verifyEmailAuthRequestSchema = z.object({
  authTicketId: z.string().uuid(),
  otpCode: z.string().trim().min(1).max(12),
});

export const verifyEmailAuthResponseSchema = z.object({
  user: authSessionUserSchema,
});

export const getAuthSessionResponseSchema = z.object({
  user: authSessionUserSchema,
});

export const getEmailAuthSessionResponseSchema = getAuthSessionResponseSchema;

export const startPasskeySessionResponseSchema = z.object({
  url: z.string().url(),
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
  startEmailAuth: "/api/auth/email/start",
  verifyEmailAuth: "/api/auth/email/verify",
  getAuthSession: "/api/auth/session",
  getEmailAuthSession: "/api/auth/session",
  logoutAuthSession: "/api/auth/logout",
  logoutEmailAuth: "/api/auth/logout",
  startPasskeyRegistration: "/api/passkeys/session/create",
  startPasskeySignIn: "/api/passkeys/session/authorize",
  getPasskeyAccount: (passkeyAddress: string) =>
    `/api/passkeys/account/${passkeyAddress}`,
} as const;

export const embeddedPasskeyMessageTypeSchema = z.enum([
  "authz_complete",
  "authz_error",
]);

export const embeddedPasskeySuccessMessageSchema = z.object({
  type: z.literal("authz_complete"),
});

export const embeddedPasskeyErrorMessageSchema = z.object({
  type: z.literal("authz_error"),
  message: z.string().min(1),
  details: z.array(z.string()).default([]),
  challengeExpired: z.boolean().optional(),
});

export const embeddedPasskeyMessageSchema = z.union([
  embeddedPasskeySuccessMessageSchema,
  embeddedPasskeyErrorMessageSchema,
]);

export type StartEmailAuthRequest = z.infer<typeof startEmailAuthRequestSchema>;
export type StartEmailAuthResponse = z.infer<typeof startEmailAuthResponseSchema>;
export type AuthMethod = z.infer<typeof authMethodSchema>;
export type EmailAuthMode = z.infer<typeof emailAuthModeSchema>;
export type EmailAuthUser = z.infer<typeof emailAuthUserSchema>;
export type AuthSessionUser = z.infer<typeof authSessionUserSchema>;
export type VerifyEmailAuthRequest = z.infer<typeof verifyEmailAuthRequestSchema>;
export type VerifyEmailAuthResponse = z.infer<typeof verifyEmailAuthResponseSchema>;
export type GetAuthSessionResponse = z.infer<typeof getAuthSessionResponseSchema>;
export type GetEmailAuthSessionResponse = GetAuthSessionResponse;
export type StartPasskeyRegistrationRequest = z.infer<
  typeof startPasskeyRegistrationRequestSchema
>;
export type StartPasskeySignInRequest = z.infer<
  typeof startPasskeySignInRequestSchema
>;
export type StartPasskeySessionResponse = z.infer<
  typeof startPasskeySessionResponseSchema
>;
export type SubmitSessionRequest = z.infer<typeof submitSessionRequestSchema>;
export type CreateAccountRequest = z.infer<typeof createAccountRequestSchema>;
export type FindAccountRequest = z.infer<typeof findAccountRequestSchema>;
export type EmbeddedPasskeyMessage = z.infer<
  typeof embeddedPasskeyMessageSchema
>;
