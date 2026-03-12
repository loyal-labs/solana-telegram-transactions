import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { EmailAuthError } from "@/lib/auth/email/errors";
import { startEmailAuth } from "@/lib/auth/email/service";
import { getServerConfig } from "@/lib/core/config/server";
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
    const response = await startEmailAuth(body);
    return withAuthCorsHeaders(NextResponse.json(response), corsHeaders);
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
            code: "email_auth_start_failed",
            message:
              error instanceof Error
                ? error.message
                : "Failed to start email authentication",
          },
        },
        { status: 500 }
      ),
      getAuthCorsHeaders(request, config)
    );
  }
}
