import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Keypair } from "@solana/web3.js";

export const getIrysKeypair = async (): Promise<Keypair> => {
  const privateKey = process.env.IRYS_SOLANA_KEY;
  if (!privateKey) {
    throw new Error("IRYS_SOLANA_KEY is not set");
  }
  return Keypair.fromSecretKey(bs58.decode(privateKey));
};
