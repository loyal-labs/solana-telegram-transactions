import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import type { Command } from "@nillion/nuc";
import { Builder, Did, Signer } from "@nillion/nuc";
import { NucCmd, SecretVaultBuilderClient } from "@nillion/secretvaults";

import { getBuilderClient } from "./helpers";

export async function createCollection(
  collectionName: string,
  owned: boolean = false,
  schema: Record<string, unknown>
) {
  assert(schema, "Schema is required");
  assert(collectionName, "Collection name is required");
  assert(owned !== undefined, "Owned is required");

  const builderClient = await getBuilderClient();
  const collectionType = owned ? "owned" : "standard";
  const collectionId = randomUUID();

  const newCollection = await builderClient.createCollection({
    _id: collectionId,
    name: collectionName,
    type: collectionType,
    schema,
  });

  return newCollection;
}

export async function getCollections() {
  const builderClient = await getBuilderClient();
  const collections = await builderClient.readCollections();
  return collections;
}

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

  const delegationToken = await Builder.delegationFrom(rootToken)
    .issuer(builderDid)
    .audience(userDid)
    .subject(builderDid)
    .command(command)
    .expiresAt(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .signAndSerialize(builderSigner);

  return delegationToken;
}
