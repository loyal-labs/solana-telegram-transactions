import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchTokenHoldings,
  subscribeToTokenHoldings,
  type TokenHolding,
} from "@/lib/solana/token-holdings";

import { HOLDINGS_REFRESH_DEBOUNCE_MS } from "../wallet-cache";
import { MOCK_TOKEN_HOLDINGS, USE_MOCK_DATA } from "../wallet-mock-data";

export function useTokenHoldings(walletAddress: string | null): {
  tokenHoldings: TokenHolding[];
  isHoldingsLoading: boolean;
  refreshTokenHoldings: (forceRefresh?: boolean) => Promise<void>;
} {
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>(() =>
    USE_MOCK_DATA ? MOCK_TOKEN_HOLDINGS : []
  );
  const [isHoldingsLoading, setIsHoldingsLoading] = useState(() =>
    USE_MOCK_DATA ? false : true
  );

  const hasLoadedHoldingsRef = useRef(USE_MOCK_DATA);
  const walletAddressRef = useRef<string | null>(walletAddress);
  const holdingsFetchIdRef = useRef(0);

  useEffect(() => {
    walletAddressRef.current = walletAddress;
  }, [walletAddress]);

  const refreshTokenHoldings = useCallback(async (forceRefresh = false) => {
    const addr = walletAddressRef.current;
    if (!addr) return;

    const fetchId = ++holdingsFetchIdRef.current;

    if (!hasLoadedHoldingsRef.current) {
      setIsHoldingsLoading(true);
    }

    try {
      const holdings = await fetchTokenHoldings(addr, forceRefresh);
      if (walletAddressRef.current !== addr) return;
      if (holdingsFetchIdRef.current !== fetchId) return;
      setTokenHoldings(holdings);
      hasLoadedHoldingsRef.current = true;
    } catch (error) {
      console.error("Failed to fetch token holdings:", error);
    } finally {
      if (walletAddressRef.current !== addr) return;
      if (holdingsFetchIdRef.current !== fetchId) return;
      if (!hasLoadedHoldingsRef.current) {
        // If we never loaded successfully, keep showing skeleton.
        setIsHoldingsLoading(true);
      } else {
        setIsHoldingsLoading(false);
      }
    }
  }, []);

  // Fetch token holdings
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!walletAddress) return;

    hasLoadedHoldingsRef.current = false;
    setIsHoldingsLoading(true);
    setTokenHoldings([]);

    void refreshTokenHoldings(false);
  }, [refreshTokenHoldings, walletAddress]);

  // Keep holdings in sync with wallet asset websocket updates.
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!walletAddress) return;

    let isCancelled = false;
    let unsubscribe: (() => Promise<void>) | null = null;

    void (async () => {
      try {
        unsubscribe = await subscribeToTokenHoldings(
          walletAddress,
          (holdings) => {
            if (isCancelled) return;
            holdingsFetchIdRef.current += 1;
            setTokenHoldings(holdings);
            hasLoadedHoldingsRef.current = true;
            setIsHoldingsLoading(false);
          },
          {
            debounceMs: HOLDINGS_REFRESH_DEBOUNCE_MS,
            commitment: "confirmed",
            includeNative: true,
            emitInitial: false,
            onError: (error) => {
              console.error(
                "Failed to refresh token holdings from websocket",
                error
              );
            },
          }
        );
      } catch (error) {
        console.error("Failed to subscribe to token holdings", error);
      }
    })();

    return () => {
      isCancelled = true;
      if (unsubscribe) {
        void unsubscribe();
      }
    };
  }, [walletAddress]);

  return { tokenHoldings, isHoldingsLoading, refreshTokenHoldings };
}
