import { NextResponse } from "next/server";
import { sessionKeySchema } from "@loyal-labs/auth-core";
import { z } from "zod";

import { getServerConfig } from "@/lib/core/config/server";
import {
  AuthCorsError,
  createAuthCorsPreflightResponse,
  createForbiddenOriginResponse,
  getAuthCorsHeaders,
  withAuthCorsHeaders,
} from "@/lib/auth/cors";
import {
  AUTH_SESSION_COOKIE_NAME,
  createAuthSessionCookieService,
} from "@/lib/auth/session-cookie";
import { proxyPasskeyOperation } from "@/lib/passkeys/grid-proxy";

const submitPasskeySessionResponseSchema = z.object({
  passkeyAccount: z.string().min(1),
  smartAccount: z.object({
    address: z.string().min(1),
  }),
  sessionKey: sessionKeySchema,
});

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
    const response = await proxyPasskeyOperation({
      operation: "submitSession",
      request,
    });

    if (!response.ok) {
      return withAuthCorsHeaders(response, corsHeaders);
    }

    let payload: unknown;
    try {
      payload = await response.clone().json();
    } catch {
      payload = null;
    }

    const parsed = submitPasskeySessionResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return withAuthCorsHeaders(response, corsHeaders);
    }

    const sessionCookieService = createAuthSessionCookieService({
      getConfig: () => config,
    });
    const nextResponse = NextResponse.json(parsed.data, {
      status: response.status,
      headers: response.headers,
    });

    nextResponse.cookies.set({
      name: AUTH_SESSION_COOKIE_NAME,
      value: await sessionCookieService.issueSessionToken({
        authMethod: "passkey",
        subjectAddress: parsed.data.smartAccount.address,
        displayAddress: parsed.data.smartAccount.address,
        passkeyAccount: parsed.data.passkeyAccount,
        smartAccountAddress: parsed.data.smartAccount.address,
        sessionKey: parsed.data.sessionKey,
      }),
      ...sessionCookieService.createSessionCookieOptions(request),
    });

    return withAuthCorsHeaders(nextResponse, corsHeaders);
  } catch (error) {
    if (error instanceof AuthCorsError) {
      return createForbiddenOriginResponse();
    }

    throw error;
  }
}
