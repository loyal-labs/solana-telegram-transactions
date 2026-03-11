import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getServerConfig } from "@/lib/core/config/server";
import { EmailAuthError } from "@/lib/auth/email/errors";
import { createSessionCookieService, EMAIL_AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/email/session-cookie";
import { verifyEmailAuth } from "@/lib/auth/email/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await verifyEmailAuth(body);
    const sessionCookieService = createSessionCookieService({
      getConfig: () => getServerConfig(),
    });
    const nextResponse = NextResponse.json({
      user: response.user,
    });

    nextResponse.cookies.set({
      name: EMAIL_AUTH_SESSION_COOKIE_NAME,
      value: response.sessionToken,
      ...sessionCookieService.createSessionCookieOptions(request),
    });

    return nextResponse;
  } catch (error) {
    if (error instanceof EmailAuthError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details !== undefined ? { details: error.details } : {}),
          },
        },
        { status: error.status }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "Invalid request payload",
            details: error.issues.map((issue) => issue.message),
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_json",
            message: "Request body must be valid JSON",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
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
    );
  }
}
