import "server-only";

import {
  buildAuthUrl,
  extractApiErrorMessage,
  getAuthSessionResponseSchema,
} from "@loyal-labs/auth-core";
import type { AuthSessionUser } from "@loyal-labs/auth-core";

import { getServerEnv } from "@/lib/core/config/server";

export type AuthenticatedPrincipal = {
  provider: "solana";
  authMethod: "wallet";
  subjectAddress: string;
  walletAddress: string;
  gridUserId: string | null;
  smartAccountAddress: string | null;
};

type AuthGatewayErrorCode =
  | "unsupported_auth_method"
  | "invalid_wallet_principal";

export class AuthGatewayError extends Error {
  readonly code: AuthGatewayErrorCode;
  readonly status: number;

  constructor(args: {
    code: AuthGatewayErrorCode;
    message: string;
    status?: number;
  }) {
    super(args.message);
    this.name = "AuthGatewayError";
    this.code = args.code;
    this.status = args.status ?? 403;
  }
}

type AuthSessionResolverDependencies = {
  authBaseUrl?: string;
  fetchFn?: typeof fetch;
};

function getRequiredAuthBaseUrl(authBaseUrl: string | undefined): string {
  if (!authBaseUrl) {
    throw new Error("NEXT_PUBLIC_GRID_AUTH_BASE_URL is not set");
  }

  return authBaseUrl;
}

export function isAuthGatewayError(error: unknown): error is AuthGatewayError {
  return (
    error instanceof AuthGatewayError ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "status" in error &&
      typeof (error as { code?: unknown }).code === "string" &&
      typeof (error as { status?: unknown }).status === "number")
  );
}

export function mapAuthSessionUserToAuthenticatedPrincipal(
  session: AuthSessionUser
): AuthenticatedPrincipal {
  if (session.authMethod !== "wallet") {
    throw new AuthGatewayError({
      code: "unsupported_auth_method",
      message: "Wallet authentication is required to use chat.",
    });
  }

  if (session.provider && session.provider !== "solana") {
    throw new AuthGatewayError({
      code: "unsupported_auth_method",
      message: "Only Solana wallet sessions can use chat.",
    });
  }

  if (!session.walletAddress) {
    throw new AuthGatewayError({
      code: "invalid_wallet_principal",
      message: "Wallet sessions must include a verified wallet address.",
    });
  }

  if (session.subjectAddress !== session.walletAddress) {
    throw new AuthGatewayError({
      code: "invalid_wallet_principal",
      message:
        "Wallet sessions must use the same subject and wallet address for chat.",
    });
  }

  return {
    provider: "solana",
    authMethod: "wallet",
    subjectAddress: session.walletAddress,
    walletAddress: session.walletAddress,
    gridUserId: session.gridUserId ?? null,
    smartAccountAddress: session.smartAccountAddress ?? null,
  };
}

export async function resolveAuthenticatedPrincipalFromRequest(
  request: Request,
  dependencies: AuthSessionResolverDependencies = {}
): Promise<AuthenticatedPrincipal | null> {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return null;
  }

  const authBaseUrl = getRequiredAuthBaseUrl(
    dependencies.authBaseUrl ?? getServerEnv().gridAuthBaseUrl
  );
  const fetchFn = dependencies.fetchFn ?? fetch;
  const response = await fetchFn(buildAuthUrl(authBaseUrl, "/api/auth/session"), {
    method: "GET",
    headers: {
      cookie,
      ...(request.headers.get("origin")
        ? { origin: request.headers.get("origin") as string }
        : {}),
    },
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to resolve auth session: ${extractApiErrorMessage(payload)}`
    );
  }

  const parsed = getAuthSessionResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Auth session response was invalid");
  }

  return mapAuthSessionUserToAuthenticatedPrincipal(parsed.data.user);
}
