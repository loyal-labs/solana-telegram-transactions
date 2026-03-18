import { storage } from "#imports";

export const networkSelection = storage.defineItem<"mainnet" | "devnet">(
  "local:network",
  { fallback: "mainnet" },
);

export const isWalletUnlocked = storage.defineItem<boolean>(
  "session:walletUnlocked",
  { fallback: false },
);

export const connectedExternalWallet = storage.defineItem<string | null>(
  "local:externalWalletPubkey",
  { fallback: null },
);

export const activeWalletSource = storage.defineItem<"builtin" | "external">(
  "local:walletSource",
  { fallback: "builtin" },
);

export const isBalanceHidden = storage.defineItem<boolean>(
  "local:balanceHidden",
  { fallback: false },
);
