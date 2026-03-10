import { describe, expect, mock, test } from "bun:test";
import bs58 from "bs58";

import {
  runContinueAuthFirst,
  type ContinueRunnerResult,
} from "@/lib/passkeys/continue-runner";

const parsedAuth = {
  challenge: "challenge-value",
  slotNumber: 12,
  sessionKey: bs58.encode(Uint8Array.from([1, 2, 3, 4])),
  expirationInSeconds: 120,
  env: "sandbox" as const,
};

describe("runContinueAuthFirst", () => {
  test("returns auth success when the first submit succeeds", async () => {
    const buildFlowRequest = mock(async () => ({
      endpoint: "/api/passkeys/session/submit",
      payload: { ceremonyType: "auth" },
    }));
    const callApi = mock(async () => ({
      ok: true,
      status: 200,
      body: { ok: true },
    }));

    const result = await runContinueAuthFirst(parsedAuth, {
      buildFlowRequest,
      callApi,
    });

    expect(result).toEqual({
      type: "success",
      branch: "auth",
      body: { ok: true },
    } satisfies ContinueRunnerResult);
  });

  test("falls back to create when auth reports no passkey account", async () => {
    const buildFlowRequest = mock(async (mode: "create" | "auth") => ({
      endpoint: "/api/passkeys/session/submit",
      payload: { ceremonyType: mode },
    }));
    const callApi = mock(async (endpoint: string) => {
      if (endpoint === "/api/passkeys/session/submit" && callApi.mock.calls.length === 1) {
        return {
          ok: false,
          status: 404,
          body: {
            error: {
              message: "Passkey account not found",
            },
          },
        };
      }

      if (endpoint === "/api/passkeys/session/create") {
        return {
          ok: true,
          status: 200,
          body: {
            url: `https://app.askloyal.com/create?challenge=challenge-value&slot-num=12&session-key=${parsedAuth.sessionKey}&expiration-in-seconds=120&env=sandbox&app-name=askloyal&user-id=tg-100`,
          },
        };
      }

      return {
        ok: true,
        status: 200,
        body: { ok: true, branch: "create" },
      };
    });

    const result = await runContinueAuthFirst(parsedAuth, {
      buildFlowRequest,
      callApi,
    });

    expect(result).toEqual({
      type: "success",
      branch: "create",
      body: { ok: true, branch: "create" },
    } satisfies ContinueRunnerResult);
    expect(buildFlowRequest.mock.calls.map((call) => call[0])).toEqual([
      "auth",
      "create",
    ]);
  });
});
