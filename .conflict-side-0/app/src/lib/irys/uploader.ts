import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";

import { getIrysKeypair } from "./keypair";

export const getIrysUploader = async () => {
  const keypair = await getIrysKeypair();
  const irysUploader = await Uploader(Solana).withWallet(keypair);
  return irysUploader;
};
