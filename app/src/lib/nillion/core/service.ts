import { createDelegationToken } from "./builder";
import {
  getBuilderClient,
  getBuilderSigner,
  getUserDidFromSolanaPublicKey,
} from "./helpers";

export const getDelegationToken = async (publicKey: string) => {
  console.debug("Getting delegation token for public key: %s", publicKey);
  const userDid = getUserDidFromSolanaPublicKey(publicKey);
  const builderClient = await getBuilderClient();
  const builderSigner = getBuilderSigner();
  const delegationToken = await createDelegationToken(
    userDid,
    builderClient,
    builderSigner
  );
  return delegationToken;
};
