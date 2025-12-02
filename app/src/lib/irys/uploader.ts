import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";

export const getIrysUploader = async () => {
  const privateKey = process.env.IRYS_SOLANA_KEY;
  if (!privateKey) {
    throw new Error("IRYS_SOLANA_KEY is not set");
  }
  const irysUploader = await Uploader(Solana).withWallet(privateKey);
  return irysUploader;
};
