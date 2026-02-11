import { subscribeToWalletAssetChanges } from "../wallet/subscribe-wallet-asset-changes";
import { fetchTokenHoldings } from "./fetch-token-holdings";
import type { TokenHolding } from "./types";

export type SubscribeToTokenHoldingsOptions = {
  commitment?: "processed" | "confirmed" | "finalized";
  debounceMs?: number;
  includeNative?: boolean;
  emitInitial?: boolean;
  onError?: (error: unknown) => void;
};

const DEFAULT_DEBOUNCE_MS = 750;

const reportError = (
  error: unknown,
  message: string,
  onError?: (error: unknown) => void
) => {
  if (!onError) {
    console.error(message, error);
    return;
  }

  try {
    onError(error);
  } catch (handlerError) {
    console.error("Error in token holdings error handler", handlerError);
  }
};

export async function subscribeToTokenHoldings(
  walletAddress: string,
  onHoldings: (holdings: TokenHolding[]) => void,
  options: SubscribeToTokenHoldingsOptions = {}
): Promise<() => Promise<void>> {
  const commitment = options.commitment ?? "confirmed";
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const includeNative = options.includeNative ?? true;
  const emitInitial = options.emitInitial ?? true;
  const onError = options.onError;

  let closed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let isFetching = false;
  let hasPendingRefresh = false;
  let pendingForceRefresh = false;

  const scheduleFlush = () => {
    if (closed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void flushPendingRefresh();
    }, debounceMs);
  };

  const flushPendingRefresh = async () => {
    if (closed || isFetching || !hasPendingRefresh) {
      return;
    }

    const forceRefresh = pendingForceRefresh;
    hasPendingRefresh = false;
    pendingForceRefresh = false;
    isFetching = true;

    try {
      const holdings = await fetchTokenHoldings(walletAddress, forceRefresh);
      if (closed) return;
      onHoldings(holdings);
    } catch (error) {
      reportError(error, "Failed to refresh token holdings", onError);
    } finally {
      isFetching = false;
      if (closed || !hasPendingRefresh) return;

      if (debounceMs <= 0) {
        void flushPendingRefresh();
      } else {
        scheduleFlush();
      }
    }
  };

  const requestRefresh = (forceRefresh: boolean) => {
    if (closed) return;

    hasPendingRefresh = true;
    pendingForceRefresh = pendingForceRefresh || forceRefresh;

    if (isFetching) return;

    if (debounceMs <= 0) {
      void flushPendingRefresh();
      return;
    }

    scheduleFlush();
  };

  const unsubscribe = await subscribeToWalletAssetChanges(
    walletAddress,
    () => {
      requestRefresh(true);
    },
    {
      debounceMs: 0,
      commitment,
      includeNative,
    }
  );

  if (emitInitial) {
    requestRefresh(false);
    if (debounceMs > 0 && timer) {
      clearTimeout(timer);
      timer = null;
    }
    void flushPendingRefresh();
  }

  return async () => {
    closed = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    await unsubscribe();
  };
}
