import { LoyalPrivateTransactionsClient } from "@vladarbatov/private-transactions-test";

import { getConnection } from "../rpc/connection";
import { getWalletKeypair } from "../wallet/wallet-details";

const PER_RPC_ENDPOINT = "https://tee.magicblock.app";
const PER_WS_ENDPOINT = "wss://tee.magicblock.app";

export async function getBaseClient(): Promise<LoyalPrivateTransactionsClient> {
  const connection = getConnection();
  const keypair = await getWalletKeypair();
  return LoyalPrivateTransactionsClient.from(connection, keypair);
}

export async function getPerClient(): Promise<LoyalPrivateTransactionsClient> {
  const keypair = await getWalletKeypair();
  return await LoyalPrivateTransactionsClient.fromEphemeral({
    signer: keypair,
    rpcEndpoint: PER_RPC_ENDPOINT,
    wsEndpoint: PER_WS_ENDPOINT,
  });
}
