export type GaslessRequest = {
  serializedTransaction: string;
  sender: string;
  recipient: string;
  username: string;
  amountLamports: number;
  processedInitData: string;
  telegramSignature: string;
  telegramPublicKey: string;
};
