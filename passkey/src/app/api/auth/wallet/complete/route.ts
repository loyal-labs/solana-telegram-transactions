import { NextResponse } from "next/server";

import { handleAuthJsonPost, handleAuthOptions } from "@/lib/auth/route-handler";
import {
  AUTH_SESSION_COOKIE_NAME,
  createAuthSessionCookieService,
} from "@/lib/auth/session-cookie";
import { completeWalletAuth } from "@/lib/auth/wallet-service";
import { WalletAuthError } from "@/lib/auth/wallet-errors";

export function OPTIONS(request: Request) {
  return handleAuthOptions(request);
}

export async function POST(request: Request) {
  return handleAuthJsonPost(request, {
    execute: async (body, { config }) => {
      const response = await completeWalletAuth(body, {
        requestOrigin:
          request.headers.get("origin") ?? new URL(request.url).origin,
      });
      const sessionCookieService = createAuthSessionCookieService({
        getConfig: () => config,
      });
      const nextResponse = NextResponse.json({
        user: response.user,
      });

      nextResponse.cookies.set({
        name: AUTH_SESSION_COOKIE_NAME,
        value: response.sessionToken,
        ...sessionCookieService.createSessionCookieOptions(request),
      });

      return nextResponse;
    },
    mapKnownError: (error) =>
      error instanceof WalletAuthError
        ? {
            code: error.code,
            status: error.status,
            message: error.message,
            details: error.details,
          }
        : null,
    defaultError: {
      code: "wallet_auth_failed",
      message: "Failed to verify wallet ownership",
    },
  });
}
