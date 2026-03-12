import { describe, expect, test } from "bun:test";
import bs58 from "bs58";
import nacl from "tweetnacl";

import { WalletAuthError } from "@/lib/auth/wallet-errors";
import {
  completeWalletAuth,
  createWalletAuthChallenge,
} from "@/lib/auth/wallet-service";

const config = {
  gridEnvironment: "sandbox" as const,
  allowedParentDomain: "askloyal.com",
  allowLocalhost: true,
  rpId: "askloyal.com",
  gridApiBaseUrl: "https://grid.squads.xyz",
  appName: "askloyal",
  authJwtSecret: "jwt-secret-jwt-secret-jwt-secret-123",
  authJwtTtlSeconds: 3600,
};

const fixedNow = new Date("2099-03-11T12:00:00.000Z");

function createDependencies() {
  return {
    getConfig: () => config,
    issueSessionToken: async () => "session-token",
    now: () => fixedNow,
    randomUUID: () => "nonce-1",
  };
}

describe("wallet auth service", () => {
  test("starts a wallet challenge", async () => {
    const keypair = nacl.sign.keyPair();
    const walletAddress = bs58.encode(keypair.publicKey);

    const response = await createWalletAuthChallenge(
      { walletAddress },
      { requestOrigin: "https://askloyal.com" },
      createDependencies()
    );

    expect(response.message).toContain(walletAddress);
    expect(response.message).toContain("This is not a transaction and will not cost gas.");
    expect(response.expiresAt).toBe("2099-03-11T12:10:00.000Z");
  });

  test("verifies wallet ownership and returns a wallet auth user", async () => {
    const keypair = nacl.sign.keyPair();
    const walletAddress = bs58.encode(keypair.publicKey);
    const dependencies = createDependencies();
    const started = await createWalletAuthChallenge(
      { walletAddress },
      { requestOrigin: "https://askloyal.com" },
      dependencies
    );
    const signature = bs58.encode(
      nacl.sign.detached(new TextEncoder().encode(started.message), keypair.secretKey)
    );

    const response = await completeWalletAuth(
      {
        challengeToken: started.challengeToken,
        signature,
      },
      { requestOrigin: "https://askloyal.com" },
      dependencies
    );

    expect(response.sessionToken).toBe("session-token");
    expect(response.user).toEqual({
      authMethod: "wallet",
      walletAddress,
      subjectAddress: walletAddress,
      displayAddress: walletAddress,
      provider: "solana",
    });
  });

  test("rejects invalid wallet signatures", async () => {
    const keypair = nacl.sign.keyPair();
    const otherKeypair = nacl.sign.keyPair();
    const walletAddress = bs58.encode(keypair.publicKey);
    const started = await createWalletAuthChallenge(
      { walletAddress },
      { requestOrigin: "https://askloyal.com" },
      createDependencies()
    );
    const signature = bs58.encode(
      nacl.sign.detached(
        new TextEncoder().encode(started.message),
        otherKeypair.secretKey
      )
    );

    await expect(
      completeWalletAuth(
        {
          challengeToken: started.challengeToken,
          signature,
        },
        { requestOrigin: "https://askloyal.com" },
        createDependencies()
      )
    ).rejects.toBeInstanceOf(WalletAuthError);
  });

  test("rejects wallet challenges from the wrong origin", async () => {
    const keypair = nacl.sign.keyPair();
    const walletAddress = bs58.encode(keypair.publicKey);
    const dependencies = createDependencies();
    const started = await createWalletAuthChallenge(
      { walletAddress },
      { requestOrigin: "https://askloyal.com" },
      dependencies
    );
    const signature = bs58.encode(
      nacl.sign.detached(new TextEncoder().encode(started.message), keypair.secretKey)
    );

    await expect(
      completeWalletAuth(
        {
          challengeToken: started.challengeToken,
          signature,
        },
        { requestOrigin: "https://malicious.example" },
        dependencies
      )
    ).rejects.toMatchObject<Partial<WalletAuthError>>({
      code: "invalid_wallet_origin",
      status: 403,
    });
  });
});
