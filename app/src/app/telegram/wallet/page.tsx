"use client";

import { hashes } from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import NumberFlow from "@number-flow/react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  closingBehavior,
  hapticFeedback,
  mainButton,
  retrieveLaunchParams,
  secondaryButton,
  useRawInitData,
  useSignal,
  viewport,
} from "@telegram-apps/sdk-react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ChevronRight, Clock, Copy, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ScanIcon } from "@/components/ui/icons/ScanIcon";
import { ActionButton } from "@/components/wallet/ActionButton";
import ActivitySheet from "@/components/wallet/ActivitySheet";
import ClaimFreeTransactionsSheet from "@/components/wallet/ClaimFreeTransactionsSheet";
import GaslessBanner from "@/components/wallet/GaslessBanner";
import ReceiveSheet from "@/components/wallet/ReceiveSheet";
import SendSheet, {
  addRecentRecipient,
  isValidSolanaAddress,
  isValidTelegramUsername,
} from "@/components/wallet/SendSheet";
import TransactionDetailsSheet from "@/components/wallet/TransactionDetailsSheet";
import { useTelegramSafeArea } from "@/hooks/useTelegramSafeArea";
import {
  DISPLAY_CURRENCY_KEY,
  SOL_PRICE_USD,
  TELEGRAM_BOT_ID,
  TELEGRAM_PUBLIC_KEY_PROD_UINT8ARRAY,
} from "@/lib/constants";
import { fetchInvoiceState } from "@/lib/irys/fetch-invoice-state";
import { topUpDeposit } from "@/lib/solana/deposits";
import { fetchDeposits } from "@/lib/solana/fetch-deposits";
import { fetchSolUsdPrice } from "@/lib/solana/fetch-sol-price";
import {
  getAccountTransactionHistory,
  listenForAccountTransactions,
} from "@/lib/solana/rpc/get-account-txn-history";
import type { WalletTransfer } from "@/lib/solana/rpc/types";
import { getTelegramTransferProgram } from "@/lib/solana/solana-helpers";
import { verifyAndClaimDeposit } from "@/lib/solana/verify-and-claim-deposit";
import {
  formatAddress,
  formatBalance,
  formatSenderAddress,
  formatTransactionAmount,
  formatUsdValue,
} from "@/lib/solana/wallet/formatters";
import {
  getWalletBalance,
  getWalletKeypair,
  getWalletProvider,
  getWalletPublicKey,
  sendSolTransaction,
  subscribeToWalletBalance,
} from "@/lib/solana/wallet/wallet-details";
import { SimpleWallet } from "@/lib/solana/wallet/wallet-implementation";
import { ensureWalletKeypair } from "@/lib/solana/wallet/wallet-keypair-logic";
import { initTelegram, sendString } from "@/lib/telegram/mini-app";
import {
  hideMainButton,
  hideSecondaryButton,
  showMainButton,
  showReceiveShareButton,
} from "@/lib/telegram/mini-app/buttons";
import {
  getCloudValue,
  setCloudValue,
} from "@/lib/telegram/mini-app/cloud-storage";
import {
  GaslessState,
  getGaslessState,
} from "@/lib/telegram/mini-app/cloud-storage-gassless";
import {
  cleanInitData,
  createValidationBytesFromRawInitData,
  createValidationString,
  validateInitData,
} from "@/lib/telegram/mini-app/init-data-transform";
import { parseUsernameFromInitData } from "@/lib/telegram/mini-app/init-data-transform";
import { openInvoice } from "@/lib/telegram/mini-app/invoice";
import { openQrScanner } from "@/lib/telegram/mini-app/qr-code";
import { ensureTelegramTheme } from "@/lib/telegram/mini-app/theme";
import type {
  IncomingTransaction,
  Transaction,
  TransactionDetailsData,
} from "@/types/wallet";

hashes.sha512 = sha512;

const walletTransactionsCache = new Map<string, Transaction[]>();
const walletBalanceCache = new Map<string, number>();
const walletBalanceListeners = new Set<(lamports: number) => void>();
let walletBalanceSubscriptionPromise: Promise<() => Promise<void>> | null =
  null;

const getCachedWalletBalance = (
  walletAddress: string | null
): number | null => {
  if (!walletAddress) return null;
  const cached = walletBalanceCache.get(walletAddress);
  return typeof cached === "number" ? cached : null;
};

const setCachedWalletBalance = (
  walletAddress: string | null,
  lamports: number
): void => {
  if (!walletAddress) return;
  walletBalanceCache.set(walletAddress, lamports);
};

const ensureWalletBalanceSubscription = async (walletAddress: string) => {
  if (walletBalanceSubscriptionPromise) {
    return walletBalanceSubscriptionPromise;
  }

  walletBalanceSubscriptionPromise = subscribeToWalletBalance((lamports) => {
    setCachedWalletBalance(walletAddress, lamports);
    walletBalanceListeners.forEach((listener) => listener(lamports));
  }).catch((error) => {
    walletBalanceSubscriptionPromise = null;
    throw error;
  });

  return walletBalanceSubscriptionPromise;
};

// SOL price cache (shared across page visits)
let cachedSolPriceUsd: number | null = null;
let solPriceFetchedAt: number | null = null;
const SOL_PRICE_CACHE_TTL = 60_000; // 1 minute

const getCachedSolPrice = (): number | null => {
  if (cachedSolPriceUsd === null || solPriceFetchedAt === null) return null;
  // Return cached price if within TTL
  if (Date.now() - solPriceFetchedAt < SOL_PRICE_CACHE_TTL) {
    return cachedSolPriceUsd;
  }
  return cachedSolPriceUsd; // Still return stale price, but allow refresh
};

const setCachedSolPrice = (price: number): void => {
  cachedSolPriceUsd = price;
  solPriceFetchedAt = Date.now();
};

// Stars balance cache (keyed by wallet address)
const starsBalanceCache = new Map<string, number>();

const getCachedStarsBalance = (walletAddress: string | null): number | null => {
  if (!walletAddress) return null;
  const cached = starsBalanceCache.get(walletAddress);
  return typeof cached === "number" ? cached : null;
};

const setCachedStarsBalance = (
  walletAddress: string | null,
  stars: number
): void => {
  if (!walletAddress) return;
  starsBalanceCache.set(walletAddress, stars);
};

// Incoming transactions cache (keyed by username)
let cachedUsername: string | null = null;
const incomingTransactionsCache = new Map<string, IncomingTransaction[]>();

const getCachedIncomingTransactions = (
  username: string | null
): IncomingTransaction[] | null => {
  if (!username) return null;
  return incomingTransactionsCache.get(username) ?? null;
};

const setCachedIncomingTransactions = (
  username: string | null,
  txns: IncomingTransaction[]
): void => {
  if (!username) return;
  cachedUsername = username;
  incomingTransactionsCache.set(username, txns);
};

// Track wallet address at module level for cache lookups on remount
let cachedWalletAddress: string | null = null;

// Display currency preference cache
let cachedDisplayCurrency: "USD" | "SOL" | null = null;

// Check if we have enough cached data to skip loading
const hasCachedWalletData = (): boolean => {
  if (!cachedWalletAddress) return false;
  const hasBalance = getCachedWalletBalance(cachedWalletAddress) !== null;
  const hasPrice = getCachedSolPrice() !== null;
  return hasBalance && hasPrice;
};

