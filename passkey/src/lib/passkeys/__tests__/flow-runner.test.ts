import { describe, expect, mock, test } from "bun:test";
import bs58 from "bs58";

import {
  buildPasskeyFlowRequest,
  type FlowRunnerDependencies,
} from "@/lib/passkeys/flow-runner";

describe("buildPasskeyFlowRequest", () => {
  test("builds create flow request payload", async () => {
    const resolveHostContext = mock(() => ({
      hostname: "app.askloyal.com",
      origin: "https://app.askloyal.com",
      rpId: "askloyal.com",
      isLocalhost: false,
    })) as FlowRunnerDependencies["resolveHostContext"];
    const runCreateCeremony = mock(async () => ({
      rawId: "raw-credential-id",
      credentialId: "credential-id",
      publicKey: "public-key",
    })) as FlowRunnerDependencies["runCreateCeremony"];
    const runAuthCeremony = mock(async () => ({
      response: { signature: "sig" },
    })) as FlowRunnerDependencies["runAuthCeremony"];

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
        resolveHostContext,
        runCreateCeremony,
        runAuthCeremony,
      }
    );

    expect(request.endpoint).toBe("/api/passkeys/session/submit");
    expect(request.payload).toMatchObject({
      ceremonyType: "create",
      slotNumber: 10,
      sessionKey: { expiration: 900 },
    });
    expect(runCreateCeremony).toHaveBeenCalledTimes(1);
    expect(runCreateCeremony.mock.calls[0]?.[0]).toMatchObject({
      rpId: "askloyal.com",
      appName: "askloyal",
      userId: "tg-user",
    });
    expect(runAuthCeremony).toHaveBeenCalledTimes(1);
    expect(runAuthCeremony.mock.calls[0]?.[0]).toMatchObject({
      rpId: "askloyal.com",
      allowCredentialId: "raw-credential-id",
      publicKey: "public-key",
    });
  });

  test("builds auth flow request payload", async () => {
    const resolveHostContext = mock(() => ({
      hostname: "localhost",
      origin: "http://localhost:3000",
      rpId: "localhost",
      isLocalhost: true,
    })) as FlowRunnerDependencies["resolveHostContext"];
    const runCreateCeremony = mock(async () => ({
      rawId: "unused",
      credentialId: "unused",
      publicKey: "public-key",
    })) as FlowRunnerDependencies["runCreateCeremony"];
    const runAuthCeremony = mock(async () => ({
      response: { signature: "sig" },
    })) as FlowRunnerDependencies["runAuthCeremony"];

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
        resolveHostContext,
        runCreateCeremony,
        runAuthCeremony,
      }
    );

    expect(request.endpoint).toBe("/api/passkeys/session/submit");
    expect(request.payload).toMatchObject({
      ceremonyType: "auth",
      slotNumber: 99,
      sessionKey: { expiration: 1200 },
    });
    expect(runCreateCeremony).toHaveBeenCalledTimes(0);
    expect(runAuthCeremony).toHaveBeenCalledTimes(1);
    expect(runAuthCeremony.mock.calls[0]?.[0]).toMatchObject({
      rpId: "localhost",
    });
  });

  test("normalizes challenge before passing to local ceremony helpers", async () => {
    const resolveHostContext = mock(() => ({
      hostname: "app.askloyal.com",
      origin: "https://app.askloyal.com",
      rpId: "askloyal.com",
      isLocalhost: false,
    })) as FlowRunnerDependencies["resolveHostContext"];
    const runCreateCeremony = mock(async () => ({
      rawId: "raw-credential-id",
      credentialId: "credential-id",
      publicKey: "public-key",
    })) as FlowRunnerDependencies["runCreateCeremony"];
    const runAuthCeremony = mock(async () => ({
      response: { signature: "sig" },
    })) as FlowRunnerDependencies["runAuthCeremony"];

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
        resolveHostContext,
        runCreateCeremony,
        runAuthCeremony,
      }
    );

    const createCall = runCreateCeremony.mock.calls[0]?.[0] as
      | { challenge?: string }
      | undefined;
    expect(createCall?.challenge).toBe("a-b_c");
  });
});
