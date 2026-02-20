import { hapticFeedback } from "@telegram-apps/sdk-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

import { TELEGRAM_PUBLIC_KEY_PROD_UINT8ARRAY } from "@/lib/constants";
import { track } from "@/lib/core/analytics";
import { subscribeToDepositsWithUsername } from "@/lib/solana/deposits";
import { fetchDeposits } from "@/lib/solana/fetch-deposits";
import {
  prepareStoreInitDataTxn,
  sendStoreInitDataTxn,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verifyAndClaimDeposit,
} from "@/lib/solana/verify-and-claim-deposit";
import {
  getGaslessPublicKey,
  getWalletKeypair,
  getWalletProvider,
} from "@/lib/solana/wallet/wallet-details";
import { SimpleWallet } from "@/lib/solana/wallet/wallet-implementation";
import {
  cleanInitData,
  createValidationBytesFromRawInitData,
  parseUsernameFromInitData,
} from "@/lib/telegram/mini-app/init-data-transform";
import type { IncomingTransaction } from "@/types/wallet";

import {
  CLAIM_SOURCES,
  type ClaimSource,
  WALLET_ANALYTICS_EVENTS,
  WALLET_ANALYTICS_PATH,
} from "../wallet-analytics";
import {
  cachedUsername,
  getCachedIncomingTransactions,
  mapDepositToIncomingTransaction,
  setCachedIncomingTransactions,
} from "../wallet-cache";
import { USE_MOCK_DATA } from "../wallet-mock-data";