export default function Home() {
  const rawInitData = useRawInitData();
  const { bottom: _safeBottom } = useTelegramSafeArea();
  // Get device safe area only (not content safe area) to align with native header buttons
  const safeAreaInsetTop = useSignal(viewport.safeAreaInsetTop);
  const [isSendSheetOpen, setSendSheetOpen] = useState(false);
  const [sendStep, setSendStep] = useState<1 | 2 | 3 | 4>(1);
  const [sentAmountSol, setSentAmountSol] = useState<number | undefined>(
    undefined
  );
  const [sendError, setSendError] = useState<string | null>(null);
  const [isReceiveSheetOpen, setReceiveSheetOpen] = useState(false);
  const [isActivitySheetOpen, setActivitySheetOpen] = useState(false);
  const [isTransactionDetailsSheetOpen, setTransactionDetailsSheetOpen] =
    useState(false);
  const [isClaimFreeSheetOpen, setIsClaimFreeSheetOpen] = useState(false);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [buttonRefreshTick, setButtonRefreshTick] = useState(0);
  const [needsGas, setNeedsGas] = useState(false);
  const [gaslessState, setGaslessState] = useState<GaslessState | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(
    () => cachedWalletAddress
  );
  const [balance, setBalance] = useState<number | null>(() =>
    cachedWalletAddress ? getCachedWalletBalance(cachedWalletAddress) : null
  );
  const [starsBalance, setStarsBalance] = useState<number>(() =>
    cachedWalletAddress ? getCachedStarsBalance(cachedWalletAddress) ?? 0 : 0
  );
  const [isStarsLoading, setIsStarsLoading] = useState(
    () =>
      !cachedWalletAddress ||
      getCachedStarsBalance(cachedWalletAddress) === null
  );
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isLoading, setIsLoading] = useState(() => !hasCachedWalletData());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [incomingTransactions, setIncomingTransactions] = useState<
    IncomingTransaction[]
  >(() => {
    const cached = cachedUsername ? getCachedIncomingTransactions(cachedUsername) ?? [] : [];
    return cached;
  });
  const [walletTransactions, setWalletTransactions] = useState<Transaction[]>(
    () =>
      cachedWalletAddress
        ? walletTransactionsCache.get(cachedWalletAddress) ?? []
        : []
  );
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDetailsData | null>(null);
  // Keep original incoming transaction for claim functionality
  const [selectedIncomingTransaction, setSelectedIncomingTransaction] =
    useState<IncomingTransaction | null>(null);
  const [isSendFormValid, setIsSendFormValid] = useState(false);
  const [isClaimingTransaction, setIsClaimingTransaction] = useState(false);
  const [claimingTransactionId, setClaimingTransactionId] = useState<
    string | null
  >(null);
  const [sendFormValues, setSendFormValues] = useState<{
    amount: string;
    recipient: string;
  }>({
    amount: "",
    recipient: "",
  });
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "SOL">(
    () => cachedDisplayCurrency ?? "USD"
  );
  const [addressCopied, setAddressCopied] = useState(false);
  const [isMobilePlatform, setIsMobilePlatform] = useState(false);
  const [solPriceUsd, setSolPriceUsd] = useState<number | null>(() =>
    getCachedSolPrice()
  );
  const [isSolPriceLoading, setIsSolPriceLoading] = useState(
    () => getCachedSolPrice() === null
  );

  const mainButtonAvailable = useSignal(mainButton.setParams.isAvailable);
  const secondaryButtonAvailable = useSignal(
    secondaryButton.setParams.isAvailable
  );
  const ensuredWalletRef = useRef(false);

  // Track seen transaction IDs to detect new ones for animation
  const seenTransactionIdsRef = useRef<Set<string>>(new Set());
  const [newTransactionIds, setNewTransactionIds] = useState<Set<string>>(
    new Set()
  );

  // Sticky balance pill state
  const balanceRef = useRef<HTMLDivElement>(null);
  const [showStickyBalance, setShowStickyBalance] = useState(false);

  const handleOpenSendSheet = useCallback((recipientName?: string) => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setSendStep(1); // Reset step
    if (recipientName) {
      setSelectedRecipient(recipientName);
      setSendFormValues({ amount: "", recipient: recipientName });
    } else {
      setSelectedRecipient("");
      setSendFormValues({ amount: "", recipient: "" });
    }
    setSendSheetOpen(true);
  }, []);

  const handleOpenReceiveSheet = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setReceiveSheetOpen(true);
  }, []);

  const handleGaslessStateChange = useCallback((state: GaslessState) => {
    setGaslessState(state);
  }, []);

  const handleTopUpStars = useCallback(async () => {
    if (isCreatingInvoice) return;

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }

    if (!rawInitData) {
      console.error("Cannot create invoice: init data is missing");
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const serverHost = process.env.NEXT_PUBLIC_SERVER_HOST;
      const endpoint = (() => {
        // prefer same-origin to avoid CORS
        if (typeof window !== "undefined") {
          if (!serverHost) return "/api/telegram/invoice";
          try {
            const configured = new URL(serverHost);
            const current = new URL(window.location.origin);
            const hostsMatch =
              configured.protocol === current.protocol &&
              configured.host === current.host;
            return hostsMatch
              ? new URL("/api/telegram/invoice", configured).toString()
              : "/api/telegram/invoice";
          } catch {
            return "/api/telegram/invoice";
          }
        }
        // fall back to configured host if provided
        return serverHost
          ? new URL("/api/telegram/invoice", serverHost).toString()
          : "/api/telegram/invoice";
      })();

      const response = await fetch(endpoint, {
        method: "POST",
        body: new TextEncoder().encode(rawInitData),
      });

      if (!response.ok) {
        console.error(
          "Failed to create invoice",
          await response.text().catch(() => response.statusText)
        );
        return;
      }

      const data = (await response.json()) as { invoiceLink?: string };
      if (!data.invoiceLink) {
        console.error("Invoice link missing from response");
        return;
      }

      await openInvoice(data.invoiceLink);
    } catch (error) {
      console.error("Failed to open invoice", error);
    } finally {
      setIsCreatingInvoice(false);
    }
  }, [isCreatingInvoice, rawInitData]);

  const handleOpenTransactionDetails = useCallback(
    (transaction: IncomingTransaction) => {
      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("light");
      }
      // Store original incoming transaction for claim functionality
      setSelectedIncomingTransaction(transaction);
      // Check if user needs gas (0 SOL) and hasn't completed gasless onboarding
      const isWalletEmpty = balance === null || balance === 0;
      const userNeedsGas =
        gaslessState !== GaslessState.CLAIMED && isWalletEmpty;
      setNeedsGas(userNeedsGas);
      // Convert to TransactionDetailsData format
      const detailsData: TransactionDetailsData = {
        id: transaction.id,
        type: "incoming",
        amountLamports: transaction.amountLamports,
        sender: transaction.sender,
        senderUsername: transaction.username
          ? `@${transaction.username}`
          : undefined,
        status: "pending", // Incoming claimable transactions are pending
        timestamp: Date.now(), // TODO: Get actual timestamp from transaction
      };
      setSelectedTransaction(detailsData);
      setTransactionDetailsSheetOpen(true);
    },
    [balance, gaslessState]
  );

  const handleOpenWalletTransactionDetails = useCallback(
    (transaction: Transaction) => {
      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("light");
      }
      // Clear incoming transaction ref and gas warning
      setSelectedIncomingTransaction(null);
      setNeedsGas(false);
      // Convert to TransactionDetailsData format
      const detailsData: TransactionDetailsData = {
        id: transaction.id,
        type: transaction.type === "incoming" ? "incoming" : "outgoing",
        amountLamports: transaction.amountLamports,
        transferType: transaction.transferType,
        recipient: transaction.recipient,
        recipientUsername: transaction.recipient?.startsWith("@")
          ? transaction.recipient
          : undefined,
        sender: transaction.sender,
        senderUsername: transaction.sender?.startsWith("@")
          ? transaction.sender
          : undefined,
        status:
          transaction.status ??
          (transaction.type === "pending" ? "pending" : "completed"),
        timestamp: transaction.timestamp,
        networkFeeLamports: transaction.networkFeeLamports,
        signature: transaction.signature,
      };
      setSelectedTransaction(detailsData);
      setTransactionDetailsSheetOpen(true);
    },
    []
  );

  const handleSendValidationChange = useCallback((isValid: boolean) => {
    setIsSendFormValid(isValid);
  }, []);

  const handleSendFormValuesChange = useCallback(
    (values: { amount: string; recipient: string }) => {
      setSendFormValues(values);
    },
    []
  );

  const handleSendSheetChange = useCallback((open: boolean) => {
    if (!open && hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setSendSheetOpen(open);
    if (!open) {
      setSendStep(1); // Reset step when closing
      setSelectedRecipient("");
      setSendFormValues({ amount: "", recipient: "" });
      setSentAmountSol(undefined); // Reset sent amount
      setSendError(null); // Reset send error
    }
  }, []);

  const refreshWalletBalance = useCallback(
    async (forceRefresh = false) => {
      try {
        const balanceLamports = await getWalletBalance(forceRefresh);
        setCachedWalletBalance(walletAddress, balanceLamports);
        setBalance(balanceLamports);
      } catch (error) {
        console.error("Failed to refresh wallet balance", error);
      }
    },
    [walletAddress]
  );

  const mapTransferToTransaction = useCallback(
    (transfer: WalletTransfer): Transaction => {
      const isIncoming = transfer.direction === "in";
      const counterparty =
        transfer.counterparty ||
        (isIncoming ? "Unknown sender" : "Unknown recipient");

      return {
        id: transfer.signature,
        type: isIncoming ? "incoming" : "outgoing",
        transferType: transfer.type,
        amountLamports: transfer.amountLamports,
        sender: isIncoming ? counterparty : undefined,
        recipient: !isIncoming ? counterparty : undefined,
        timestamp: transfer.timestamp ?? Date.now(),
        networkFeeLamports: transfer.feeLamports,
        signature: transfer.signature,
        status: transfer.status === "failed" ? "error" : "completed",
      };
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
            return existing ? { ...existing, ...tx } : tx;
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

  const _handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }

    setIsRefreshing(true);
    try {
      // Refresh wallet balance
      await refreshWalletBalance(true);

      try {
        const latestPrice = await fetchSolUsdPrice();
        setSolPriceUsd(latestPrice);
      } catch (priceError) {
        console.error("Failed to refresh SOL price", priceError);
      }

      try {
        await loadWalletTransactions({ force: true });
      } catch (txError) {
        console.error("Failed to refresh wallet transactions", txError);
      }

      // Refresh incoming transactions
      if (rawInitData) {
        const cleanInitDataResult = cleanInitData(rawInitData);
        const username = parseUsernameFromInitData(cleanInitDataResult);

        if (username) {
          const provider = await getWalletProvider();
          const deposits = await fetchDeposits(provider, username);

          const mappedTransactions: IncomingTransaction[] = deposits.map(
            (deposit) => {
              const senderBase58 =
                typeof (deposit.user as { toBase58?: () => string })
                  .toBase58 === "function"
                  ? deposit.user.toBase58()
                  : String(deposit.user);

              return {
                id: `${senderBase58}-${deposit.lastNonce}`,
                amountLamports: deposit.amount,
                sender: senderBase58,
                username: username,
              };
            }
          );

          setIncomingTransactions(mappedTransactions);
        }
      }

      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("success");
      }
    } catch (error) {
      console.error("Failed to refresh data", error);
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("error");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, loadWalletTransactions, rawInitData, refreshWalletBalance]);

  const handleSubmitSend = useCallback(async () => {
    if (!isSendFormValid || isSendingTransaction) {
      return;
    }

    const trimmedRecipient = sendFormValues.recipient.trim();
    const amountSol = parseFloat(sendFormValues.amount);
    if (Number.isNaN(amountSol) || amountSol <= 0) {
      return;
    }

    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
    if (lamports <= 0) {
      console.warn("Lamports must be greater than zero");
      return;
    }

    setIsSendingTransaction(true);

    try {

      let signature: string | null = null;

      if (isValidSolanaAddress(trimmedRecipient)) {
        signature = await sendSolTransaction(trimmedRecipient, lamports);
      } else if (isValidTelegramUsername(trimmedRecipient)) {
        const username = trimmedRecipient.replace(/^@/, "");
        const provider = await getWalletProvider();
        const transferProgram = getTelegramTransferProgram(provider);
        await topUpDeposit(provider, transferProgram, username, lamports);
      } else {
        throw new Error("Invalid recipient");
      }

      await refreshWalletBalance(true);
      if (signature) {
        void loadWalletTransactions({ force: true });
      }

      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("success");
      }

      // Save recipient to recent list
      void addRecentRecipient(trimmedRecipient);

      // Calculate and save the sent amount in SOL for the success screen
      const sentSolAmount = lamports / LAMPORTS_PER_SOL;
      setSentAmountSol(sentSolAmount);

      // Transition to success step instead of closing
      setSendStep(4);
    } catch (error) {
      console.error("Failed to send transaction", error);
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("error");
      }

      // Set error message and transition to step 4
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setSendError(errorMessage);
      setSendStep(4);
    } finally {
      setIsSendingTransaction(false);
    }
  }, [
    isSendFormValid,
    isSendingTransaction,
    sendFormValues,
    loadWalletTransactions,
    refreshWalletBalance,
  ]);

  const handleReceiveSheetChange = useCallback((open: boolean) => {
    if (!open && hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setReceiveSheetOpen(open);
  }, []);

  const handleOpenActivitySheet = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setActivitySheetOpen(true);
  }, []);

  const handleActivitySheetChange = useCallback((open: boolean) => {
    if (!open && hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setActivitySheetOpen(open);
  }, []);

  const handleTransactionDetailsSheetChange = useCallback((open: boolean) => {
    if (!open && hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setTransactionDetailsSheetOpen(open);
    if (!open) {
      setSelectedTransaction(null);
      setSelectedIncomingTransaction(null);
      setShowClaimSuccess(false); // Reset claim success state
      setClaimError(null); // Reset claim error state
    }
  }, []);

  const handleShareAddress = useCallback(async () => {
    try {
      const address =
        walletAddress ??
        (await getWalletPublicKey().then((publicKey) => {
          const base58 = publicKey.toBase58();
          setWalletAddress((prev) => prev ?? base58);
          return base58;
        }));

      if (!address) {
        console.warn("Wallet address unavailable");
        return;
      }

      const canUseShare =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        (typeof window === "undefined" || window.isSecureContext);

      if (canUseShare) {
        try {
          await navigator.share({
            title: "My Solana address",
            text: address,
          });
          return;
        } catch (shareError) {
          if (
            shareError instanceof DOMException &&
            (shareError.name === "AbortError" ||
              shareError.name === "NotAllowedError")
          ) {
            return;
          }
        }
      }

      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(address);
          return;
        } catch (copyError) {
          console.warn("Clipboard copy failed", copyError);
        }
      }

      if (sendString(address)) {
      }
    } catch (error) {
      console.error("Failed to share wallet address", error);
    }
  }, [walletAddress]);

  const handleScanQR = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    void openQrScanner();
  }, []);

  const handleApproveTransaction = useCallback(
    async (transactionId: string) => {
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
      setClaimingTransactionId(transactionId);
      try {
        const provider = await getWalletProvider();
        const keypair = await getWalletKeypair();
        const wallet = new SimpleWallet(keypair);
        const recipientPublicKey = provider.publicKey;

        const { validationBytes, signatureBytes } =
          createValidationBytesFromRawInitData(rawInitData);
        const senderPublicKey = new PublicKey(transaction.sender);

        const username = transaction.username;
        const amountLamports = transaction.amountLamports;

        await verifyAndClaimDeposit(
          provider,
          wallet,
          senderPublicKey,
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

        await refreshWalletBalance(true);

        if (hapticFeedback.notificationOccurred.isAvailable()) {
          hapticFeedback.notificationOccurred("success");
        }

        // Show success state instead of closing
        setShowClaimSuccess(true);
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
        setClaimingTransactionId(null);
      }
    },
    [incomingTransactions, rawInitData, refreshWalletBalance]
  );

  useEffect(() => {
    if (rawInitData) {
      if (!TELEGRAM_BOT_ID) {
        console.error("TELEGRAM_BOT_ID is not set in .env");
        return;
      }
      const cleanInitDataResult = cleanInitData(rawInitData);
      const validationString = createValidationString(
        TELEGRAM_BOT_ID,
        cleanInitDataResult
      );
      console.log("validationString:", validationString);
      const signature = cleanInitDataResult.signature as string;
      const isValid = validateInitData(validationString, signature);
      console.log("Signature is valid: ", isValid);
    }
  }, [rawInitData]);

  useEffect(() => {
    let isCancelled = false;

    const syncGaslessState = async () => {
      try {
        const state = await getGaslessState();
        if (isCancelled) return;
        setGaslessState(state);
      } catch (error) {
        console.warn("Failed to load gasless state", error);
        if (isCancelled) return;
        setGaslessState(GaslessState.NOT_CLAIMED);
      }
    };

    void syncGaslessState();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    // Check cache first - if we have a cached price, use it immediately
    const cached = getCachedSolPrice();
    if (cached !== null) {
      setSolPriceUsd(cached);
      setIsSolPriceLoading(false);
    }

    const loadPrice = async () => {
      while (retryCount < MAX_RETRIES && isMounted) {
        try {
          const price = await fetchSolUsdPrice();
          if (!isMounted) return;
          setCachedSolPrice(price);
          setSolPriceUsd(price);
          setIsSolPriceLoading(false);
          return; // Success, exit
        } catch (error) {
          retryCount++;
          console.error(
            `Failed to fetch SOL price (attempt ${retryCount}/${MAX_RETRIES})`,
            error
          );
          if (retryCount < MAX_RETRIES && isMounted) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
      // All retries failed, use fallback price
      if (isMounted) {
        console.warn("Using fallback SOL price after all retries failed");
        setCachedSolPrice(SOL_PRICE_USD);
        setSolPriceUsd(SOL_PRICE_USD);
        setIsSolPriceLoading(false);
      }
    };

    void loadPrice();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!rawInitData) return;

    let isCancelled = false;

    void (async () => {
      try {
        const cleanInitDataResult = cleanInitData(rawInitData);
        const username = parseUsernameFromInitData(cleanInitDataResult);

        if (!username) {
          setIncomingTransactions([]);
          return;
        }

        // Check cache first - state may have been initialized from it
        const cached = getCachedIncomingTransactions(username);
        if (cached !== null) {
          // Use cached data, refresh in background
          setIncomingTransactions(cached);
        }

        const provider = await getWalletProvider();
        console.log("Fetching deposits for username:", username);
        const deposits = await fetchDeposits(provider, username);
        console.log("Deposits fetched:", deposits.length, deposits);
        if (isCancelled) {
          return;
        }

        const mappedTransactions: IncomingTransaction[] = deposits.map(
          (deposit) => {
            const senderBase58 =
              typeof (deposit.user as { toBase58?: () => string }).toBase58 ===
              "function"
                ? deposit.user.toBase58()
                : String(deposit.user);

            return {
              id: `${senderBase58}-${deposit.lastNonce}`,
              amountLamports: deposit.amount,
              sender: senderBase58,
              username: deposit.username,
            };
          }
        );

        setCachedIncomingTransactions(username, mappedTransactions);
        setIncomingTransactions(mappedTransactions);
      } catch (error) {
        console.error("Failed to fetch deposits", error);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [rawInitData]);

  useEffect(() => {
    initTelegram();
    void ensureTelegramTheme();

    // Enable closing confirmation always
    try {
      // Mount closing behavior if needed
      if (closingBehavior.mount.isAvailable?.()) {
        closingBehavior.mount();
      }

      if (closingBehavior.enableConfirmation.isAvailable()) {
        closingBehavior.enableConfirmation();
        const isEnabled = closingBehavior.isConfirmationEnabled();
      } else {
        console.warn("enableConfirmation is not available");
      }
    } catch (error) {
      console.error("Failed to enable closing confirmation:", error);
    }

    // Check platform and enable fullscreen for mobile
    let platform: string | undefined;
    try {
      const launchParams = retrieveLaunchParams();
      platform = launchParams.tgWebAppPlatform;
    } catch {
      // Fallback to hash parsing if SDK fails
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      platform = params.get("tgWebAppPlatform") || undefined;
    }

    const isMobile = platform === "ios" || platform === "android";
    setIsMobilePlatform(isMobile);

    if (isMobile) {
      if (viewport.requestFullscreen.isAvailable()) {
        void viewport.requestFullscreen().catch((error) => {
          console.warn("Failed to enable fullscreen:", error);
        });
      }
    }

    // Suppress Telegram SDK viewport errors in non-TMA environment
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || "";
      // Suppress viewport_changed and other bridge validation errors
      if (
        message.includes("viewport_changed") ||
        message.includes(
          "ValiError: Invalid type: Expected Object but received null"
        )
      ) {
        return; // Silently ignore these errors
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // Load display currency preference from cloud storage
  useEffect(() => {
    if (cachedDisplayCurrency !== null) return; // Already loaded from cache

    void (async () => {
      try {
        const stored = await getCloudValue(DISPLAY_CURRENCY_KEY);
        if (stored === "USD" || stored === "SOL") {
          cachedDisplayCurrency = stored;
          setDisplayCurrency(stored);
        }
      } catch (error) {
        console.error("Failed to load display currency preference", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (ensuredWalletRef.current) return;
    ensuredWalletRef.current = true;

    void (async () => {
      try {
        const { keypair, isNew } = await ensureWalletKeypair();
        const publicKeyBase58 = keypair.publicKey.toBase58();

        // Store wallet address in module-level cache for future mounts
        cachedWalletAddress = publicKeyBase58;
        setWalletAddress(publicKeyBase58);

        // Check if we already have cached balance (from previous visit)
        const cachedBalance = getCachedWalletBalance(publicKeyBase58);

        if (cachedBalance !== null) {
          // We have cache - state was already initialized from it
          // Just refresh in background without loading state
          setIsLoading(false);
          void getWalletBalance().then((freshBalance) => {
            setCachedWalletBalance(publicKeyBase58, freshBalance);
            setBalance(freshBalance);
          });
        } else {
          // First load - need to fetch balance
          const balanceLamports = await getWalletBalance();
          setCachedWalletBalance(publicKeyBase58, balanceLamports);
          setBalance(balanceLamports);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to ensure wallet keypair", error);
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!walletAddress) return;
    void loadWalletTransactions();
  }, [walletAddress, loadWalletTransactions]);

  useEffect(() => {
    if (!walletAddress) return;

    let isCancelled = false;

    // Check if we have cached stars (state may have been initialized from it)
    const hasCache = getCachedStarsBalance(walletAddress) !== null;

    // Only show loading if we don't have cache
    if (!hasCache) {
      setIsStarsLoading(true);
    } else {
      // Ensure loading is false if we have cache
      setIsStarsLoading(false);
    }

    const loadStarsBalance = async () => {
      try {
        const invoice = await fetchInvoiceState(walletAddress);
        if (isCancelled) return;
        const remaining = Number.isFinite(invoice.remainingStars)
          ? Number(invoice.remainingStars)
          : 0;
        setCachedStarsBalance(walletAddress, remaining);
        setStarsBalance(remaining);
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to fetch Stars balance", error);
          // Only reset to 0 if we don't have cached data
          if (!hasCache) {
            setStarsBalance(0);
          }
        }
      } finally {
        if (!isCancelled) {
          setIsStarsLoading(false);
        }
      }
    };

    void loadStarsBalance();

    return () => {
      isCancelled = true;
    };
  }, [walletAddress]);

  // Subscribe to websocket balance updates so inbound funds appear in real time
  useEffect(() => {
    if (!walletAddress) return;

    let isCancelled = false;

    const handleBalanceUpdate = (lamports: number) => {
      if (isCancelled) return;
      setBalance((prev) => (prev === lamports ? prev : lamports));
    };

    const cachedBalance = getCachedWalletBalance(walletAddress);
    if (cachedBalance !== null) {
      setBalance((prev) => (prev === cachedBalance ? prev : cachedBalance));
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

  useEffect(() => {
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
                next[matchIndex] = { ...next[matchIndex], ...mapped };
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

  useEffect(() => {
    const handleClaimVerified = () => {
      setButtonRefreshTick((tick) => tick + 1);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("claim-free-verified", handleClaimVerified);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("claim-free-verified", handleClaimVerified);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedIncomingTransaction) {
      setNeedsGas(false);
      return;
    }

    const isWalletEmpty = balance === null || balance === 0;
    const userNeedsGas =
      gaslessState !== GaslessState.CLAIMED && isWalletEmpty;
    setNeedsGas(userNeedsGas);
  }, [balance, gaslessState, selectedIncomingTransaction]);

  useEffect(() => {
    if (isClaimFreeSheetOpen) {
      return () => {};
    }

    if (!mainButtonAvailable) {
      mainButton.mount.ifAvailable?.();
      hideMainButton();
    }

    if (!secondaryButtonAvailable) {
      secondaryButton.mount.ifAvailable?.();
      hideSecondaryButton();
    }

    if (!mainButtonAvailable) {
      return () => {
        hideMainButton();
        hideSecondaryButton();
      };
    }

    if (isTransactionDetailsSheetOpen && selectedTransaction) {
      hideSecondaryButton();

      // Show "Done" button on claim success or error
      if (showClaimSuccess || claimError) {
        showMainButton({
          text: "Done",
          onClick: () => {
            setTransactionDetailsSheetOpen(false);
            setSelectedTransaction(null);
            setSelectedIncomingTransaction(null);
            setShowClaimSuccess(false);
            setClaimError(null);
          },
          isEnabled: true,
          showLoader: false,
        });
      } else if (selectedIncomingTransaction) {
        // Only show Claim button for incoming (claimable) transactions
        const hasGaslessAccess = gaslessState === GaslessState.CLAIMED;

        if (needsGas && !hasGaslessAccess) {
          // User needs gas - show "Claim free transactions" button
          showMainButton({
            text: "Claim free transactions",
            onClick: () => {
              setIsClaimFreeSheetOpen(true);
            },
            isEnabled: true,
            showLoader: false,
          });
        } else if (isClaimingTransaction && !hasGaslessAccess) {
          // Show only main button with loader during claim
          showMainButton({
            text: "Claim",
            onClick: () => {}, // No-op during loading
            isEnabled: false,
            showLoader: true,
          });
        } else {
          // Show only Claim button (no Ignore)
          showMainButton({
            text: "Claim",
            onClick: () =>
              handleApproveTransaction(selectedIncomingTransaction.id),
          });
        }
      } else {
        // For outgoing transactions, hide the main button
        hideMainButton();
      }
    } else if (isSendSheetOpen) {
      hideSecondaryButton();

      if (sendStep === 1) {
        showMainButton({
          text: "Next",
          onClick: () => {
            if (isSendFormValid) setSendStep(2);
          },
          isEnabled: isSendFormValid,
          showLoader: false,
        });
      } else if (sendStep === 2) {
        showMainButton({
          text: "Review",
          onClick: () => {
            if (isSendFormValid) setSendStep(3);
          },
          isEnabled: isSendFormValid,
          showLoader: false,
        });
      } else if (sendStep === 3) {
        showMainButton({
          text: "Confirm and Send",
          onClick: handleSubmitSend,
          isEnabled: isSendFormValid && !isSendingTransaction,
          showLoader: isSendingTransaction,
        });
      } else if (sendStep === 4) {
        if (sendError) {
          // Error step - show Done button to close
          showMainButton({
            text: "Done",
            onClick: () => {
              setSendSheetOpen(false);
            },
            isEnabled: true,
            showLoader: false,
          });
        } else {
          // Success step - show Transaction details button
          showMainButton({
            text: "Transaction details",
            onClick: () => {
              // Close send sheet and open transaction details
              setSendSheetOpen(false);
              // Create transaction details for the just-sent transaction
              if (sentAmountSol && sendFormValues.recipient) {
                const trimmedRecipient = sendFormValues.recipient.trim();
                const detailsData: TransactionDetailsData = {
                  id: `sent-${Date.now()}`,
                  type: "outgoing",
                  amountLamports: Math.round(sentAmountSol * LAMPORTS_PER_SOL),
                  recipient: trimmedRecipient,
                  recipientUsername: trimmedRecipient.startsWith("@")
                    ? trimmedRecipient
                    : undefined,
                  status: "completed",
                  timestamp: Date.now(),
                };
                setSelectedTransaction(detailsData);
                setSelectedIncomingTransaction(null);
                setTransactionDetailsSheetOpen(true);
              }
            },
            isEnabled: true,
            showLoader: false,
          });
        }
      }
    } else if (isReceiveSheetOpen) {
      hideSecondaryButton();
      showReceiveShareButton({ onShare: handleShareAddress });
    } else {
      hideMainButton();
      hideSecondaryButton();
    }

    return () => {
      hideMainButton();
      hideSecondaryButton();
    };
  }, [
    isTransactionDetailsSheetOpen,
    isSendSheetOpen,
    isReceiveSheetOpen,
    isSendFormValid,
    isSendingTransaction,
    selectedTransaction,
    selectedIncomingTransaction,
    isClaimingTransaction,
    needsGas,
    gaslessState,
    mainButtonAvailable,
    secondaryButtonAvailable,
    handleOpenSendSheet,
    handleOpenReceiveSheet,
    handleShareAddress,
    handleApproveTransaction,
    handleSubmitSend,
    sendStep,
    sentAmountSol,
    sendFormValues,
    showClaimSuccess,
    claimError,
    sendError,
    isClaimFreeSheetOpen,
    buttonRefreshTick,
  ]);

  const formattedUsdBalance = formatUsdValue(balance, solPriceUsd);
  const formattedSolBalance = formatBalance(balance);
  const showBalanceSkeleton =
    isLoading || (displayCurrency === "USD" && isSolPriceLoading);
  const showSecondarySkeleton =
    isLoading || (displayCurrency === "SOL" && isSolPriceLoading);
  const showStarsSkeleton = isLoading || isStarsLoading;

  // Computed numeric values for NumberFlow animations
  const solBalanceNumeric = useMemo(() => {
    if (balance === null) return 0;
    // Truncate to 4 decimal places (floor, no rounding)
    const sol = balance / LAMPORTS_PER_SOL;
    return Math.floor(sol * 10000) / 10000;
  }, [balance]);

  const usdBalanceNumeric = useMemo(() => {
    if (balance === null || solPriceUsd === null) return 0;
    const sol = balance / LAMPORTS_PER_SOL;
    const usd = sol * solPriceUsd;
    // Truncate to 2 decimal places (floor, no rounding)
    return Math.floor(usd * 100) / 100;
  }, [balance, solPriceUsd]);

  // Combine and limit transactions for main Activity section (max 10)
  const limitedActivityItems = useMemo(() => {
    const items: Array<
      | { type: "incoming"; transaction: IncomingTransaction }
      | { type: "wallet"; transaction: Transaction }
    > = [];

    // Add incoming (claimable) transactions first - they have priority
    for (const tx of incomingTransactions) {
      items.push({ type: "incoming", transaction: tx });
    }

    // Add wallet transactions sorted by timestamp
    const sortedWallet = [...walletTransactions].sort(
      (a, b) => b.timestamp - a.timestamp
    );
    for (const tx of sortedWallet) {
      items.push({ type: "wallet", transaction: tx });
    }

    // Limit to 10
    return items.slice(0, 10);
  }, [incomingTransactions, walletTransactions]);

  // Detect new transactions for animation
  useEffect(() => {
    const currentIds = new Set(
      limitedActivityItems.map((item) => item.transaction.id)
    );
    const previousIds = seenTransactionIdsRef.current;

    // Find newly added transactions
    const newIds = new Set<string>();
    for (const id of currentIds) {
      if (!previousIds.has(id)) {
        newIds.add(id);
      }
    }

    // Update seen transactions
    seenTransactionIdsRef.current = currentIds;

    // If we have new transactions, mark them for animation
    if (newIds.size > 0) {
      setNewTransactionIds(newIds);

      // Clear the new status after animation completes (500ms)
      const timer = setTimeout(() => {
        setNewTransactionIds(new Set());
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [limitedActivityItems]);

  // Track balance visibility for sticky pill
  useEffect(() => {
    const balanceElement = balanceRef.current;
    if (!balanceElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky pill when balance is not visible
        setShowStickyBalance(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: `-${Math.max(safeAreaInsetTop || 0, 12) + 15}px 0px 0px 0px`,
      }
    );

    observer.observe(balanceElement);
    return () => observer.disconnect();
  }, [safeAreaInsetTop]);

  const handleScrollToTop = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <main
        className="min-h-screen text-white font-sans overflow-hidden relative flex flex-col"
        style={{ background: "#16161a" }}
      >
        {/* Sticky Balance Pill */}
        <AnimatePresence>
          {showStickyBalance && !isLoading && (
            <motion.button
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              onClick={handleScrollToTop}
              className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center px-4 py-2 rounded-[54px] active:opacity-80 transition-opacity"
              style={{
                top: `${Math.max(safeAreaInsetTop || 0, 12) + 8}px`,
                background: "rgba(255, 255, 255, 0.06)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <span className="text-sm font-medium text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
                {displayCurrency === "USD"
                  ? `$${usdBalanceNumeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `${solBalanceNumeric.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SOL`}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div
          className="relative flex-1 flex flex-col w-full"
          style={{
            paddingTop: `${Math.max(safeAreaInsetTop || 0, 12) + 15}px`,
          }}
        >
          {/* Balance Section */}
          <div className="flex flex-col items-center pb-6 px-6">
            {/* Wallet Address */}
            {isLoading || !walletAddress ? (
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-white/5 animate-pulse rounded" />
                <div className="w-24 h-5 bg-white/5 animate-pulse rounded" />
              </div>
            ) : (
              <button
                onClick={() => {
                  if (hapticFeedback.impactOccurred.isAvailable()) {
                    hapticFeedback.impactOccurred("light");
                  }
                  if (walletAddress) {
                    if (navigator?.clipboard?.writeText) {
                      navigator.clipboard.writeText(walletAddress);
                      setAddressCopied(true);
                      setTimeout(() => setAddressCopied(false), 2000);
                    }
                    if (hapticFeedback.notificationOccurred.isAvailable()) {
                      hapticFeedback.notificationOccurred("success");
                    }
                  }
                }}
                className="flex items-center gap-1 active:opacity-70 transition-opacity"
              >
                <Copy className="w-4 h-4 text-white/60" strokeWidth={1.5} />
                <span className="text-base text-white/60 leading-5">
                  {addressCopied ? "Copied!" : formatAddress(walletAddress)}
                </span>
              </button>
            )}

            {/* Balance Display */}
            <div ref={balanceRef} className="flex flex-col items-center gap-1.5 mt-1.5">
              <button
                onClick={() => {
                  if (hapticFeedback.selectionChanged.isAvailable()) {
                    hapticFeedback.selectionChanged();
                  }
                  setDisplayCurrency((prev) => {
                    const newCurrency = prev === "USD" ? "SOL" : "USD";
                    cachedDisplayCurrency = newCurrency;
                    void setCloudValue(DISPLAY_CURRENCY_KEY, newCurrency);
                    return newCurrency;
                  });
                }}
                className="active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center leading-[48px] gap-2">
                  <NumberFlow
                    value={
                      displayCurrency === "USD"
                        ? usdBalanceNumeric
                        : solBalanceNumeric
                    }
                    format={{
                      minimumFractionDigits: displayCurrency === "USD" ? 2 : 4,
                      maximumFractionDigits: displayCurrency === "USD" ? 2 : 4,
                    }}
                    prefix={displayCurrency === "USD" ? "$" : undefined}
                    suffix={displayCurrency === "SOL" ? " SOL" : undefined}
                    className="text-[40px] font-semibold text-white [&::part(prefix)]:text-white/60 [&::part(suffix)]:text-white/60"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                    transformTiming={{ duration: 500, easing: "ease-out" }}
                    opacityTiming={{ duration: 300, easing: "ease-out" }}
                  />
                </div>
              </button>

              {/* Secondary Amount */}
              <div className="text-base text-white/60 leading-5">
                <NumberFlow
                  value={
                    displayCurrency === "USD"
                      ? solBalanceNumeric
                      : usdBalanceNumeric
                  }
                  format={{
                    minimumFractionDigits: displayCurrency === "USD" ? 4 : 2,
                    maximumFractionDigits: displayCurrency === "USD" ? 4 : 2,
                  }}
                  prefix={displayCurrency === "SOL" ? "$" : undefined}
                  suffix={displayCurrency === "USD" ? " SOL" : undefined}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                  transformTiming={{ duration: 500, easing: "ease-out" }}
                  opacityTiming={{ duration: 300, easing: "ease-out" }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full px-6 mt-8">
              <ActionButton
                icon={<ArrowUp />}
                label="Send"
                onClick={() => handleOpenSendSheet()}
                disabled={balance === null || balance === 0}
              />
              <ActionButton
                icon={<ArrowDown />}
                label="Receive"
                onClick={handleOpenReceiveSheet}
              />
              <ActionButton
                icon={<ScanIcon />}
                label={isMobilePlatform ? "Scan" : "Mobile only"}
                onClick={handleScanQR}
                disabled={!isMobilePlatform}
              />
            </div>
          </div>

          {/* Activity Section - conditionally rendered */}
          {(() => {
            const hasNoTransactions =
              incomingTransactions.length === 0 &&
              walletTransactions.length === 0;
            const isEmptyWallet = balance === null || balance === 0;
            const isActivityLoading =
              isLoading ||
              (isFetchingTransactions && walletTransactions.length === 0);

            // Empty wallet banner component - promotes gasless transactions
            const EmptyWalletBanner = () => (
              <GaslessBanner
                onHaptic={() => {
                  if (hapticFeedback.impactOccurred.isAvailable()) {
                    hapticFeedback.impactOccurred("light");
                  }
                }}
                initialState={gaslessState}
                onStateChange={handleGaslessStateChange}
              />
            );

            // Loading state - show skeleton transaction cards
            if (isActivityLoading) {
              return (
                <>
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                    <p className="text-base font-medium text-white leading-5 tracking-[-0.176px]">
                      Activity
                    </p>
                  </div>
                  <div className="flex-1 px-4 pb-4">
                    <div className="flex flex-col gap-2">
                      {/* Skeleton Transaction Card 1 */}
                      <div
                        className="flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden"
                        style={{
                          background: "rgba(255, 255, 255, 0.06)",
                          mixBlendMode: "lighten",
                        }}
                      >
                        <div className="py-1.5 pr-3">
                          <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                        </div>
                        <div className="flex-1 py-2.5 flex flex-col gap-1.5">
                          <div className="w-20 h-5 bg-white/5 animate-pulse rounded" />
                          <div className="w-28 h-4 bg-white/5 animate-pulse rounded" />
                        </div>
                        <div className="flex flex-col items-end gap-1.5 py-2.5 pl-3">
                          <div className="w-16 h-5 bg-white/5 animate-pulse rounded" />
                          <div className="w-12 h-4 bg-white/5 animate-pulse rounded" />
                        </div>
                      </div>
                      {/* Skeleton Transaction Card 2 */}
                      <div
                        className="flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden"
                        style={{
                          background: "rgba(255, 255, 255, 0.06)",
                          mixBlendMode: "lighten",
                        }}
                      >
                        <div className="py-1.5 pr-3">
                          <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                        </div>
                        <div className="flex-1 py-2.5 flex flex-col gap-1.5">
                          <div className="w-16 h-5 bg-white/5 animate-pulse rounded" />
                          <div className="w-24 h-4 bg-white/5 animate-pulse rounded" />
                        </div>
                        <div className="flex flex-col items-end gap-1.5 py-2.5 pl-3">
                          <div className="w-20 h-5 bg-white/5 animate-pulse rounded" />
                          <div className="w-14 h-4 bg-white/5 animate-pulse rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            }

            // Empty wallet AND no transactions - show only banner
            if (isEmptyWallet && hasNoTransactions) {
              return (
                <div className="flex-1">
                  <EmptyWalletBanner />
                </div>
              );
            }

            // Has balance but no transactions - no Activity label
            if (hasNoTransactions) {
              return (
                <div className="flex-1 px-4 pb-4">
                  <div
                    className="flex items-center justify-center px-8 py-6 rounded-2xl h-[200px]"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      mixBlendMode: "lighten",
                    }}
                  >
                    <p className="text-base text-white/60 leading-5 text-center">
                      You don&apos;t have any transactions yet
                    </p>
                  </div>
                </div>
              );
            }

            // Normal state with transactions
            return (
              <>
                {/* Show empty wallet banner above Activity title if wallet is empty */}
                {isEmptyWallet && <EmptyWalletBanner />}
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <p className="text-base font-medium text-white leading-5 tracking-[-0.176px]">
                    Activity
                  </p>
                  <button
                    onClick={handleOpenActivitySheet}
                    className="flex items-center gap-0.5 text-[13px] text-white/60 leading-4 active:opacity-70 transition-opacity"
                  >
                    All
                    <ChevronRight size={14} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="flex-1 px-4 pb-4">
                  <div className="flex flex-col gap-2 pb-36">
                    <AnimatePresence initial={false} mode="popLayout">
                      {limitedActivityItems.map((item) => {
                        const isNewTransaction = newTransactionIds.has(
                          item.transaction.id
                        );

                        if (item.type === "incoming") {
                          const transaction = item.transaction;
                          const isClaiming =
                            claimingTransactionId === transaction.id;
                          return (
                            <motion.button
                              key={transaction.id}
                              layout
                              initial={
                                isNewTransaction
                                  ? { opacity: 0, scale: 0.85, y: -10 }
                                  : false
                              }
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.85 }}
                              transition={{
                                layout: {
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 35,
                                },
                                opacity: { duration: 0.25 },
                                scale: {
                                  duration: 0.3,
                                  ease: [0.34, 1.56, 0.64, 1],
                                },
                              }}
                              onClick={() =>
                                !isClaiming &&
                                handleOpenTransactionDetails(transaction)
                              }
                              disabled={isClaiming}
                              className={`flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity ${
                                isClaiming ? "opacity-60" : ""
                              }`}
                              style={{
                                background: "rgba(255, 255, 255, 0.06)",
                                mixBlendMode: "lighten",
                              }}
                            >
                              {/* Left - Icon */}
                              <div className="py-1.5 pr-3">
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{
                                    background: "rgba(50, 229, 94, 0.15)",
                                  }}
                                >
                                  <ArrowDown
                                    className="w-7 h-7"
                                    strokeWidth={1.5}
                                    style={{ color: "#32e55e" }}
                                  />
                                </div>
                              </div>

                              {/* Middle - Text */}
                              <div className="flex-1 py-2.5 flex flex-col gap-0.5">
                                <p className="text-base text-white leading-5">
                                  Received
                                </p>
                                <p className="text-[13px] text-white/60 leading-4">
                                  from {formatSenderAddress(transaction.sender)}
                                </p>
                              </div>

                              {/* Right - Claim Badge */}
                              <div className="py-2.5 pl-3">
                                {(() => {
                                  const isWalletEmpty = balance === null || balance === 0;
                                  const userNeedsGas =
                                    gaslessState !== GaslessState.CLAIMED &&
                                    isWalletEmpty;
                                  return (
                                    <div
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-white leading-5"
                                      style={{
                                        background: userNeedsGas
                                          ? "linear-gradient(90deg, rgba(234, 179, 8, 0.15) 0%, rgba(234, 179, 8, 0.15) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)"
                                          : "linear-gradient(90deg, rgba(50, 229, 94, 0.15) 0%, rgba(50, 229, 94, 0.15) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)",
                                      }}
                                      >
                                        {userNeedsGas && (
                                          <TriangleAlert className="w-4 h-4" style={{ color: "#eab308" }} strokeWidth={2} />
                                        )}
                                      {isClaiming
                                        ? "Claiming..."
                                        : userNeedsGas
                                          ? "Needs gas"
                                          : `Claim ${formatTransactionAmount(
                                              transaction.amountLamports
                                            )} SOL`}
                                    </div>
                                  );
                                })()}
                              </div>
                            </motion.button>
                          );
                        }

                        // Wallet transaction
                        const transaction = item.transaction;
                        const isIncoming = transaction.type === "incoming";
                        const isPending = transaction.type === "pending";
                        const transferTypeLabel =
                          transaction.transferType === "store"
                            ? "Store data"
                            : transaction.transferType ===
                              "verify_telegram_init_data"
                            ? "Verify data"
                            : null;
                        const counterparty = isIncoming
                          ? transaction.sender || "Unknown sender"
                          : transaction.recipient || "Unknown recipient";
                        const isUnknownRecipient = counterparty
                          .toLowerCase()
                          .startsWith("unknown recipient");
                        const formattedCounterparty = isUnknownRecipient
                          ? counterparty
                          : counterparty.startsWith("@")
                          ? counterparty
                          : formatSenderAddress(counterparty);
                        const isEffectivelyZero =
                          Math.abs(transaction.amountLamports) <
                          LAMPORTS_PER_SOL / 10000; // below 0.0001 SOL displays as 0
                        const amountPrefix = isEffectivelyZero
                          ? ""
                          : isIncoming
                          ? "+"
                          : "−";
                        const amountColor = isIncoming
                          ? "#32e55e"
                          : isPending
                          ? "#00b1fb"
                          : "white";
                        const timestamp = new Date(transaction.timestamp);

                        // Compact view for store/verify transactions
                        const isCompactTransaction = transferTypeLabel !== null;

                        if (isCompactTransaction) {
                          return (
                            <motion.button
                              key={transaction.id}
                              layout
                              initial={
                                isNewTransaction
                                  ? { opacity: 0, scale: 0.85, y: -10 }
                                  : false
                              }
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.85 }}
                              transition={{
                                layout: {
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 35,
                                },
                                opacity: { duration: 0.25 },
                                scale: {
                                  duration: 0.3,
                                  ease: [0.34, 1.56, 0.64, 1],
                                },
                              }}
                              onClick={() =>
                                handleOpenWalletTransactionDetails(transaction)
                              }
                              className="flex items-center py-2 px-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity"
                              style={{
                                background: "rgba(255, 255, 255, 0.06)",
                                mixBlendMode: "lighten",
                              }}
                            >
                              {/* Left - Text */}
                              <div className="flex-1 flex items-center">
                                <p className="text-sm text-white/60 leading-5">
                                  {transferTypeLabel}
                                </p>
                              </div>

                              {/* Right - Date only */}
                              <div className="pl-3">
                                <p className="text-[13px] text-white/40 leading-4">
                                  {timestamp.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                  ,{" "}
                                  {timestamp.toLocaleTimeString([], {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </motion.button>
                          );
                        }

                        return (
                          <motion.button
                            key={transaction.id}
                            layout
                            initial={
                              isNewTransaction
                                ? { opacity: 0, scale: 0.85, y: -10 }
                                : false
                            }
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{
                              layout: {
                                type: "spring",
                                stiffness: 500,
                                damping: 35,
                              },
                              opacity: { duration: 0.25 },
                              scale: {
                                duration: 0.3,
                                ease: [0.34, 1.56, 0.64, 1],
                              },
                            }}
                            onClick={() =>
                              handleOpenWalletTransactionDetails(transaction)
                            }
                            className="flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity"
                            style={{
                              background: "rgba(255, 255, 255, 0.06)",
                              mixBlendMode: "lighten",
                            }}
                          >
                            {/* Left - Icon */}
                            <div className="py-1.5 pr-3">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{
                                  background: isIncoming
                                    ? "rgba(50, 229, 94, 0.15)"
                                    : isPending
                                    ? "rgba(0, 177, 251, 0.15)"
                                    : "rgba(255, 255, 255, 0.06)",
                                  mixBlendMode:
                                    isIncoming || isPending
                                      ? "normal"
                                      : "lighten",
                                }}
                              >
                                {isIncoming ? (
                                  <ArrowDown
                                    className="w-7 h-7"
                                    strokeWidth={1.5}
                                    style={{ color: "#32e55e" }}
                                  />
                                ) : isPending ? (
                                  <Clock
                                    className="w-7 h-7"
                                    strokeWidth={1.5}
                                    style={{ color: "#00b1fb" }}
                                  />
                                ) : (
                                  <ArrowUp
                                    className="w-7 h-7 text-white/60"
                                    strokeWidth={1.5}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Middle - Text */}
                            <div className="flex-1 py-2.5 flex flex-col gap-0.5">
                              <p className="text-base text-white leading-5">
                                {isIncoming
                                  ? "Received"
                                  : isPending
                                  ? "To be claimed"
                                  : "Sent"}
                              </p>
                              {!(
                                isPending === false &&
                                !isIncoming &&
                                isUnknownRecipient
                              ) && (
                                <p className="text-[13px] text-white/60 leading-4">
                                  {isIncoming
                                    ? "from"
                                    : isPending
                                    ? "by"
                                    : "to"}{" "}
                                  {formattedCounterparty}
                                </p>
                              )}
                            </div>

                            {/* Right - Value */}
                            <div className="flex flex-col items-end gap-0.5 py-2.5 pl-3">
                              <p
                                className="text-base leading-5"
                                style={{ color: amountColor }}
                              >
                                {amountPrefix}
                                {isEffectivelyZero
                                  ? "0"
                                  : formatTransactionAmount(
                                      transaction.amountLamports
                                    )}{" "}
                                SOL
                              </p>
                              <p className="text-[13px] text-white/60 leading-4">
                                {timestamp.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                                ,{" "}
                                {timestamp.toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Bottom Fade Gradient */}
        <div className="fixed bottom-0 left-0 right-0 h-32 z-40 pointer-events-none">
          <Image
            src="/icons/fade-up.png"
            alt=""
            fill
            className="object-cover object-bottom"
            priority
          />
        </div>
      </main>

      <SendSheet
        open={isSendSheetOpen}
        onOpenChange={handleSendSheetChange}
        trigger={null}
        initialRecipient={selectedRecipient}
        onValidationChange={handleSendValidationChange}
        onFormValuesChange={handleSendFormValuesChange}
        step={sendStep}
        onStepChange={setSendStep}
        balance={balance}
        walletAddress={walletAddress ?? undefined}
        starsBalance={starsBalance}
        onTopUpStars={handleTopUpStars}
        solPriceUsd={solPriceUsd}
        isSolPriceLoading={isSolPriceLoading}
        sentAmountSol={sentAmountSol}
        sendError={sendError}
      />
      <ReceiveSheet
        open={isReceiveSheetOpen}
        onOpenChange={handleReceiveSheetChange}
        trigger={null}
        walletAddress={walletAddress ?? undefined}
      />
      <TransactionDetailsSheet
        open={isTransactionDetailsSheetOpen}
        onOpenChange={handleTransactionDetailsSheetChange}
        trigger={null}
        transaction={selectedTransaction}
        showSuccess={showClaimSuccess}
        showError={claimError}
        solPriceUsd={solPriceUsd}
        needsGas={needsGas}
      />
      <ActivitySheet
        open={isActivitySheetOpen}
        onOpenChange={handleActivitySheetChange}
        trigger={null}
        walletTransactions={walletTransactions}
        incomingTransactions={incomingTransactions}
        onTransactionClick={handleOpenWalletTransactionDetails}
        onIncomingTransactionClick={handleOpenTransactionDetails}
        claimingTransactionId={claimingTransactionId}
        balance={balance}
        starsBalance={starsBalance}
      />
      <ClaimFreeTransactionsSheet
        open={isClaimFreeSheetOpen}
        onOpenChange={setIsClaimFreeSheetOpen}
        onStateChange={handleGaslessStateChange}
      />
    </>
  );
}
