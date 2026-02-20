import type React from "react";
import { useCallback, useEffect, useState } from "react";

import { getWalletBalance } from "@/lib/solana/wallet/wallet-details";

import {
  cachedWalletAddress,
  ensureWalletBalanceSubscription,
  getCachedWalletBalance,
  setCachedWalletBalance,
  walletBalanceListeners,
} from "../wallet-cache";
import {
  MOCK_BALANCE_LAMPORTS,
  USE_MOCK_DATA,
} from "../wallet-mock-data";

export function useWalletBalance(walletAddress: string | null): {
  solBalanceLamports: number | null;
  setSolBalanceLamports: React.Dispatch<React.SetStateAction<number | null>>;
  refreshBalance: (forceRefresh?: boolean) => Promise<void>;
} {
  const [solBalanceLamports, setSolBalanceLamports] = useState<number | null>(
    () =>
      USE_MOCK_DATA
        ? MOCK_BALANCE_LAMPORTS
        : cachedWalletAddress
        ? getCachedWalletBalance(cachedWalletAddress)
        : null
  );

  const refreshBalance = useCallback(
    async (forceRefresh = false) => {
      try {
        const balanceLamports = await getWalletBalance(forceRefresh);
        setCachedWalletBalance(walletAddress, balanceLamports);
        setSolBalanceLamports(balanceLamports);
      } catch (error) {
        console.error("Failed to refresh wallet balance", error);
      }
    },
    [walletAddress]
  );

  // Subscribe to websocket balance updates so inbound funds appear in real time
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!walletAddress) return;

    let isCancelled = false;

    const handleBalanceUpdate = (lamports: number) => {
      if (isCancelled) return;
      setSolBalanceLamports((prev) => (prev === lamports ? prev : lamports));
    };

    const cachedBalance = getCachedWalletBalance(walletAddress);
    if (cachedBalance !== null) {
      setSolBalanceLamports((prev) =>
        prev === cachedBalance ? prev : cachedBalance
      );
    }

    walletBalanceListeners.add(handleBalanceUpdate);

    void ensureWalletBalanceSubscription(walletAddress).catch((error) => {
      console.error("Failed to subscribe to wallet balance", error);
    });

    return () => {
      isCancelled = true;
      walletBalanceListeners.delete(handleBalanceUpdate);
    };
  }, [walletAddress]);

  return { solBalanceLamports, setSolBalanceLamports, refreshBalance };
}
