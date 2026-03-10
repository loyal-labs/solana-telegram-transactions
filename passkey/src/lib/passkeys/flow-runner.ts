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
import { resolveCurrentPasskeyBrowserContext } from "@/lib/passkeys/host-resolution";
import {
  runAuthPasskeyCeremony,
  runCreatePasskeyCeremony,
} from "@/lib/passkeys/webauthn";
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
  resolveHostContext: typeof resolveCurrentPasskeyBrowserContext;
  runCreateCeremony: typeof runCreatePasskeyCeremony;
  runAuthCeremony: typeof runAuthPasskeyCeremony;
};

const defaultFlowRunnerDependencies: FlowRunnerDependencies = {
  resolveHostContext: () => resolveCurrentPasskeyBrowserContext(),
  runCreateCeremony: (...args) => runCreatePasskeyCeremony(...args),
  runAuthCeremony: (...args) => runAuthPasskeyCeremony(...args),
};

function normalizeChallenge(challenge: string): string {
  return challenge.trim().replace(/ /g, "+");
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
    challenge: normalizeChallenge(parsed.challenge),
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
  const hostContext = dependencies.resolveHostContext();

  if (mode === "create") {
    const createParsed = parsed as ParsedCreatePasskeyQuery;
    const createRequest = {
      ...sharedRequest,
      appName: createParsed.appName,
      userId: createParsed.userId,
    };

    const credentialData = await dependencies.runCreateCeremony({
      challenge: createRequest.challenge,
      appName: createRequest.appName,
      userId: createRequest.userId,
      rpId: hostContext.rpId,
    });
    const assertion = await dependencies.runAuthCeremony({
      challenge: createRequest.challenge,
      rpId: hostContext.rpId,
      allowCredentialId: credentialData.rawId,
      publicKey: credentialData.publicKey,
    });

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
  const assertion = await dependencies.runAuthCeremony({
    challenge: sharedRequest.challenge,
    rpId: hostContext.rpId,
  });

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
