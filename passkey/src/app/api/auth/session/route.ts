import { NextResponse } from "next/server";

import { getServerConfig } from "@/lib/core/config/server";
import { createSessionCookieService } from "@/lib/auth/email/session-cookie";
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

export async function GET(request: Request) {
  const config = getServerConfig();

  try {
    const corsHeaders = getAuthCorsHeaders(request, config);
    const sessionCookieService = createSessionCookieService({
      getConfig: () => config,
    });
    const user = await sessionCookieService.readSessionFromRequest(request);

    if (!user) {
      return withAuthCorsHeaders(
        NextResponse.json(
          {
            error: {
              code: "unauthenticated",
              message: "No active auth session.",
            },
          },
          { status: 401 }
        ),
        corsHeaders
      );
    }

    return withAuthCorsHeaders(NextResponse.json({ user }), corsHeaders);
  } catch (error) {
    if (error instanceof AuthCorsError) {
      return createForbiddenOriginResponse();
    }

    throw error;
  }
}
