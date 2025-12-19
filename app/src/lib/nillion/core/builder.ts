import type { Command } from "@nillion/nuc";
import { Builder, Did, Signer } from "@nillion/nuc";
import { NucCmd, SecretVaultBuilderClient } from "@nillion/secretvaults";

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
