import {
  gridAuthRoutePaths,
} from "./contracts";
import type {
  ApiOutcome,
  GridAuthClient,
  GridAuthRuntimeConfig,
  StartPasskeyRegistrationInput,
  StartPasskeySignInInput,
} from "./types";

function normalizeAuthBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "/") {
    return "";
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function buildGridAuthUrl(authBaseUrl: string, endpoint: string): string {
  const normalizedBaseUrl = normalizeAuthBaseUrl(authBaseUrl);
  if (!normalizedBaseUrl) {
    return endpoint;
  }

  return `${normalizedBaseUrl}${endpoint}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const bodyText = await response.text();
  if (!bodyText) {
    return null;
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    return bodyText;
  }
}

export async function callGridAuthEndpoint(
  config: GridAuthRuntimeConfig,
  endpoint: string,
  init: RequestInit
): Promise<ApiOutcome> {
  const fetcher = config.fetch ?? fetch;
  const response = await fetcher(buildGridAuthUrl(config.authBaseUrl, endpoint), init);
  const body = await parseResponseBody(response);

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

export function createGridAuthClient(
  config: GridAuthRuntimeConfig
): GridAuthClient {
  return {
    startPasskeyRegistration: (payload: StartPasskeyRegistrationInput) =>
      callGridAuthEndpoint(config, gridAuthRoutePaths.startPasskeyRegistration, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    startPasskeySignIn: (payload: StartPasskeySignInInput) =>
      callGridAuthEndpoint(config, gridAuthRoutePaths.startPasskeySignIn, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    getPasskeyAccount: (passkeyAddress: string) =>
      callGridAuthEndpoint(
        config,
        gridAuthRoutePaths.getPasskeyAccount(passkeyAddress),
        {
          method: "GET",
        }
      ),
  };
}
