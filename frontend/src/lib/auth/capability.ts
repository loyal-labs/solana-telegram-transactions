"use client";

import { useWallet } from "@solana/wallet-adapter-react";

import { useAuthSession } from "@/contexts/auth-session-context";

export type AuthCapability =
  | "anonymous"
  | "emailAuthenticated"
  | "walletAuthenticated"
  | "emailAndWalletAuthenticated";

export function resolveAuthCapability(args: {
  hasEmailSession: boolean;
  hasWalletConnection: boolean;
}): AuthCapability {
  if (args.hasEmailSession && args.hasWalletConnection) {
    return "emailAndWalletAuthenticated";
  }

  if (args.hasEmailSession) {
    return "emailAuthenticated";
  }

  if (args.hasWalletConnection) {
    return "walletAuthenticated";
  }

  return "anonymous";
}

export function useAuthCapability() {
  const { connected } = useWallet();
  const { isAuthenticated, isHydrated } = useAuthSession();
  const capability = resolveAuthCapability({
    hasEmailSession: isAuthenticated,
    hasWalletConnection: connected,
  });

  return {
    capability,
    isHydrated,
    isSignedIn: capability !== "anonymous",
    hasWalletConnection: connected,
    hasEmailSession:
      capability === "emailAuthenticated" ||
      capability === "emailAndWalletAuthenticated",
  };
}