export function useIncomingDeposits(params: {
  rawInitData: string | undefined;
  walletAddress: string | null;
  refreshBalance: (force?: boolean) => Promise<void>;
  loadWalletTransactions: (opts?: { force?: boolean }) => Promise<void>;
}): {
  incomingTransactions: IncomingTransaction[];
  setIncomingTransactions: React.Dispatch<
    React.SetStateAction<IncomingTransaction[]>
  >;
  isFetchingDeposits: boolean;
  isClaimingTransaction: boolean;
  showClaimSuccess: boolean;
  setShowClaimSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  claimError: string | null;
  setClaimError: React.Dispatch<React.SetStateAction<string | null>>;
  showConfetti: boolean;
  setShowConfetti: React.Dispatch<React.SetStateAction<boolean>>;
  handleApproveTransaction: (id: string, source: ClaimSource) => Promise<void>;
} {
  const { rawInitData, refreshBalance, loadWalletTransactions } = params;

  const [incomingTransactions, setIncomingTransactions] = useState<
    IncomingTransaction[]
  >(() => {
    const cached = cachedUsername
      ? getCachedIncomingTransactions(cachedUsername) ?? []
      : [];
    return cached;
  });
  const [isFetchingDeposits, setIsFetchingDeposits] = useState(() => {
    if (USE_MOCK_DATA) return false;
    // Only show loading if we don't have cached deposits
    return cachedUsername
      ? getCachedIncomingTransactions(cachedUsername) === null
      : true;
  });
  const [isClaimingTransaction, setIsClaimingTransaction] = useState(false);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleApproveTransaction = useCallback(
    async (transactionId: string, claimSource: ClaimSource) => {
      if (!rawInitData) {
        console.error("Cannot verify init data: raw init data missing");
        return;
      }

      const transaction = incomingTransactions.find(
        (tx) => tx.id === transactionId
      );
      if (!transaction) {
        console.warn("Transaction not found for approval:", transactionId);
        return;
      }

      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("medium");
      }
      setIsClaimingTransaction(true);
      try {
        const provider = await getWalletProvider();
        const keypair = await getWalletKeypair();
        const wallet = new SimpleWallet(keypair);
        const recipientPublicKey = provider.publicKey;

        const { validationBytes, signatureBytes } =
          createValidationBytesFromRawInitData(rawInitData);

        const username = transaction.username;
        const amountLamports = transaction.amountLamports;
        const payerPublicKey = await getGaslessPublicKey();
        console.log("payerPublicKey", payerPublicKey);

        const preparedStoreInitDataTxn = await prepareStoreInitDataTxn(
          provider,
          payerPublicKey,
          validationBytes,
          wallet
        );

        await sendStoreInitDataTxn(
          preparedStoreInitDataTxn,
          recipientPublicKey,
          username,
          amountLamports,
          validationBytes,
          signatureBytes,
          TELEGRAM_PUBLIC_KEY_PROD_UINT8ARRAY
        );

        setIncomingTransactions((prev) =>
          prev.filter((tx) => tx.id !== transactionId)
        );

        await refreshBalance(true);
        void loadWalletTransactions({ force: true });
        track(WALLET_ANALYTICS_EVENTS.claimFunds, {
          path: WALLET_ANALYTICS_PATH,
          claim_source: claimSource,
          transaction_id: transactionId,
          amount_lamports: amountLamports,
        });

        // Trigger confetti celebration
        setShowConfetti(true);
        setShowClaimSuccess(true);

        // Extended intense haptic pattern for celebration
        if (hapticFeedback.impactOccurred.isAvailable()) {
          // First burst
          hapticFeedback.impactOccurred("heavy");
          setTimeout(() => hapticFeedback.impactOccurred("heavy"), 80);
          setTimeout(() => hapticFeedback.impactOccurred("heavy"), 160);
          // Second burst
          setTimeout(() => hapticFeedback.impactOccurred("heavy"), 300);
          setTimeout(() => hapticFeedback.impactOccurred("heavy"), 380);
          setTimeout(() => hapticFeedback.impactOccurred("heavy"), 460);
          // Third burst
          setTimeout(() => hapticFeedback.impactOccurred("heavy"), 600);
          setTimeout(() => hapticFeedback.impactOccurred("heavy"), 680);
          setTimeout(() => hapticFeedback.impactOccurred("heavy"), 760);
          // Final burst
          setTimeout(() => hapticFeedback.impactOccurred("heavy"), 900);
          setTimeout(() => hapticFeedback.impactOccurred("heavy"), 980);
          setTimeout(() => hapticFeedback.impactOccurred("heavy"), 1060);
        }
      } catch (error) {
        console.error("Failed to claim transaction", error);
        if (hapticFeedback.notificationOccurred.isAvailable()) {
          hapticFeedback.notificationOccurred("error");
        }

        // Set error message and show error state
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.";
        setClaimError(errorMessage);
      } finally {
        setIsClaimingTransaction(false);
      }
    },
    [incomingTransactions, rawInitData, refreshBalance, loadWalletTransactions]
  );

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!rawInitData) {
      setIsFetchingDeposits(false);
      return;
    }

    let isCancelled = false;
    let unsubscribe: (() => Promise<void>) | null = null;

    const subscribeAndFetchDeposits = async () => {
      try {
        const cleanInitDataResult = cleanInitData(rawInitData);
        const username = parseUsernameFromInitData(cleanInitDataResult);

        if (!username) {
          setIncomingTransactions([]);
          setIsFetchingDeposits(false);
          return;
        }

        // Check cache first - state may have been initialized from it
        const cached = getCachedIncomingTransactions(username);
        if (cached !== null) {
          // Use cached data, refresh in background
          setIncomingTransactions(cached);
          setIsFetchingDeposits(false);
        }

        const provider = await getWalletProvider();
        console.log("Fetching deposits for username:", username);
        const deposits = await fetchDeposits(
          provider.wallet.publicKey,
          username
        );
        console.log("Deposits fetched:", deposits.length, deposits);
        if (isCancelled) {
          return;
        }

        const mappedTransactions = deposits.map(
          mapDepositToIncomingTransaction
        );

        setCachedIncomingTransactions(username, mappedTransactions);
        setIncomingTransactions(mappedTransactions);

        unsubscribe = await subscribeToDepositsWithUsername(
          provider.wallet.publicKey,
          username,
          (deposit) => {
            if (isCancelled) {
              return;
            }
            const mapped = mapDepositToIncomingTransaction(deposit);
            setIncomingTransactions((prev) => {
              const existingIndex = prev.findIndex((tx) => tx.id === mapped.id);
              let next: IncomingTransaction[];
              if (existingIndex >= 0) {
                next = [...prev];
                next[existingIndex] = mapped;
              } else {
                next = [mapped, ...prev];
              }
              setCachedIncomingTransactions(username, next);
              return next;
            });
          }
        );
      } catch (error) {
        console.error("Failed to fetch deposits", error);
      } finally {
        if (!isCancelled) {
          setIsFetchingDeposits(false);
        }
      }
    };

    void subscribeAndFetchDeposits();

    return () => {
      isCancelled = true;
      if (unsubscribe) {
        void unsubscribe().catch((error) =>
          console.error("Failed to remove deposit subscription", error)
        );
      }
    };
  }, [rawInitData]);

  // Auto-claim incoming transactions
  useEffect(() => {
    // Don't auto-claim if already claiming or no transactions
    if (isClaimingTransaction || incomingTransactions.length === 0) {
      return;
    }

    // Auto-claim the first available transaction
    const firstTransaction = incomingTransactions[0];
    if (firstTransaction) {
      void handleApproveTransaction(firstTransaction.id, CLAIM_SOURCES.auto);
    }
  }, [incomingTransactions, isClaimingTransaction, handleApproveTransaction]);

  return {
    incomingTransactions,
    setIncomingTransactions,
    isFetchingDeposits,
    isClaimingTransaction,
    showClaimSuccess,
    setShowClaimSuccess,
    claimError,
    setClaimError,
    showConfetti,
    setShowConfetti,
    handleApproveTransaction,
  };
}
