import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { SecretVaultBuilderClient } from "@nillion/secretvaults";

export async function createCollection(
  builderClient: SecretVaultBuilderClient,
  collectionName: string,
  owned: boolean = false,
  schema: Record<string, unknown>
) {
  assert(builderClient, "Builder client is required");
  assert(schema, "Schema is required");
  assert(collectionName, "Collection name is required");
  assert(owned !== undefined, "Owned is required");

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

export async function getCollections(builderClient: SecretVaultBuilderClient) {
  const collections = await builderClient.readCollections();
  return collections;
}
export async function getCollectionRecords(
  builderClient: SecretVaultBuilderClient,
  collectionId: string
) {
  const records = await builderClient.findData({
    collection: collectionId,
    filter: {},
  });
  return records;
}

export async function deleteCollection(
  builderClient: SecretVaultBuilderClient,
  collectionId: string
) {
  const collection = await builderClient.deleteCollection(collectionId);
  return collection;
}
