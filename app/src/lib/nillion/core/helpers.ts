import { Did } from "@nillion/nuc";
import base58 from "bs58";
import { Buffer } from "buffer";

export const getUserDidFromSolanaPublicKey = (publicKey: string): Did => {
  console.debug("Getting user DID from Solana public key: %s", publicKey);
  const userPublicKeyBytes = base58.decode(publicKey);
  const userPublicKeyHex = Buffer.from(userPublicKeyBytes).toString("hex");
  return Did.fromPublicKey(userPublicKeyHex, "key");
};
