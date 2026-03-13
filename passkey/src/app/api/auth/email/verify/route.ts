import { NextResponse } from "next/server";

import { EmailAuthError } from "@/lib/auth/email/errors";
import {
  AUTH_SESSION_COOKIE_NAME,
  createAuthSessionCookieService,
} from "@/lib/auth/session-cookie";
import { verifyEmailAuth } from "@/lib/auth/email/service";
import { handleAuthJsonPost, handleAuthOptions } from "@/lib/auth/route-handler";

export function OPTIONS(request: Request) {
  return handleAuthOptions(request);
}

export async function POST(request: Request) {
  return handleAuthJsonPost(request, {
    execute: async (body, { config }) => {
      const response = await verifyEmailAuth(body);
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
      error instanceof EmailAuthError
        ? {
            code: error.code,
            status: error.status,
            message: error.message,
            details: error.details,
          }
        : null,
    defaultError: {
      code: "email_auth_verify_failed",
      message: "Failed to verify email authentication",
    },
  });
}
