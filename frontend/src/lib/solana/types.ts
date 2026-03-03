import type { SolanaSignInOutput } from "@solana/wallet-standard-features";
import type { WalletAccount } from "@wallet-standard/base";

export type SerializedWalletAccount = Omit<WalletAccount, "publicKey"> & {
  publicKey: number[];
};

export type SerializedSolanaSignInOutput = Omit<
  SolanaSignInOutput,
  "account" | "signedMessage" | "signature"
> & {
  account: SerializedWalletAccount;
  signedMessage: number[];
  signature: number[];
};
