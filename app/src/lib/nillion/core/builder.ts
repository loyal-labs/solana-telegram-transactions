import assert from "node:assert/strict";

import type { Command, NilauthClient } from "@nillion/nuc";
import { Builder, Did, Signer } from "@nillion/nuc";
import { Eip712Signer } from "@nillion/nuc";
import {
  NucCmd,
  SecretVaultBuilderClient,
  SecretVaultUserClient,
} from "@nillion/secretvaults";
import { Wallet } from "ethers";
import { ethers } from "ethers";

import { BUILDER_KEY, BUILDER_NAME, NODE_DB_URLS } from "./constants";

let builderClient: SecretVaultBuilderClient | null = null;
let builderAsUserClient: SecretVaultUserClient | null = null;

export const getBuilderWallet = (): ethers.Wallet => {
  const privateKey = BUILDER_KEY;
  assert(privateKey, "NILLION_PRIVATE_KEY_HEX is not set");

  return new ethers.Wallet(privateKey);
};

export const registerBuilder = async (
  builderClient: SecretVaultBuilderClient
): Promise<void> => {
  try {
    const builderProfile = await builderClient.readProfile();
    console.log(
      "Using existing builderClient profile:",
      builderProfile.data._id
    );
  } catch {
    // Profile doesn't exist, register the builderClient
    try {
      const builderDid = await builderClient.getDid();
      await builderClient.register({
        did: builderDid.didString,
        name: BUILDER_NAME,
      });
      console.log(
        `1 time builderClient profile registration complete for ${builderDid.didString}`
      );
    } catch (error) {
      // Ignore DuplicateEntryError - builder is already registered
      const errorString = JSON.stringify(error);
      if (!errorString.includes("DuplicateEntryError")) {
        console.log("Here!");
        console.log("Error: %s", JSON.stringify(error, null, 2));
        throw error;
      }
      console.log("Builder already registered, continuing...");
    }
  }
};

export const getBuilderClient = async (
  builderSigner: Signer,
  nilAuthClient: NilauthClient
): Promise<SecretVaultBuilderClient> => {
  if (!builderClient) {
    builderClient = await SecretVaultBuilderClient.from({
      signer: builderSigner,
      nilauthClient: nilAuthClient,
      dbs: NODE_DB_URLS,
    });
    await builderClient.refreshRootToken();
  }
  await registerBuilder(builderClient);
  return builderClient;
};

export const getBuilderAsUserClient = async (
  builderSigner: Signer
): Promise<SecretVaultUserClient> => {
  if (!builderAsUserClient) {
    builderAsUserClient = await SecretVaultUserClient.from({
      signer: builderSigner,
      baseUrls: NODE_DB_URLS,
      blindfold: { operation: "store" },
    });
  }

  return builderAsUserClient;
};

export async function createDelegationToken(
  userDid: Did,
  builderClient: SecretVaultBuilderClient,
  builderSigner: Signer,
  expiresInMinutes: number = 2880,
  command: Command = NucCmd.nil.db.data.create
): Promise<string> {
  const expiresInSeconds = expiresInMinutes * 60;
  const builderDid = await builderClient.getDid();
  const rootToken = builderClient.rootToken;
  const expiresAt = Date.now() + expiresInSeconds;

  const delegationToken = await Builder.delegationFrom(rootToken)
    .issuer(builderDid)
    .audience(userDid)
    .subject(builderDid)
    .command(command)
    .expiresAt(expiresAt)
    .signAndSerialize(builderSigner);

  return delegationToken;
}
