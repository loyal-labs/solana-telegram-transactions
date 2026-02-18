import { PublicKey } from "@solana/web3.js";
import {
  DELEGATION_PROGRAM_ID,
  ER_VALIDATOR,
  findUsernameDepositPda,
} from "@vladarbatov/private-transactions-test";

import { getWalletKeypair } from "../wallet/wallet-details";
import { waitForAccount } from "./loyal-deposits";
import { getPrivateClient } from "./private-client";

export async function transferTokensToUsername(params: {
  tokenMint: PublicKey;
  amount: number;
  destinationUsername: string;
}): Promise<string> {
  const startTime = Date.now();
  console.log("> transferTokensToUsername");
  const keypair = await getWalletKeypair();
  const client = await getPrivateClient();
  const { tokenMint, amount, destinationUsername } = params;

  const existingBaseUsernameDeposit = await client.getBaseUsernameDeposit(
    destinationUsername,
    tokenMint
  );
  const existingEphemeralUsernameDeposit =
    await client.getEphemeralUsernameDeposit(destinationUsername, tokenMint);

  if (!existingBaseUsernameDeposit && !existingEphemeralUsernameDeposit) {
    console.log("initializeUsernameDeposit");
    const initializeUsernameDepositSig = await client.initializeUsernameDeposit(
      {
        tokenMint,
        username: destinationUsername,
        payer: keypair.publicKey,
      }
    );
    console.log("initializeUsernameDeposit sig", initializeUsernameDepositSig);
    const [depositPda] = findUsernameDepositPda(destinationUsername, tokenMint);
    await waitForAccount(client, depositPda);
  }

  const [depositPda] = findUsernameDepositPda(destinationUsername, tokenMint);
  const baseAccountInfo =
    await client.baseProgram.provider.connection.getAccountInfo(depositPda);
  const isDelegated = baseAccountInfo?.owner.equals(DELEGATION_PROGRAM_ID);

  if (!isDelegated) {
    console.log("delegateUsernameDeposit");
    const delegateUsernameDepositSig = await client.delegateUsernameDeposit({
      tokenMint,
      username: destinationUsername,
      payer: keypair.publicKey,
      validator: ER_VALIDATOR,
    });
    console.log("delegateUsernameDeposit sig", delegateUsernameDepositSig);
  }

  console.log("transferToUsernameDeposit");
  const transferToUsernameDepositSig = await client.transferToUsernameDeposit({
    username: destinationUsername,
    user: keypair.publicKey,
    tokenMint,
    amount,
    payer: keypair.publicKey,
  });
  console.log("transferToUsernameDeposit sig", transferToUsernameDepositSig);

  console.log(`< transferTokensToUsername (${Date.now() - startTime}ms)`);

  return transferToUsernameDepositSig;
}
