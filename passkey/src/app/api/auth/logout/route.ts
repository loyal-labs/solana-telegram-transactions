import { NextResponse } from "next/server";

import { getServerConfig } from "@/lib/core/config/server";
import {
  createSessionCookieService,
  EMAIL_AUTH_SESSION_COOKIE_NAME,
} from "@/lib/auth/email/session-cookie";
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
    const sessionCookieService = createSessionCookieService({
      getConfig: () => config,
    });
    const response = new NextResponse(null, { status: 204 });

    response.cookies.set({
      name: EMAIL_AUTH_SESSION_COOKIE_NAME,
      value: "",
      ...sessionCookieService.createClearedSessionCookieOptions(request),
    });

    return withAuthCorsHeaders(response, corsHeaders);
  } catch (error) {
    if (error instanceof AuthCorsError) {
      return createForbiddenOriginResponse();
    }

    throw error;
  }
}
