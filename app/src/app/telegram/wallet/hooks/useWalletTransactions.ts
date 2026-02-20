import { PublicKey } from "@solana/web3.js";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

import {
  getAccountTransactionHistory,
  listenForAccountTransactions,
} from "@/lib/solana/rpc/get-account-txn-history";
import type { WalletTransfer } from "@/lib/solana/rpc/types";
import type { Transaction } from "@/types/wallet";

import { cachedWalletAddress, walletTransactionsCache } from "../wallet-cache";
import { MOCK_WALLET_TRANSACTIONS, USE_MOCK_DATA } from "../wallet-mock-data";

export function useWalletTransactions(walletAddress: string | null): {
  walletTransactions: Transaction[];
  setWalletTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  isFetchingTransactions: boolean;
  loadWalletTransactions: (opts?: { force?: boolean }) => Promise<void>;
} {
  const [walletTransactions, setWalletTransactions] = useState<Transaction[]>(
    () =>
      USE_MOCK_DATA
        ? MOCK_WALLET_TRANSACTIONS
        : cachedWalletAddress
        ? walletTransactionsCache.get(cachedWalletAddress) ?? []
        : []
  );
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);

  const mapTransferToTransaction = useCallback(
    (transfer: WalletTransfer): Transaction => {
      const isIncoming = transfer.direction === "in";
      const counterparty =
        transfer.counterparty ||
        (isIncoming ? "Unknown sender" : "Unknown recipient");

      const base: Transaction = {
        id: transfer.signature,
        type: isIncoming ? "incoming" : "outgoing",
        transferType: transfer.type,
        amountLamports: transfer.amountLamports,
        tokenMint: transfer.tokenMint,
        tokenAmount: transfer.tokenAmount,
        tokenDecimals: transfer.tokenDecimals,
        sender: isIncoming ? counterparty : undefined,
        recipient: !isIncoming ? counterparty : undefined,
        timestamp: transfer.timestamp ?? Date.now(),
        networkFeeLamports: transfer.feeLamports,
        signature: transfer.signature,
        status: transfer.status === "failed" ? "error" : "completed",
      };

      if (transfer.type === "swap") {
        base.swapFromMint = transfer.swapFromMint;
        base.swapToMint = transfer.swapToMint;
        if (transfer.swapToAmount) {
          base.swapToAmount = parseFloat(transfer.swapToAmount);
        }
      }

      return base;
    },
    []
  );

  const loadWalletTransactions = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (!walletAddress) return;

      const cached = walletTransactionsCache.get(walletAddress);

      if (!force && cached) {
        // Use cached data immediately, no loading state
        setWalletTransactions(cached);
        return;
      }

      // Only show loading if we don't have cached data to display
      if (!cached) {
        setIsFetchingTransactions(true);
      }
      try {
        const { transfers } = await getAccountTransactionHistory(
          new PublicKey(walletAddress),
          {
            limit: 10,
            onlySystemTransfers: false,
          }
        );

        const mappedTransactions: Transaction[] = transfers.map(
          mapTransferToTransaction
        );

        setWalletTransactions((prev) => {
          const pending = prev.filter(
            (tx) => tx.type === "pending" && !tx.signature
          );
          const existingBySignature = new Map(
            prev
              .filter((tx) => tx.signature)
              .map((tx) => [tx.signature as string, tx])
          );

          const merged = mappedTransactions.map((tx) => {
            if (!tx.signature) return tx;
            const existing = existingBySignature.get(tx.signature);
            if (!existing) return tx;
            // Preserve app-injected swap data when on-chain data arrives
            if (
              existing.transferType === "swap" &&
              tx.transferType !== "swap"
            ) {
              return { ...tx, ...existing };
            }
            return { ...existing, ...tx };
          });

          const combined = [...pending, ...merged].sort(
            (a, b) => b.timestamp - a.timestamp
          );
          walletTransactionsCache.set(walletAddress, combined);
          return combined;
        });
      } catch (error) {
        console.error("Failed to fetch wallet transactions", error);
      } finally {
        setIsFetchingTransactions(false);
      }
    },
    [mapTransferToTransaction, walletAddress]
  );

  // Initial transaction load
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!walletAddress) return;
    void loadWalletTransactions();
  }, [walletAddress, loadWalletTransactions]);

  // Subscribe to websocket transaction updates
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!walletAddress) return;

    let isCancelled = false;
    let unsubscribe: (() => Promise<void>) | null = null;

    void (async () => {
      try {
        unsubscribe = await listenForAccountTransactions(
          new PublicKey(walletAddress),
          (transfer) => {
            if (isCancelled) return;
            const mapped = mapTransferToTransaction(transfer);
            setWalletTransactions((prev) => {
              const next = [...prev];

              const matchIndex = mapped.signature
                ? next.findIndex((tx) => tx.signature === mapped.signature)
                : next.findIndex((tx) => tx.id === mapped.id);

              if (matchIndex >= 0) {
                const existing = next[matchIndex];
                // Preserve app-injected swap data when on-chain data arrives
                if (
                  existing.transferType === "swap" &&
                  mapped.transferType !== "swap"
                ) {
                  next[matchIndex] = { ...mapped, ...existing };
                } else {
                  next[matchIndex] = { ...existing, ...mapped };
                }
              } else {
                next.unshift(mapped);
              }

              const sorted = next.sort((a, b) => b.timestamp - a.timestamp);
              walletTransactionsCache.set(walletAddress, sorted);
              return sorted;
            });
          },
          { onlySystemTransfers: false }
        );
      } catch (error) {
        console.error("Failed to subscribe to transaction updates", error);
      }
    })();

    return () => {
      isCancelled = true;
      if (unsubscribe) {
        void unsubscribe();
      }
    };
  }, [mapTransferToTransaction, walletAddress]);

  return {
    walletTransactions,
    setWalletTransactions,
    isFetchingTransactions,
    loadWalletTransactions,
  };
}
