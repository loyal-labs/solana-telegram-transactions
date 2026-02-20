import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getWalletBalance,
  resetWalletKeypairCache,
} from "@/lib/solana/wallet/wallet-details";
import {
  CloudStorageUnavailableError,
  ensureWalletKeypair,
} from "@/lib/solana/wallet/wallet-keypair-logic";

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
  walletError: string | null;
  retryWalletInit: () => void;
} {
  const [walletAddress, setWalletAddress] = useState<string | null>(() =>
    USE_MOCK_DATA ? MOCK_WALLET_ADDRESS : cachedWalletAddress
  );
  const [isLoading, setIsLoading] = useState(() =>
    USE_MOCK_DATA ? false : !hasCachedWalletData()
  );
  const [walletError, setWalletError] = useState<string | null>(null);
  const ensuredWalletRef = useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  const initWallet = useCallback(async () => {
    setIsLoading(true);
    setWalletError(null);

    try {
      const { keypair } = await ensureWalletKeypair();
      const publicKeyBase58 = keypair.publicKey.toBase58();

      setCachedWalletAddress(publicKeyBase58);
      setWalletAddress(publicKeyBase58);

      const cachedBalance = getCachedWalletBalance(publicKeyBase58);

      if (cachedBalance !== null) {
        setIsLoading(false);
        void getWalletBalance().then((freshBalance) => {
          setCachedWalletBalance(publicKeyBase58, freshBalance);
          walletBalanceListeners.forEach((listener) => listener(freshBalance));
        });
      } else {
        const balanceLamports = await getWalletBalance();
        setCachedWalletBalance(publicKeyBase58, balanceLamports);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to ensure wallet keypair", error);

      if (error instanceof CloudStorageUnavailableError) {
        setWalletError(
          "Couldn't access your wallet storage. Please try again."
        );
      } else {
        setWalletError("Something went wrong loading your wallet.");
      }

      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (USE_MOCK_DATA) return;

    // On retry, reset the guard and caches
    if (retryCount > 0) {
      ensuredWalletRef.current = false;
      resetWalletKeypairCache();
    }

    if (ensuredWalletRef.current) return;
    ensuredWalletRef.current = true;

    void initWallet();
  }, [retryCount, initWallet]);

  const retryWalletInit = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  return { walletAddress, setWalletAddress, isLoading, walletError, retryWalletInit };
}
