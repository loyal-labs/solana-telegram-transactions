import { describe, expect, mock, test } from "bun:test";
import bs58 from "bs58";

import {
  buildPasskeyFlowRequest,
  type FlowRunnerDependencies,
} from "@/lib/passkeys/flow-runner";

describe("buildPasskeyFlowRequest", () => {
  test("builds create flow request payload", async () => {
    const createCredentials = mock(async () => ({
      id: new ArrayBuffer(8),
      publicKey: "public-key",
      credentialId: "credential-id",
    })) as FlowRunnerDependencies["createCredentials"];
    const getCredentials = mock(async () => ({
      response: { signature: "sig" },
    })) as FlowRunnerDependencies["getCredentials"];

    const sessionKey = bs58.encode(Uint8Array.from([1, 2, 3, 4]));
    const request = await buildPasskeyFlowRequest(
      "create",
      {
        challenge: "challenge",
        slotNumber: 10,
        sessionKey,
        expirationInSeconds: 900,
        appName: "askloyal",
        userId: "tg-user",
      },
      {
        createCredentials,
        getCredentials,
      }
    );

    expect(request.endpoint).toBe("/api/passkeys/session/submit");
    expect(request.payload).toMatchObject({
      ceremonyType: "create",
      slotNumber: 10,
      sessionKey: { expiration: 900 },
    });
    expect(createCredentials).toHaveBeenCalledTimes(1);
    expect(getCredentials).toHaveBeenCalledTimes(1);
  });

  test("builds auth flow request payload", async () => {
    const createCredentials = mock(async () => ({
      id: new ArrayBuffer(8),
      publicKey: "public-key",
      credentialId: "credential-id",
    })) as FlowRunnerDependencies["createCredentials"];
    const getCredentials = mock(async () => ({
      response: { signature: "sig" },
    })) as FlowRunnerDependencies["getCredentials"];

    const sessionKey = bs58.encode(Uint8Array.from([9, 8, 7, 6]));
    const request = await buildPasskeyFlowRequest(
      "auth",
      {
        challenge: "challenge",
        slotNumber: 99,
        sessionKey,
        expirationInSeconds: 1200,
      },
      {
        createCredentials,
        getCredentials,
      }
    );

    expect(request.endpoint).toBe("/api/passkeys/session/submit");
    expect(request.payload).toMatchObject({
      ceremonyType: "auth",
      slotNumber: 99,
      sessionKey: { expiration: 1200 },
    });
    expect(createCredentials).toHaveBeenCalledTimes(0);
    expect(getCredentials).toHaveBeenCalledTimes(1);
  });

  test("normalizes URL-safe challenge before passing to SDK helpers", async () => {
    const createCredentials = mock(async () => ({
      id: new ArrayBuffer(8),
      publicKey: "public-key",
      credentialId: "credential-id",
    })) as FlowRunnerDependencies["createCredentials"];
    const getCredentials = mock(async () => ({
      response: { signature: "sig" },
    })) as FlowRunnerDependencies["getCredentials"];

    const sessionKey = bs58.encode(Uint8Array.from([1, 2, 3, 4]));
    await buildPasskeyFlowRequest(
      "create",
      {
        challenge: "a-b_c",
        slotNumber: 1,
        sessionKey,
        expirationInSeconds: 900,
        appName: "askloyal",
        userId: "tg-user",
      },
      {
        createCredentials,
        getCredentials,
      }
    );

    const createCall = createCredentials.mock.calls[0]?.[0] as
      | { challenge?: string }
      | undefined;
    expect(createCall?.challenge).toBe("a+b/c===");
  });
});
