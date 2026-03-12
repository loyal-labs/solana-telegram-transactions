"use client";

import {
  buildAuthUrl,
  extractApiErrorMessage,
  extractSessionUrl,
  parseApiErrorDetails,
  type ApiOutcome,
} from "@loyal-labs/auth-core";

import {
  buildPasskeyFlowRequest,
  type FlowRunnerDependencies,
} from "@/lib/passkeys/flow-runner";
import {
  parseCreatePasskeyQuery,
  type ParsedAuthPasskeyQuery,
  type ParsedCreatePasskeyQuery,
} from "@/lib/passkeys/query-params";
import { toSessionKeyObject } from "@/lib/passkeys/session-key";
import { isChallengeTimeoutError } from "@/lib/passkeys/webauthn";

type ContinueRunnerDependencies = {
  buildFlowRequest: (
    mode: "create" | "auth",
    parsed: ParsedAuthPasskeyQuery | ParsedCreatePasskeyQuery,
    dependencies?: FlowRunnerDependencies
  ) => ReturnType<typeof buildPasskeyFlowRequest>;
  callApi: (endpoint: string, payload: unknown) => Promise<ApiOutcome>;
};

async function callLocalPasskeyApi(
  endpoint: string,
  payload: unknown
): Promise<ApiOutcome> {
  const response = await fetch(buildAuthUrl("", endpoint), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  let body: unknown = bodyText;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

const defaultContinueRunnerDependencies: ContinueRunnerDependencies = {
  buildFlowRequest: buildPasskeyFlowRequest as ContinueRunnerDependencies["buildFlowRequest"],
  callApi: callLocalPasskeyApi,
};

const knownAccountNotFoundCodes = new Set([
  "NOVALIDEXTERNALLYSIGNEDACCOUNT",
  "NO_VALID_EXTERNALLY_SIGNED_ACCOUNT",
  "PASSKEY_ACCOUNT_NOT_FOUND",
  "ACCOUNT_NOT_FOUND",
]);

export type ContinueRunnerResult =
  | {
      type: "success";
      branch: "auth" | "create";
      body: unknown;
    }
  | {
      type: "needs_create_cta";
      message: string;
    }
  | {
      type: "error";
      branch: "auth" | "create";
      message: string;
      details: string[];
      challengeExpired: boolean;
    };

function normalizeCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function detailCodeValues(payload: unknown): string[] {
  const records: unknown[] = [];

  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "details" in payload.error &&
    Array.isArray(payload.error.details)
  ) {
    records.push(...payload.error.details);
  } else if (
    typeof payload === "object" &&
    payload !== null &&
    "details" in payload &&
    Array.isArray(payload.details)
  ) {
    records.push(...payload.details);
  }

  return records
    .map((entry) => {
      if (
        typeof entry === "object" &&
        entry !== null &&
        "code" in entry &&
        typeof entry.code === "string"
      ) {
        return normalizeCode(entry.code);
      }

      return null;
    })
    .filter((code): code is string => code !== null);
}

export function shouldFallbackToCreateFromAuthFailure(payload: unknown): boolean {
  const normalizedCodes = detailCodeValues(payload);
  if (normalizedCodes.some((code) => knownAccountNotFoundCodes.has(code))) {
    return true;
  }

  const message = extractApiErrorMessage(payload).toLowerCase();
  return (
    message.includes("account not found") ||
    message.includes("no valid externally signed account") ||
    message.includes("passkey account not found")
  );
}

function isNotAllowedCredentialError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return message.includes("notallowederror");
}

function toFailure(
  branch: "auth" | "create",
  payload: unknown
): ContinueRunnerResult {
  const message = extractApiErrorMessage(payload);
  return {
    type: "error",
    branch,
    message,
    details: parseApiErrorDetails(payload),
    challengeExpired: isChallengeTimeoutError(new Error(message)),
  };
}

export function buildCreateSessionPayloadFromAuthQuery(
  parsedAuth: ParsedAuthPasskeyQuery
) {
  return {
    env: parsedAuth.env ?? "sandbox",
    metaInfo: {},
    sessionKey: toSessionKeyObject(
      parsedAuth.sessionKey,
      parsedAuth.expirationInSeconds
    ),
  };
}

export async function runCreateFallbackFromAuth(
  parsedAuth: ParsedAuthPasskeyQuery,
  dependencies: ContinueRunnerDependencies = defaultContinueRunnerDependencies
): Promise<ContinueRunnerResult> {
  const createSessionOutcome = await dependencies.callApi(
    "/api/passkeys/session/create",
    buildCreateSessionPayloadFromAuthQuery(parsedAuth)
  );

  if (!createSessionOutcome.ok) {
    return toFailure("create", createSessionOutcome.body);
  }

  const createSessionUrl = extractSessionUrl(createSessionOutcome.body);
  if (!createSessionUrl) {
    return {
      type: "error",
      branch: "create",
      message: "Create session response did not include a passkey URL",
      details: [],
      challengeExpired: false,
    };
  }

  const createParamsResult = parseCreatePasskeyQuery(
    new URL(createSessionUrl).searchParams
  );
  if (!createParamsResult.ok) {
    return {
      type: "error",
      branch: "create",
      message: "Create session URL was missing required query parameters",
      details: createParamsResult.errors,
      challengeExpired: false,
    };
  }

  const createSubmitRequest = await dependencies.buildFlowRequest(
    "create",
    createParamsResult.data
  );
  const createSubmitOutcome = await dependencies.callApi(
    createSubmitRequest.endpoint,
    createSubmitRequest.payload
  );
  if (!createSubmitOutcome.ok) {
    return toFailure("create", createSubmitOutcome.body);
  }

  return {
    type: "success",
    branch: "create",
    body: createSubmitOutcome.body,
  };
}

export async function runContinueAuthFirst(
  parsedAuth: ParsedAuthPasskeyQuery,
  dependencies: ContinueRunnerDependencies = defaultContinueRunnerDependencies
): Promise<ContinueRunnerResult> {
  try {
    const authRequest = await dependencies.buildFlowRequest("auth", parsedAuth);
    const authOutcome = await dependencies.callApi(
      authRequest.endpoint,
      authRequest.payload
    );

    if (authOutcome.ok) {
      return {
        type: "success",
        branch: "auth",
        body: authOutcome.body,
      };
    }

    if (shouldFallbackToCreateFromAuthFailure(authOutcome.body)) {
      return runCreateFallbackFromAuth(parsedAuth, dependencies);
    }

    return toFailure("auth", authOutcome.body);
  } catch (error) {
    if (isNotAllowedCredentialError(error)) {
      return {
        type: "needs_create_cta",
        message:
          "No existing passkey login completed. Use 'Try create account' to register one now.",
      };
    }

    const message =
      error instanceof Error ? error.message : "Passkey continue flow failed";
    return {
      type: "error",
      branch: "auth",
      message,
      details: [],
      challengeExpired: isChallengeTimeoutError(error),
    };
  }
}
