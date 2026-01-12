import assert from "node:assert/strict";

import { Did, Signer } from "@nillion/nuc";
import {
  AclDto,
  CreateOwnedDataRequest,
  ReadDataRequestParams,
  SecretVaultUserClient,
} from "@nillion/secretvaults";

import { NODE_DB_URLS } from "./constants";
import { USER_KEY } from "./constants";

let userSigner: Signer | null = null;
let userClient: SecretVaultUserClient | null = null;

export const getUserSigner = (): Signer => {
  if (!userSigner) {
    userSigner = Signer.fromPrivateKey(USER_KEY);
  }
  return userSigner;
};

export const getUserClient = async (
  userSigner: Signer
): Promise<SecretVaultUserClient> => {
  assert(userSigner, "User signer is required");
  if (!userClient) {
    userClient = await SecretVaultUserClient.from({
      signer: userSigner,
      baseUrls: NODE_DB_URLS,
      blindfold: { operation: "store" },
    });
  }
  return userClient;
};

export const uploadUserData = async (
  collectionId: string,
  delegationToken: string,
  builderDid: Did,
  userClient: SecretVaultUserClient,
  userData: Record<string, unknown>
) => {
  const builderDidString = await builderDid.didString;
  console.debug("Builder DID String: %s", builderDidString);

  const acl: AclDto = {
    grantee: builderDidString,
    read: true,
    write: false,
    execute: false,
  };
  console.debug("ACL: %s", acl);

  const createDataRequest: CreateOwnedDataRequest = {
    owner: await userClient.getId(),
    collection: collectionId,
    data: [userData],
    acl: acl,
  };

  const uploadResult = await userClient.createData(createDataRequest, {
    auth: {
      delegation: delegationToken,
    },
  });

  console.debug("Upload result: %s", uploadResult);

  return uploadResult;
};

export const readUserData = async (
  collectionId: string,
  recordId: string,
  userClient: SecretVaultUserClient
) => {
  const params: ReadDataRequestParams = {
    collection: collectionId,
    document: recordId,
  };
  const readResult = await userClient.readData(params);
  console.debug("Read result: %s", readResult);
  return readResult;
};
