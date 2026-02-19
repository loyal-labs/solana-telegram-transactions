import type React from "react";
import { useEffect, useRef, useState } from "react";

import { getWalletBalance } from "@/lib/solana/wallet/wallet-details";
import { ensureWalletKeypair } from "@/lib/solana/wallet/wallet-keypair-logic";

import {
  cachedWalletAddress,
  getCachedWalletBalance,
  hasCachedWalletData,
  setCachedWalletAddress,
  setCachedWalletBalance,
  walletBalanceListeners,
} from "../wallet-cache";
import { MOCK_WALLET_ADDRESS, USE_MOCK_DATA } from "../wallet-mock-data";

export function useWalletInit(): {
  walletAddress: string | null;
  setWalletAddress: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
} {
  const [walletAddress, setWalletAddress] = useState<string | null>(() =>
    USE_MOCK_DATA ? MOCK_WALLET_ADDRESS : cachedWalletAddress
  );
  const [isLoading, setIsLoading] = useState(() =>
    USE_MOCK_DATA ? false : !hasCachedWalletData()
  );
  const ensuredWalletRef = useRef(false);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (ensuredWalletRef.current) return;
    ensuredWalletRef.current = true;

    void (async () => {
      try {
        const { keypair, isNew: _isNew } = await ensureWalletKeypair();
        const publicKeyBase58 = keypair.publicKey.toBase58();

        // Store wallet address in module-level cache for future mounts
        setCachedWalletAddress(publicKeyBase58);
        setWalletAddress(publicKeyBase58);

        // Check if we already have cached balance (from previous visit)
        const cachedBalance = getCachedWalletBalance(publicKeyBase58);

        if (cachedBalance !== null) {
          // We have cache - state was already initialized from it
          // Just refresh in background without loading state
          setIsLoading(false);
          void getWalletBalance().then((freshBalance) => {
            setCachedWalletBalance(publicKeyBase58, freshBalance);
            walletBalanceListeners.forEach((listener) => listener(freshBalance));
          });
        } else {
          // First load - need to fetch balance
          const balanceLamports = await getWalletBalance();
          setCachedWalletBalance(publicKeyBase58, balanceLamports);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to ensure wallet keypair", error);
        setIsLoading(false);
      }
    })();
  }, []);

  return { walletAddress, setWalletAddress, isLoading };
}
