import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getServerConfig } from "@/lib/core/config/server";
import { EmailAuthError } from "@/lib/auth/email/errors";
import {
  AUTH_SESSION_COOKIE_NAME,
  createAuthSessionCookieService,
} from "@/lib/auth/session-cookie";
import { verifyEmailAuth } from "@/lib/auth/email/service";
import {
  AuthCorsError,
  createAuthCorsPreflightResponse,
  createForbiddenOriginResponse,
  getAuthCorsHeaders,
  withAuthCorsHeaders,
} from "@/lib/auth/cors";

export function OPTIONS(request: Request) {
  try {
    return createAuthCorsPreflightResponse(request, getServerConfig());
  } catch (error) {
    if (error instanceof AuthCorsError) {
      return createForbiddenOriginResponse();
    }

    throw error;
  }
}

export async function POST(request: Request) {
  const config = getServerConfig();

  try {
    const corsHeaders = getAuthCorsHeaders(request, config);
    const body = await request.json();
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

    return withAuthCorsHeaders(nextResponse, corsHeaders);
  } catch (error) {
    if (error instanceof AuthCorsError) {
      return createForbiddenOriginResponse();
    }

    if (error instanceof EmailAuthError) {
      return withAuthCorsHeaders(
        NextResponse.json(
          {
            error: {
              code: error.code,
              message: error.message,
              ...(error.details !== undefined ? { details: error.details } : {}),
            },
          },
          { status: error.status }
        ),
        getAuthCorsHeaders(request, config)
      );
    }

    if (error instanceof ZodError) {
      return withAuthCorsHeaders(
        NextResponse.json(
          {
            error: {
              code: "invalid_request",
              message: "Invalid request payload",
              details: error.issues.map((issue) => issue.message),
            },
          },
          { status: 400 }
        ),
        getAuthCorsHeaders(request, config)
      );
    }

    if (error instanceof SyntaxError) {
      return withAuthCorsHeaders(
        NextResponse.json(
          {
            error: {
              code: "invalid_json",
              message: "Request body must be valid JSON",
            },
          },
          { status: 400 }
        ),
        getAuthCorsHeaders(request, config)
      );
    }

    return withAuthCorsHeaders(
      NextResponse.json(
        {
          error: {
            code: "email_auth_verify_failed",
            message:
              error instanceof Error
                ? error.message
                : "Failed to verify email authentication",
          },
        },
        { status: 500 }
      ),
      getAuthCorsHeaders(request, config)
    );
  }
}
