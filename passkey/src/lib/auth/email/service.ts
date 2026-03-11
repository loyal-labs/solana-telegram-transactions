import {
  startEmailAuthRequestSchema,
  type StartEmailAuthRequest,
  type StartEmailAuthResponse,
  verifyEmailAuthRequestSchema,
  type VerifyEmailAuthRequest,
} from "@loyal-labs/grid-core";
import type { EmailAuthUser } from "@loyal-labs/grid-core";

import { getServerConfig } from "@/lib/core/config/server";

import {
  EmailAuthError,
} from "./errors";
import {
  getGridEmailAuthAdapter,
  type GridEmailAuthAdapter,
} from "./grid-email-auth-adapter";
import {
  getPendingAuthStore,
  type PendingAuthStore,
} from "./pending-auth-store";
import {
  createSessionCookieService,
  type SessionCookieService,
} from "./session-cookie";

type EmailAuthDependencies = {
  getPendingAuthStore: () => PendingAuthStore;
  getGridEmailAuthAdapter: () => GridEmailAuthAdapter;
  getSessionCookieService: () => SessionCookieService;
};

const defaultDependencies: EmailAuthDependencies = {
  getPendingAuthStore: () => getPendingAuthStore(),
  getGridEmailAuthAdapter: () => getGridEmailAuthAdapter(),
  getSessionCookieService: () =>
    createSessionCookieService({
      getConfig: () => getServerConfig(),
    }),
};

function maskEmail(email: string): string {
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) {
    return email;
  }

  if (localPart.length === 1) {
    return `*@${domainPart}`;
  }

  return `${localPart[0]}${"*".repeat(Math.max(localPart.length - 1, 1))}@${domainPart}`;
}

export async function startEmailAuth(
  input: StartEmailAuthRequest,
  dependencies: EmailAuthDependencies = defaultDependencies
): Promise<StartEmailAuthResponse> {
  const payload = startEmailAuthRequestSchema.parse(input);
  const store = dependencies.getPendingAuthStore();
  const adapter = dependencies.getGridEmailAuthAdapter();

  await store.cleanupExpired();

  const started = await adapter.beginEmailAuth(payload.email);
  const pendingAuth = await store.createPendingAuth({
    email: started.email,
    mode: started.mode,
    provider: started.provider,
    otpId: started.otpId,
    sessionSecrets: started.sessionSecrets,
    expiresAt: started.expiresAt,
  });

  return {
    authTicketId: pendingAuth.authTicketId,
    expiresAt: pendingAuth.expiresAt,
    maskedEmail: maskEmail(pendingAuth.email),
  };
}

export async function verifyEmailAuth(
  input: VerifyEmailAuthRequest,
  dependencies: EmailAuthDependencies = defaultDependencies
): Promise<{
  user: EmailAuthUser;
  sessionToken: string;
}> {
  const payload = verifyEmailAuthRequestSchema.parse(input);
  const store = dependencies.getPendingAuthStore();
  const adapter = dependencies.getGridEmailAuthAdapter();
  const sessionCookieService = dependencies.getSessionCookieService();

  await store.cleanupExpired();

  const pendingAuth = await store.getPendingAuth(payload.authTicketId);
  if (!pendingAuth) {
    throw new EmailAuthError("Authentication request expired. Please start again.", {
      code: "invalid_auth_ticket",
      status: 401,
    });
  }

  const user = await adapter.completeEmailAuth(pendingAuth, payload.otpCode);
  await store.consumePendingAuth(payload.authTicketId);
  const sessionToken = await sessionCookieService.issueSessionToken(user);

  return {
    user,
    sessionToken,
  };
}
