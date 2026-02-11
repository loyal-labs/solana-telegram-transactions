import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Keypair } from "@solana/web3.js";

import { serverEnv } from "../core/config/server";

export const getIrysKeypair = async (): Promise<Keypair> => {
  const privateKey = serverEnv.irysSolanaKey;
  return Keypair.fromSecretKey(bs58.decode(privateKey));
};
