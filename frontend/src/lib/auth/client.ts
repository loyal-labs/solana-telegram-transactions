import {
  createGridAuthClient,
  extractGridErrorMessage,
  getEmailAuthSessionResponseSchema,
  parseGridErrorDetails,
  startEmailAuthResponseSchema,
  verifyEmailAuthResponseSchema,
} from "@loyal-labs/grid-core";
import type {
  EmailAuthUser,
  GridAuthClient,
  StartEmailAuthRequest,
  StartEmailAuthResponse,
  VerifyEmailAuthRequest,
} from "@loyal-labs/grid-core";

import { publicEnv } from "@/lib/core/config/public";

export class AuthApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: string[];

  constructor(
    message: string,
    options: { code: string; status: number; details?: string[] }
  ) {
    super(message);
    this.name = "AuthApiClientError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details ?? [];
  }
}

type AuthApiClient = {
  startEmailAuth(payload: StartEmailAuthRequest): Promise<StartEmailAuthResponse>;
  verifyEmailAuth(payload: VerifyEmailAuthRequest): Promise<EmailAuthUser>;
  getSession(): Promise<EmailAuthUser | null>;
  logout(): Promise<void>;
};

function toErrorCode(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "code" in payload.error &&
    typeof payload.error.code === "string"
  ) {
    return payload.error.code;
  }

  return fallback;
}

function assertSuccessfulResponse<T>(
  outcome: { ok: boolean; status: number; body: unknown },
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } },
  options: {
    invalidResponseMessage: string;
    errorCode: string;
  }
): T {
  if (!outcome.ok) {
    throw new AuthApiClientError(extractGridErrorMessage(outcome.body), {
      code: toErrorCode(outcome.body, options.errorCode),
      status: outcome.status,
      details: parseGridErrorDetails(outcome.body),
    });
  }

  const parsed = schema.safeParse(outcome.body);
  if (!parsed.success) {
    throw new AuthApiClientError(options.invalidResponseMessage, {
      code: `${options.errorCode}_invalid_response`,
      status: 502,
    });
  }

  return parsed.data;
}

export function createAuthApiClient(
  rawClient: GridAuthClient = createGridAuthClient({
    authBaseUrl: publicEnv.gridAuthBaseUrl ?? "",
  })
): AuthApiClient {
  return {
    async startEmailAuth(payload) {
      const outcome = await rawClient.startEmailAuth(payload);
      return assertSuccessfulResponse(outcome, startEmailAuthResponseSchema, {
        invalidResponseMessage: "The auth server returned an invalid start response.",
        errorCode: "email_auth_start_failed",
      });
    },

    async verifyEmailAuth(payload) {
      const outcome = await rawClient.verifyEmailAuth(payload);
      const parsed = assertSuccessfulResponse(outcome, verifyEmailAuthResponseSchema, {
        invalidResponseMessage: "The auth server returned an invalid verify response.",
        errorCode: "email_auth_verify_failed",
      });

      return parsed.user;
    },

    async getSession() {
      const outcome = await rawClient.getEmailAuthSession();
      if (!outcome.ok) {
        if (outcome.status === 401) {
          return null;
        }

        throw new AuthApiClientError(extractGridErrorMessage(outcome.body), {
          code: toErrorCode(outcome.body, "email_auth_session_failed"),
          status: outcome.status,
          details: parseGridErrorDetails(outcome.body),
        });
      }

      const parsed = getEmailAuthSessionResponseSchema.safeParse(outcome.body);
      if (!parsed.success) {
        throw new AuthApiClientError(
          "The auth server returned an invalid session response.",
          {
            code: "email_auth_session_invalid_response",
            status: 502,
          }
        );
      }

      return parsed.data.user;
    },

    async logout() {
      const outcome = await rawClient.logoutEmailAuth();
      if (outcome.ok) {
        return;
      }

      throw new AuthApiClientError(extractGridErrorMessage(outcome.body), {
        code: toErrorCode(outcome.body, "email_auth_logout_failed"),
        status: outcome.status,
        details: parseGridErrorDetails(outcome.body),
      });
    },
  };
}

export const authApiClient = createAuthApiClient();
