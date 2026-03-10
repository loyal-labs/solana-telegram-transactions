import { NextResponse } from "next/server";
import { z } from "zod";

import type { PasskeyServerConfig } from "@/lib/core/config/types";
import {
  authorizeSessionRequestSchema,
  createAccountRequestSchema,
  createSessionRequestSchema,
  findAccountRequestSchema,
  passkeyAccountParamSchema,
  passkeyApiPaths,
  submitSessionRequestSchema,
} from "@/lib/passkeys/contracts";

type PasskeyOperation =
  | "createSession"
  | "authorizeSession"
  | "submitSession"
  | "createAccount"
  | "findAccount"
  | "getAccount";

type OperationDefinition = {
  method: "POST" | "GET";
  path: (passkeyAddress?: string) => string;
  schema?: z.ZodType<unknown>;
};

const operationDefinitions: Record<PasskeyOperation, OperationDefinition> = {
  createSession: {
    method: "POST",
    path: () => passkeyApiPaths.createSession,
    schema: createSessionRequestSchema,
  },
  authorizeSession: {
    method: "POST",
    path: () => passkeyApiPaths.authorizeSession,
    schema: authorizeSessionRequestSchema,
  },
  submitSession: {
    method: "POST",
    path: () => passkeyApiPaths.submitSession,
    schema: submitSessionRequestSchema,
  },
  createAccount: {
    method: "POST",
    path: () => passkeyApiPaths.createAccount,
    schema: createAccountRequestSchema,
  },
  findAccount: {
    method: "POST",
    path: () => passkeyApiPaths.findAccount,
    schema: findAccountRequestSchema,
  },
  getAccount: {
    method: "GET",
    path: (passkeyAddress?: string) => passkeyApiPaths.getAccount(passkeyAddress ?? ""),
  },
};

type PrepareProxyRequestArgs = {
  operation: PasskeyOperation;
  body?: unknown;
  passkeyAddress?: string;
  incomingHeaders: Headers;
  config: PasskeyServerConfig;
};

type PreparedProxyRequest = {
  url: string;
  init: RequestInit;
  normalizedBody?: unknown;
};

type ProxyErrorCode =
  | "invalid_request"
  | "invalid_json"
  | "proxy_failed"
  | "upstream_error";

type ProxyErrorEnvelope = {
  code: ProxyErrorCode | string;
  message: string;
  details?: unknown;
  requestId?: string;
};

export class ProxyValidationError extends Error {
  readonly details: string[];

  constructor(message: string, details: string[]) {
    super(message);
    this.name = "ProxyValidationError";
    this.details = details;
  }
}

function extractSchemaErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".") || "request";
    return `${path}: ${issue.message}`;
  });
}

function createProxyErrorResponse(
  status: number,
  error: ProxyErrorEnvelope,
  headers?: Headers
): NextResponse {
  const responseHeaders = new Headers(headers);
  if (error.requestId) {
    responseHeaders.set("x-request-id", error.requestId);
  }

  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
        ...(error.requestId ? { requestId: error.requestId } : {}),
      },
    },
    { status, headers: responseHeaders }
  );
}

function extractRequestId(headers: Headers): string | undefined {
  const requestId = headers.get("x-request-id");
  return requestId && requestId.length > 0 ? requestId : undefined;
}

