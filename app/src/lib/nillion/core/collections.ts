import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

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
