import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export type TelegramSessionData = {
  userWallet: PublicKey;
  username: string;
  validationBytes: Buffer<ArrayBufferLike>;
  verified: boolean;
  authAt: number;
  verifiedAt: number | null;
};