function parseSetCookieHeader(header: string | null): string[] {
  if (!header) {
    return [];
  }

  return header
    .split(/,(?=\s*[A-Za-z0-9_-]+=)/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getSetCookieHeaders(headers: Headers): string[] {
  const withSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
    raw?: () => Record<string, string[]>;
  };

  if (typeof withSetCookie.getSetCookie === "function") {
    const setCookies = withSetCookie.getSetCookie();
    if (setCookies.length > 0) {
      return setCookies;
    }
  }

  if (typeof withSetCookie.raw === "function") {
    const raw = withSetCookie.raw();
    const setCookies = raw["set-cookie"];
    if (Array.isArray(setCookies) && setCookies.length > 0) {
      return setCookies;
    }
  }

  return parseSetCookieHeader(headers.get("set-cookie"));
}

function buildForwardHeaders(
  incomingHeaders: Headers,
  config: PasskeyServerConfig,
  method: "POST" | "GET"
): Headers {
  const headers = new Headers({
    "content-type": "application/json",
    "x-grid-environment": config.gridEnvironment,
  });

  if (method === "POST") {
    headers.set("x-idempotency-key", crypto.randomUUID());
  }

  if (config.gridApiKey) {
    headers.set("authorization", `Bearer ${config.gridApiKey}`);
  }

  for (const headerName of ["origin", "cookie", "user-agent", "referer"]) {
    const value = incomingHeaders.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

function withCustomDomainDefaults(
  operation: PasskeyOperation,
  body: unknown,
  config: PasskeyServerConfig
): unknown {
  if (typeof body !== "object" || body === null) {
    return body;
  }

  if (operation === "createSession") {
    const payload = body as Record<string, unknown>;
    const metaInfo =
      typeof payload.metaInfo === "object" && payload.metaInfo !== null
        ? (payload.metaInfo as Record<string, unknown>)
        : {};
    const resolvedBaseUrl =
      typeof payload.baseUrl === "string" && payload.baseUrl.length > 0
        ? payload.baseUrl
        : config.customDomainBaseUrl;

    return {
      ...payload,
      baseUrl: resolvedBaseUrl,
      metaInfo: {
        ...metaInfo,
        appName:
          typeof metaInfo.appName === "string" && metaInfo.appName.length > 0
            ? metaInfo.appName
            : config.appName,
        baseUrl:
          typeof metaInfo.baseUrl === "string" && metaInfo.baseUrl.length > 0
            ? metaInfo.baseUrl
            : resolvedBaseUrl,
      },
    };
  }

  if (operation === "authorizeSession") {
    const payload = body as Record<string, unknown>;
    const metaInfo =
      typeof payload.metaInfo === "object" && payload.metaInfo !== null
        ? (payload.metaInfo as Record<string, unknown>)
        : {};

    return {
      ...payload,
      baseUrl: config.customDomainBaseUrl,
      metaInfo: {
        ...metaInfo,
        appName:
          typeof metaInfo.appName === "string" && metaInfo.appName.length > 0
            ? metaInfo.appName
            : config.appName,
      },
    };
  }

  return body;
}

export function preparePasskeyUpstreamRequest(
  args: PrepareProxyRequestArgs
): PreparedProxyRequest {
  const definition = operationDefinitions[args.operation];
  if (!definition) {
    throw new ProxyValidationError("Unknown passkey operation", [args.operation]);
  }

  let validatedBody: unknown;
  if (definition.method === "POST") {
    if (!definition.schema) {
      throw new ProxyValidationError("Missing request validator", [args.operation]);
    }

    const parseResult = definition.schema.safeParse(args.body);
    if (!parseResult.success) {
      throw new ProxyValidationError(
        "Invalid request payload",
        extractSchemaErrors(parseResult.error)
      );
    }

    validatedBody = withCustomDomainDefaults(
      args.operation,
      parseResult.data,
      args.config
    );
  } else if (args.operation === "getAccount") {
    const parsed = passkeyAccountParamSchema.safeParse({
      passkeyAddress: args.passkeyAddress,
    });
    if (!parsed.success) {
      throw new ProxyValidationError(
        "Invalid passkey account parameter",
        extractSchemaErrors(parsed.error)
      );
    }
  }

  const path = definition.path(args.passkeyAddress);
  const url = `${args.config.gridApiBaseUrl}/api/grid/v1${path}`;
  const init: RequestInit = {
    method: definition.method,
    headers: buildForwardHeaders(
      args.incomingHeaders,
      args.config,
      definition.method
    ),
    body: validatedBody ? JSON.stringify(validatedBody) : undefined,
  };

  return { url, init, normalizedBody: validatedBody };
}

export async function buildProxyResponse(upstream: Response): Promise<NextResponse> {
  const responseHeaders = new Headers();
  for (const headerName of ["x-request-id", "x-idempotency-key"]) {
    const value = upstream.headers.get(headerName);
    if (value) {
      responseHeaders.set(headerName, value);
    }
  }

  const setCookies = getSetCookieHeaders(upstream.headers);
  for (const setCookie of setCookies) {
    responseHeaders.append("set-cookie", setCookie);
  }

  const requestId = extractRequestId(upstream.headers);
  const responseText = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "";

  if (!responseText && upstream.status < 400) {
    return new NextResponse(null, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  let parsedPayload: unknown = responseText;
  if (contentType.includes("application/json") && responseText) {
    try {
      parsedPayload = JSON.parse(responseText);
    } catch {
      parsedPayload = { message: responseText };
    }
  }

  if (upstream.status >= 400) {
    const payload =
      parsedPayload && typeof parsedPayload === "object"
        ? (parsedPayload as Record<string, unknown>)
        : null;

    const message =
      (payload?.message as string | undefined) ??
      (payload?.error as string | undefined) ??
      (typeof parsedPayload === "string" && parsedPayload.length > 0
        ? parsedPayload
        : "Upstream passkey request failed");

    const details = payload?.details ?? payload ?? parsedPayload;
    const code = (payload?.code as string | undefined) ?? "upstream_error";

    return createProxyErrorResponse(
      upstream.status,
      { code, message, details, requestId },
      responseHeaders
    );
  }

  if (contentType.includes("application/json")) {
    return NextResponse.json(parsedPayload, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  if (typeof parsedPayload === "string") {
    return new NextResponse(parsedPayload, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  return NextResponse.json(parsedPayload, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function proxyPasskeyOperation({
  operation,
  request,
  passkeyAddress,
}: {
  operation: PasskeyOperation;
  request: Request;
  passkeyAddress?: string;
}): Promise<NextResponse> {
  try {
    const { getServerConfig } = await import("@/lib/core/config/server");
    const config = getServerConfig();
    const definition = operationDefinitions[operation];
    const body =
      definition.method === "POST" ? await request.json() : undefined;

    const prepared = preparePasskeyUpstreamRequest({
      operation,
      body,
      passkeyAddress,
      incomingHeaders: request.headers,
      config,
    });

    const upstream = await fetch(prepared.url, prepared.init);
    return buildProxyResponse(upstream);
  } catch (error) {
    if (error instanceof ProxyValidationError) {
      return createProxyErrorResponse(400, {
        code: "invalid_request",
        message: error.message,
        details: error.details,
      });
    }

    if (error instanceof SyntaxError) {
      return createProxyErrorResponse(400, {
        code: "invalid_json",
        message: "Request body must be valid JSON",
      });
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to proxy passkey request";

    return createProxyErrorResponse(502, {
      code: "proxy_failed",
      message,
    });
  }
}
