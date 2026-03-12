import { NextResponse } from "next/server";

import type { PasskeyServerConfig } from "@/lib/core/config/types";
import {
  PasskeyHostResolutionError,
  resolvePasskeyHostContext,
} from "@/lib/passkeys/host-resolution";

const ALLOW_HEADERS = "content-type";
const ALLOW_METHODS = "GET, POST, OPTIONS";

export class AuthCorsError extends Error {
  readonly status = 403;

  constructor(message = "Origin is not allowed for auth requests") {
    super(message);
    this.name = "AuthCorsError";
  }
}

function appendVaryHeader(headers: Headers, value: string): void {
  const current = headers.get("vary");
  if (!current) {
    headers.set("vary", value);
    return;
  }

  const values = current
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (!values.includes(value.toLowerCase())) {
    headers.set("vary", `${current}, ${value}`);
  }
}

export function resolveAllowedAuthOrigin(
  request: Request,
  config: PasskeyServerConfig
): string | null {
  const origin = request.headers.get("origin");
  if (!origin) {
    return null;
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    throw new AuthCorsError("Origin header is invalid");
  }

  try {
    resolvePasskeyHostContext(parsedOrigin.hostname, {
      allowedParentDomain: config.allowedParentDomain,
      allowLocalhost: config.allowLocalhost,
      rpId: config.rpId,
    });
  } catch (error) {
    if (error instanceof PasskeyHostResolutionError) {
      throw new AuthCorsError();
    }

    throw error;
  }

  return parsedOrigin.origin;
}

export function getAuthCorsHeaders(
  request: Request,
  config: PasskeyServerConfig
): Headers {
  const allowedOrigin = resolveAllowedAuthOrigin(request, config);
  const headers = new Headers();

  if (!allowedOrigin) {
    return headers;
  }

  headers.set("access-control-allow-origin", allowedOrigin);
  headers.set("access-control-allow-credentials", "true");
  headers.set("access-control-allow-headers", ALLOW_HEADERS);
  headers.set("access-control-allow-methods", ALLOW_METHODS);
  appendVaryHeader(headers, "Origin");

  return headers;
}

export function withAuthCorsHeaders<T extends Response>(
  response: T,
  headers: Headers
): T {
  headers.forEach((value, key) => {
    if (key === "vary") {
      appendVaryHeader(response.headers, value);
      return;
    }

    response.headers.set(key, value);
  });

  return response;
}

export function createAuthCorsPreflightResponse(
  request: Request,
  config: PasskeyServerConfig
): NextResponse {
  const headers = getAuthCorsHeaders(request, config);

  return withAuthCorsHeaders(new NextResponse(null, { status: 204 }), headers);
}

export function createForbiddenOriginResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "forbidden_origin",
        message: "Origin is not allowed for auth requests.",
      },
    },
    { status: 403 }
  );
}
