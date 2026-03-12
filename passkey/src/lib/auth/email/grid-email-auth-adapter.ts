import type { GridClient, SessionSecrets } from "@sqds/grid";

import { getGridServerClient } from "@/lib/auth/grid-server-client";

import {
  EmailAuthError,
  mapBeginEmailAuthError,
  mapCompleteEmailAuthError,
  shouldFallbackToSignIn,
} from "./errors";
import type { PendingEmailAuth } from "./pending-auth-store";

export type NormalizedBeginEmailAuthResult = {
  email: string;
  mode: "create" | "auth";
  provider?: "privy" | "turnkey";
  otpId?: string;
  sessionSecrets: SessionSecrets;
  expiresAt: string;
};

export type NormalizedEmailAuthUser = {
  email: string;
  gridUserId: string;
  accountAddress: string;
  provider?: "privy" | "turnkey";
};

type GridEmailAuthAdapterDependencies = {
  getGridClient: () => GridClient;
};

const defaultDependencies: GridEmailAuthAdapterDependencies = {
  getGridClient: () => getGridServerClient(),
};

export interface GridEmailAuthAdapter {
  beginEmailAuth(email: string): Promise<NormalizedBeginEmailAuthResult>;
  completeEmailAuth(
    pendingAuth: PendingEmailAuth,
    otpCode: string
  ): Promise<NormalizedEmailAuthUser>;
}

function normalizeProvider(
  provider: unknown,
  options?: { optional?: boolean }
): "privy" | "turnkey" | undefined {
  if (provider === "privy" || provider === "turnkey") {
    return provider;
  }

  if (options?.optional && provider === undefined) {
    return undefined;
  }

  throw new EmailAuthError("Grid returned an unsupported email auth provider.", {
    code: "unsupported_provider",
    status: 502,
  });
}

function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  throw new EmailAuthError(`Grid response is missing ${fieldName}.`, {
    code: "email_auth_response_invalid",
    status: 502,
  });
}

function normalizeBeginCreateResponse(
  email: string,
  sessionSecrets: SessionSecrets,
  data: unknown
): NormalizedBeginEmailAuthResult {
  if (typeof data !== "object" || data === null) {
    throw new EmailAuthError("Grid returned an invalid create-account response.", {
      code: "email_auth_response_invalid",
      status: 502,
    });
  }

  const record = data as Record<string, unknown>;
  if (record.type !== "email") {
    throw new EmailAuthError("Grid returned an unexpected account type.", {
      code: "email_auth_response_invalid",
      status: 502,
    });
  }

  return {
    email,
    mode: "create",
    sessionSecrets,
    expiresAt: readRequiredString(record.expiresAt, "expiresAt"),
  };
}

function normalizeBeginAuthResponse(
  email: string,
  sessionSecrets: SessionSecrets,
  data: unknown
): NormalizedBeginEmailAuthResult {
  if (typeof data !== "object" || data === null) {
    throw new EmailAuthError("Grid returned an invalid auth-init response.", {
      code: "email_auth_response_invalid",
      status: 502,
    });
  }

  const record = data as Record<string, unknown>;

  return {
    email,
    mode: "auth",
    provider: normalizeProvider(record.provider, { optional: true }),
    otpId:
      typeof record.otpId === "string" && record.otpId.length > 0
        ? record.otpId
        : undefined,
    sessionSecrets,
    expiresAt: readRequiredString(record.expiresAt, "expiresAt"),
  };
}

function normalizeCompleteResponse(
  email: string,
  provider: "privy" | "turnkey" | undefined,
  data: unknown
): NormalizedEmailAuthUser {
  if (typeof data !== "object" || data === null) {
    throw new EmailAuthError("Grid returned an invalid auth completion response.", {
      code: "email_auth_response_invalid",
      status: 502,
    });
  }

  const record = data as Record<string, unknown>;

  return {
    email,
    gridUserId: readRequiredString(record.gridUserId, "gridUserId"),
    accountAddress: readRequiredString(record.address, "address"),
    ...(provider ? { provider } : {}),
  };
}

function toGridUserContext(pendingAuth: PendingEmailAuth) {
  return {
    email: pendingAuth.email,
    provider: normalizeProvider(pendingAuth.provider, { optional: true }) ?? "privy",
    ...(pendingAuth.otpId ? { otpId: pendingAuth.otpId } : {}),
  };
}

export function createGridEmailAuthAdapter(
  dependencies: GridEmailAuthAdapterDependencies = defaultDependencies
): GridEmailAuthAdapter {
  return {
    async beginEmailAuth(email: string) {
      const gridClient = dependencies.getGridClient();

      try {
        const sessionSecrets = await gridClient.generateSessionSecrets();

        try {
          const createResult = await gridClient.createAccount({ email });
          return normalizeBeginCreateResponse(
            email,
            sessionSecrets,
            createResult.data
          );
        } catch (error) {
          if (!shouldFallbackToSignIn(error)) {
            throw error;
          }
        }

        const initResult = await gridClient.initAuth({ email });
        return normalizeBeginAuthResponse(email, sessionSecrets, initResult.data);
      } catch (error) {
        mapBeginEmailAuthError(error);
      }
    },

    async completeEmailAuth(pendingAuth: PendingEmailAuth, otpCode: string) {
      const gridClient = dependencies.getGridClient();

      try {
        const result =
          pendingAuth.mode === "create"
            ? await gridClient.completeAuthAndCreateAccount({
                otpCode,
                user: toGridUserContext(pendingAuth),
                sessionSecrets: pendingAuth.sessionSecrets,
              })
            : await gridClient.completeAuth({
                otpCode,
                user: toGridUserContext(pendingAuth),
                sessionSecrets: pendingAuth.sessionSecrets,
              });

        return normalizeCompleteResponse(
          pendingAuth.email,
          pendingAuth.provider,
          result.data
        );
      } catch (error) {
        mapCompleteEmailAuthError(error);
      }
    },
  };
}

let gridEmailAuthAdapter: GridEmailAuthAdapter | null = null;

export function getGridEmailAuthAdapter(): GridEmailAuthAdapter {
  if (gridEmailAuthAdapter) {
    return gridEmailAuthAdapter;
  }

  gridEmailAuthAdapter = createGridEmailAuthAdapter();
  return gridEmailAuthAdapter;
}

export function resetGridEmailAuthAdapterForTests(): void {
  gridEmailAuthAdapter = null;
}
