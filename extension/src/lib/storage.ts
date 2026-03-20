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

/** Auto-lock timeout in minutes. 0 = never. */
export const autoLockTimeout = storage.defineItem<number>(
  "local:autoLockTimeout",
  { fallback: 15 },
);

/** Extension view mode: sidebar or popup */
export const viewMode = storage.defineItem<"sidebar" | "popup">(
  "local:viewMode",
  { fallback: "sidebar" },
);

/** Temporary session key for seamless view mode switching. Cleared after use. */
export const sessionKeypair = storage.defineItem<string | null>(
  "session:switchKeypair",
  { fallback: null },
);

/** Epoch ms of last user interaction while unlocked. */
export const lastActivityAt = storage.defineItem<number>(
  "session:lastActivityAt",
  { fallback: 0 },
);
