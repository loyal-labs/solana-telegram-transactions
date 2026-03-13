import { NextResponse } from "next/server";

import { getServerConfig } from "@/lib/core/config/server";
import {
  AUTH_SESSION_COOKIE_NAME,
  createAuthSessionCookieService,
} from "@/lib/auth/session-cookie";
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
    const sessionCookieService = createAuthSessionCookieService({
      getConfig: () => config,
    });
    const response = new NextResponse(null, { status: 204 });

    response.cookies.set({
      name: AUTH_SESSION_COOKIE_NAME,
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
