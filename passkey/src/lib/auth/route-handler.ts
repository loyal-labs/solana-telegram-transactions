import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getServerConfig } from "@/lib/core/config/server";

import {
  AuthCorsError,
  createAuthCorsPreflightResponse,
  createForbiddenOriginResponse,
  getAuthCorsHeaders,
  withAuthCorsHeaders,
} from "./cors";

export type AuthRouteError = {
  code: string;
  status: number;
  message: string;
  details?: unknown;
};

type AuthRouteContext = {
  config: ReturnType<typeof getServerConfig>;
  corsHeaders: Headers;
};

type HandleAuthJsonPostOptions<T> = {
  execute: (
    body: unknown,
    context: AuthRouteContext
  ) => Promise<NextResponse | T> | NextResponse | T;
  mapKnownError?: (error: unknown) => AuthRouteError | null;
  defaultError: {
    code: string;
    message: string;
  };
};

function createAuthErrorResponse(
  request: Request,
  context: AuthRouteContext,
  error: AuthRouteError
): NextResponse {
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
    getAuthCorsHeaders(request, context.config)
  );
}

export function handleAuthOptions(request: Request) {
  try {
    return createAuthCorsPreflightResponse(request, getServerConfig());
  } catch (error) {
    if (error instanceof AuthCorsError) {
      return createForbiddenOriginResponse();
    }

    throw error;
  }
}

export async function handleAuthJsonPost<T>(
  request: Request,
  options: HandleAuthJsonPostOptions<T>
) {
  const config = getServerConfig();

  try {
    const corsHeaders = getAuthCorsHeaders(request, config);
    const result = await options.execute(await request.json(), {
      config,
      corsHeaders,
    });
    const response =
      result instanceof NextResponse ? result : NextResponse.json(result);

    return withAuthCorsHeaders(response, corsHeaders);
  } catch (error) {
    if (error instanceof AuthCorsError) {
      return createForbiddenOriginResponse();
    }

    const knownError = options.mapKnownError?.(error) ?? null;
    if (knownError) {
      return createAuthErrorResponse(
        request,
        {
          config,
          corsHeaders: getAuthCorsHeaders(request, config),
        },
        knownError
      );
    }

    if (error instanceof ZodError) {
      return createAuthErrorResponse(
        request,
        {
          config,
          corsHeaders: getAuthCorsHeaders(request, config),
        },
        {
          code: "invalid_request",
          status: 400,
          message: "Invalid request payload",
          details: error.issues.map((issue) => issue.message),
        }
      );
    }

    if (error instanceof SyntaxError) {
      return createAuthErrorResponse(
        request,
        {
          config,
          corsHeaders: getAuthCorsHeaders(request, config),
        },
        {
          code: "invalid_json",
          status: 400,
          message: "Request body must be valid JSON",
        }
      );
    }

    return createAuthErrorResponse(
      request,
      {
        config,
        corsHeaders: getAuthCorsHeaders(request, config),
      },
      {
        code: options.defaultError.code,
        status: 500,
        message:
          error instanceof Error ? error.message : options.defaultError.message,
      }
    );
  }
}
