import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export type TelegramDeposit = {
  user: PublicKey;
  username: string;
  amount: number;
  lastNonce: number;
};
