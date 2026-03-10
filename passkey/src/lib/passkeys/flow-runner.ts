import {
  type ParsedAuthPasskeyQuery,
  type ParsedCreatePasskeyQuery,
  type ParseResult,
  parseAuthPasskeyQuery,
  parseCreatePasskeyQuery,
} from "@/lib/passkeys/query-params";
import {
  toSessionKeyBackendObject,
} from "@/lib/passkeys/session-key";
import { getGridBrowserSdkClient } from "@/lib/passkeys/grid-browser-sdk";
import type { Env } from "@sqds/grid";

export type PasskeyFlowMode = "create" | "auth";

export type PasskeyFlowParseResult =
  | ParseResult<ParsedCreatePasskeyQuery>
  | ParseResult<ParsedAuthPasskeyQuery>;

export type PasskeyFlowRequest = {
  endpoint: string;
  payload: unknown;
};

type FlowRegistryEntry<T> = {
  parse: (query: URLSearchParams) => ParseResult<T>;
};

const flowRegistry: {
  create: FlowRegistryEntry<ParsedCreatePasskeyQuery>;
  auth: FlowRegistryEntry<ParsedAuthPasskeyQuery>;
} = {
  create: {
    parse: parseCreatePasskeyQuery,
  },
  auth: {
    parse: parseAuthPasskeyQuery,
  },
};

export type FlowRunnerDependencies = {
  createCredentials: ReturnType<
    typeof getGridBrowserSdkClient
  >["createPasskeyCredentials"];
  getCredentials: ReturnType<typeof getGridBrowserSdkClient>["getPasskeyCredentials"];
};

const defaultFlowRunnerDependencies: FlowRunnerDependencies = {
  createCredentials: (...args) =>
    getGridBrowserSdkClient().createPasskeyCredentials(...args),
  getCredentials: (...args) => getGridBrowserSdkClient().getPasskeyCredentials(...args),
};

function normalizeChallengeForSdk(challenge: string): string {
  const urlNormalized = challenge.trim().replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
  const paddingNeeded = (4 - (urlNormalized.length % 4)) % 4;
  return urlNormalized + "=".repeat(paddingNeeded);
}

function toSharedPasskeyRequest(
  parsed: ParsedCreatePasskeyQuery | ParsedAuthPasskeyQuery
) {
  const gridEnv: Env =
    parsed.env === "mainnet" || parsed.env === "production"
      ? "mainnet"
      : parsed.env === "testnet"
        ? "testnet"
        : "devnet";

  return {
    challenge: normalizeChallengeForSdk(parsed.challenge),
    env: gridEnv,
    expirationInSeconds: String(parsed.expirationInSeconds),
    redirectUrl: parsed.redirectUrl,
    sessionKey: parsed.sessionKey,
    slotNumber: String(parsed.slotNumber),
  };
}

export function parsePasskeyFlowQuery(
  mode: PasskeyFlowMode,
  query: URLSearchParams
): PasskeyFlowParseResult {
  return flowRegistry[mode].parse(query);
}

export async function buildPasskeyFlowRequest(
  mode: PasskeyFlowMode,
  parsed: ParsedCreatePasskeyQuery | ParsedAuthPasskeyQuery,
  dependencies: FlowRunnerDependencies = defaultFlowRunnerDependencies
): Promise<PasskeyFlowRequest> {
  const sharedRequest = toSharedPasskeyRequest(parsed);

  if (mode === "create") {
    const createParsed = parsed as ParsedCreatePasskeyQuery;
    const createRequest = {
      ...sharedRequest,
      appName: createParsed.appName,
      userId: createParsed.userId,
    };

    const credentialData = await dependencies.createCredentials(createRequest);
    const assertion = await dependencies.getCredentials(
      createRequest,
      credentialData
    );

    return {
      endpoint: "/api/passkeys/session/submit",
      payload: {
        ceremonyType: "create",
        sessionKey: toSessionKeyBackendObject(
          createParsed.sessionKey,
          createParsed.expirationInSeconds
        ),
        slotNumber: createParsed.slotNumber,
        authenticatorResponse: assertion,
      },
    };
  }

  const authParsed = parsed as ParsedAuthPasskeyQuery;
  const assertion = await dependencies.getCredentials(sharedRequest);

  return {
    endpoint: "/api/passkeys/session/submit",
    payload: {
      ceremonyType: "auth",
      sessionKey: toSessionKeyBackendObject(
        authParsed.sessionKey,
        authParsed.expirationInSeconds
      ),
      slotNumber: authParsed.slotNumber,
      authenticatorResponse: assertion,
    },
  };
}
