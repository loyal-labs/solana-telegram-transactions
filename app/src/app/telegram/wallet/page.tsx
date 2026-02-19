"use client";

import { hashes } from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import NumberFlow from "@number-flow/react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  hapticFeedback,
  mainButton,
  secondaryButton,
  useRawInitData,
  useSignal,
} from "@telegram-apps/sdk-react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Brush, Copy, RefreshCcw } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

import { ScanIcon } from "@/components/ui/icons/ScanIcon";
import { ActionButton } from "@/components/wallet/ActionButton";
import ActivitySheet from "@/components/wallet/ActivitySheet";
import BalanceBackgroundPicker from "@/components/wallet/BalanceBackgroundPicker";
import BannerCarousel from "@/components/wallet/BannerCarousel";
import ReceiveSheet from "@/components/wallet/ReceiveSheet";
import SendSheet, { addRecentRecipient } from "@/components/wallet/SendSheet";
import SwapSheet, {
  type SecureFormValues,
  type SwapFormValues,
  type SwapView,
} from "@/components/wallet/SwapSheet";
import TokensSheet from "@/components/wallet/TokensSheet";
import TransactionDetailsSheet from "@/components/wallet/TransactionDetailsSheet";
import { useSwap } from "@/hooks/useSwap";
import { useDeviceSafeAreaTop, useTelegramSafeArea } from "@/hooks/useTelegramSafeArea";
import {
  DISPLAY_CURRENCY_KEY,
  TELEGRAM_PUBLIC_KEY_PROD_UINT8ARRAY,
} from "@/lib/constants";
import { track } from "@/lib/core/analytics";
import {
  refundDeposit,
  subscribeToDepositsWithUsername,
  topUpDeposit,
} from "@/lib/solana/deposits";
import { fetchDeposits } from "@/lib/solana/fetch-deposits";
import { fetchSolUsdPrice } from "@/lib/solana/fetch-sol-price";
import { getTelegramTransferProgram } from "@/lib/solana/solana-helpers";
import {
  computePortfolioTotals,
  resolveTokenIcon,
} from "@/lib/solana/token-holdings";
import {
  prepareStoreInitDataTxn,
  sendStoreInitDataTxn,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verifyAndClaimDeposit,
} from "@/lib/solana/verify-and-claim-deposit";
import {
  formatAddress,
  formatSenderAddress,
  formatTransactionAmount,
} from "@/lib/solana/wallet/formatters";
import {
  getGaslessPublicKey,
  getWalletBalance,
  getWalletKeypair,
  getWalletProvider,
  getWalletPublicKey,
  sendSolTransaction,
} from "@/lib/solana/wallet/wallet-details";
import { SimpleWallet } from "@/lib/solana/wallet/wallet-implementation";
import { sendString } from "@/lib/telegram/mini-app";
import {
  hideMainButton,
  hideSecondaryButton,
  showMainButton,
  showReceiveShareButton,
} from "@/lib/telegram/mini-app/buttons";
import { setCloudValue } from "@/lib/telegram/mini-app/cloud-storage";
import {
  cleanInitData,
  createValidationBytesFromRawInitData,
} from "@/lib/telegram/mini-app/init-data-transform";
import { parseUsernameFromInitData } from "@/lib/telegram/mini-app/init-data-transform";
import { openQrScanner } from "@/lib/telegram/mini-app/qr-code";
import {
  createShareMessage,
  shareSavedInlineMessage,
} from "@/lib/telegram/mini-app/share-message";
import type {
  IncomingTransaction,
  Transaction,
  TransactionDetailsData,
} from "@/types/wallet";

import { useDisplayPreferences } from "./hooks/useDisplayPreferences";
import { useSolPrice } from "./hooks/useSolPrice";
import { useTelegramSetup } from "./hooks/useTelegramSetup";
import { useTokenHoldings } from "./hooks/useTokenHoldings";
import { useWalletBalance } from "./hooks/useWalletBalance";
import { useWalletInit } from "./hooks/useWalletInit";
import { useWalletTransactions } from "./hooks/useWalletTransactions";
import {
  CLAIM_SOURCES,
  type ClaimSource,
  getAnalyticsErrorProperties,
  getSendMethod,
  SEND_METHODS,
  SWAP_METHODS,
  type SwapMethod,
  WALLET_ANALYTICS_EVENTS,
  WALLET_ANALYTICS_PATH,
} from "./wallet-analytics";
import {
  cachedUsername,
  getCachedIncomingTransactions,
  mapDepositToIncomingTransaction,
  setCachedDisplayCurrency,
  setCachedIncomingTransactions,
  setCachedSolPrice,
  walletTransactionsCache,
} from "./wallet-cache";
import { MOCK_ACTIVITY_INFO, USE_MOCK_DATA } from "./wallet-mock-data";

hashes.sha512 = sha512;

export default function Home() {
  const rawInitData = useRawInitData();
  const { bottom: _safeBottom } = useTelegramSafeArea();
  // Get device safe area only (not content safe area) to align with native header buttons
  const safeAreaInsetTop = useDeviceSafeAreaTop();
  const [isSendSheetOpen, setSendSheetOpen] = useState(false);
  const [isSwapSheetOpen, setSwapSheetOpen] = useState(false);
  const [swapActiveTab, setSwapActiveTab] = useState<"swap" | "secure">("swap");
  const [swapView, setSwapView] = useState<SwapView>("main");
  const [swapError, setSwapError] = useState<string | null>(null);
  const [swappedFromAmount, setSwappedFromAmount] = useState<
    number | undefined
  >(undefined);
  const [swappedFromSymbol, setSwappedFromSymbol] = useState<
    string | undefined
  >(undefined);
  const [swappedToAmount, setSwappedToAmount] = useState<number | undefined>(
    undefined
  );
  const [swappedToSymbol, setSwappedToSymbol] = useState<string | undefined>(
    undefined
  );
  const [swapFormValues, setSwapFormValues] = useState<SwapFormValues | null>(
    null
  );
  const [secureFormValues, setSecureFormValues] =
    useState<SecureFormValues | null>(null);
  const [secureDirection, setSecureDirection] = useState<"shield" | "unshield">(
    "shield"
  );
  const [isSwapping, setIsSwapping] = useState(false);
  const [sendStep, setSendStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [sentAmountSol, setSentAmountSol] = useState<number | undefined>(
    undefined
  );
  const [sendError, setSendError] = useState<string | null>(null);
  const [isReceiveSheetOpen, setReceiveSheetOpen] = useState(false);
  const [isActivitySheetOpen, setActivitySheetOpen] = useState(false);
  const [isTokensSheetOpen, setTokensSheetOpen] = useState(false);
  const [isTransactionDetailsSheetOpen, setTransactionDetailsSheetOpen] =
    useState(false);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const { walletAddress, setWalletAddress, isLoading } = useWalletInit();
  const { solBalanceLamports, setSolBalanceLamports, refreshBalance } = useWalletBalance(walletAddress);
  const { tokenHoldings, isHoldingsLoading, refreshTokenHoldings } = useTokenHoldings(walletAddress);
  const { walletTransactions, setWalletTransactions, isFetchingTransactions, loadWalletTransactions } = useWalletTransactions(walletAddress);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
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
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDetailsData | null>(null);
  // Keep original incoming transaction for claim functionality
  const [selectedIncomingTransaction, setSelectedIncomingTransaction] =
    useState<IncomingTransaction | null>(null);
  const [isSendFormValid, setIsSendFormValid] = useState(false);
  const [isSwapFormValid, setIsSwapFormValid] = useState(false);
  const [isClaimingTransaction, setIsClaimingTransaction] = useState(false);
  const [sendFormValues, setSendFormValues] = useState<{
    amount: string;
    recipient: string;
  }>({
    amount: "",
    recipient: "",
  });
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const { displayCurrency, setDisplayCurrency, balanceBg, bgLoaded, handleBgSelect } = useDisplayPreferences();
  const [isBgPickerOpen, setBgPickerOpen] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const { isMobilePlatform } = useTelegramSetup(rawInitData);
  const { solPriceUsd, setSolPriceUsd, isSolPriceLoading } = useSolPrice();
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const mainButtonAvailable = useSignal(mainButton.setParams.isAvailable);
  const secondaryButtonAvailable = useSignal(
    secondaryButton.setParams.isAvailable
  );
  // Track seen transaction IDs to detect new ones for animation
  const seenTransactionIdsRef = useRef<Set<string>>(new Set());
  const [newTransactionIds, setNewTransactionIds] = useState<Set<string>>(
    new Set()
  );

  // Sticky balance pill state (scroll-driven, synced with header logo fade)
  const balanceRef = useRef<HTMLDivElement>(null);
  const [stickyBalanceOpacity, setStickyBalanceOpacity] = useState(0);

  const handleOpenSendSheet = useCallback((recipientName?: string) => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    track(WALLET_ANALYTICS_EVENTS.openSend, {
      path: WALLET_ANALYTICS_PATH,
    });
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
    track(WALLET_ANALYTICS_EVENTS.openReceive, {
      path: WALLET_ANALYTICS_PATH,
    });
    setReceiveSheetOpen(true);
  }, []);

  const handleOpenSwapSheet = useCallback(() => {
    hapticFeedback.impactOccurred("light");
    track(WALLET_ANALYTICS_EVENTS.openSwap, {
      path: WALLET_ANALYTICS_PATH,
    });
    setSwapSheetOpen(true);
  }, []);
  const handleOpenWalletTransactionDetails = useCallback(
    (transaction: Transaction) => {
      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("light");
      }
      // Clear incoming transaction ref
      setSelectedIncomingTransaction(null);
      // Convert to TransactionDetailsData format
      // For deposit_for_username transactions, the recipient is the username
      const isDepositTransaction =
        transaction.transferType === "deposit_for_username";
      const recipientUsername = transaction.recipient?.startsWith("@")
        ? transaction.recipient
        : isDepositTransaction && transaction.recipient
        ? `@${transaction.recipient}`
        : undefined;

      const detailsData: TransactionDetailsData = {
        id: transaction.id,
        type: transaction.type === "incoming" ? "incoming" : "outgoing",
        amountLamports: transaction.amountLamports,
        transferType: transaction.transferType,
        tokenMint: transaction.tokenMint,
        tokenAmount: transaction.tokenAmount,
        tokenDecimals: transaction.tokenDecimals,
        recipient: transaction.recipient,
        recipientUsername,
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
        // Swap transaction fields
        swapFromSymbol: transaction.swapFromSymbol,
        swapToSymbol: transaction.swapToSymbol,
        swapToAmount: transaction.swapToAmount,
        swapToAmountUsd: transaction.swapToAmountUsd,
        // Secure/unshield transaction fields
        secureTokenSymbol: transaction.secureTokenSymbol,
        secureTokenIcon: transaction.secureTokenIcon,
        secureAmount: transaction.secureAmount,
        secureAmountUsd: transaction.secureAmountUsd,
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

  const handleSwapParamsChange = useCallback((params: SwapFormValues) => {
    setSwapFormValues(params);
  }, []);

  const handleSecureParamsChange = useCallback((params: SecureFormValues) => {
    setSecureFormValues(params);
    setSecureDirection(params.direction);
  }, []);

  const { executeSwap } = useSwap(getWalletKeypair);

  const handleSubmitSwap = useCallback(async () => {
    if (!swapFormValues || !isSwapFormValid || isSwapping) {
      return;
    }

    const swapMethod: SwapMethod = SWAP_METHODS.regular;
    setIsSwapping(true);
    hapticFeedback.impactOccurred("medium");

    try {
      const result = await executeSwap(swapFormValues);

      if (result.success) {
        setSwappedFromAmount(result.fromAmount);
        setSwappedFromSymbol(result.fromSymbol);
        setSwappedToAmount(result.toAmount);
        setSwappedToSymbol(result.toSymbol);
        setSwapError(null);
        setSwapView("result");
        track(WALLET_ANALYTICS_EVENTS.swapTokens, {
          path: WALLET_ANALYTICS_PATH,
          method: swapMethod,
          from_symbol: result.fromSymbol,
          to_symbol: result.toSymbol,
          from_amount: result.fromAmount,
          to_amount: result.toAmount,
        });

        // Inject swap transaction immediately for instant feedback
        if (result.signature && swapFormValues) {
          const swapTx: Transaction = {
            id: result.signature,
            type: "outgoing",
            transferType: "swap",
            amountLamports: 0,
            signature: result.signature,
            timestamp: Date.now(),
            status: "completed",
            swapFromMint: swapFormValues.fromMint,
            swapToMint: swapFormValues.toMint,
            swapFromSymbol: result.fromSymbol,
            swapToSymbol: result.toSymbol,
            swapToAmount: result.toAmount,
          };
          setWalletTransactions((prev) => {
            const updated = [swapTx, ...prev];
            if (walletAddress) {
              walletTransactionsCache.set(walletAddress, updated);
            }
            return updated;
          });
        }

        // Refresh balance after successful swap
        void refreshBalance(true);
      } else {
        setSwapError(result.error || "Swap failed");
        setSwapView("result");
        track(WALLET_ANALYTICS_EVENTS.swapTokensFailed, {
          path: WALLET_ANALYTICS_PATH,
          method: swapMethod,
          error_name: "SwapError",
          error_message: result.error || "Swap failed",
        });
      }
    } catch (error) {
      console.error("[swap] Error:", error);
      setSwapError(error instanceof Error ? error.message : "Swap failed");
      setSwapView("result");
      track(WALLET_ANALYTICS_EVENTS.swapTokensFailed, {
        path: WALLET_ANALYTICS_PATH,
        method: swapMethod,
        ...getAnalyticsErrorProperties(error),
      });
    } finally {
      setIsSwapping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapFormValues, isSwapFormValid, isSwapping, executeSwap]);

  const handleSubmitSecure = useCallback(async () => {
    if (!secureFormValues || !isSwapFormValid || isSwapping) return;

    const swapMethod: SwapMethod = SWAP_METHODS.secure;
    setIsSwapping(true);
    hapticFeedback.impactOccurred("medium");

    try {
      // TODO: Implement actual secure/unshield transaction
      // For now, simulate success after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSwappedToAmount(secureFormValues.amount);
      setSwappedToSymbol(secureFormValues.symbol);
      setSwapError(null);
      setSwapView("result");
      track(WALLET_ANALYTICS_EVENTS.swapTokens, {
        path: WALLET_ANALYTICS_PATH,
        method: swapMethod,
        secure_direction: secureDirection,
        token_symbol: secureFormValues.symbol,
        amount: secureFormValues.amount,
      });
      void refreshBalance(true);
    } catch (error) {
      console.error("[secure] Error:", error);
      setSwapError(error instanceof Error ? error.message : "Operation failed");
      setSwapView("result");
      track(WALLET_ANALYTICS_EVENTS.swapTokensFailed, {
        path: WALLET_ANALYTICS_PATH,
        method: swapMethod,
        secure_direction: secureDirection,
        ...getAnalyticsErrorProperties(error),
      });
    } finally {
      setIsSwapping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secureDirection, secureFormValues, isSwapFormValid, isSwapping]);

  const _handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }

    setIsRefreshing(true);
    try {
      // Refresh wallet balance
      await refreshBalance(true);
      await refreshTokenHoldings(true);

      try {
        const latestPrice = await fetchSolUsdPrice();
        setCachedSolPrice(latestPrice);
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
  }, [
    isRefreshing,
    loadWalletTransactions,
    rawInitData,
    refreshTokenHoldings,
    refreshBalance,
    setSolPriceUsd,
  ]);

  const handleSubmitSend = useCallback(async () => {
    if (!isSendFormValid || isSendingTransaction) {
      return;
    }

    const trimmedRecipient = sendFormValues.recipient.trim();
    const sendMethod = getSendMethod(trimmedRecipient);
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

      if (sendMethod === SEND_METHODS.walletAddress) {
        signature = await sendSolTransaction(trimmedRecipient, lamports);
      } else if (sendMethod === SEND_METHODS.telegram) {
        const username = trimmedRecipient.replace(/^@/, "");
        const provider = await getWalletProvider();
        const transferProgram = getTelegramTransferProgram(provider);
        await topUpDeposit(provider, transferProgram, username, lamports);
      } else {
        throw new Error("Invalid recipient");
      }

      await refreshBalance(true);
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
      track(WALLET_ANALYTICS_EVENTS.sendFunds, {
        path: WALLET_ANALYTICS_PATH,
        method: sendMethod,
        amount_sol: sentSolAmount,
        amount_lamports: lamports,
      });
    } catch (error) {
      console.error("Failed to send transaction", error);
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("error");
      }
      track(WALLET_ANALYTICS_EVENTS.sendFundsFailed, {
        path: WALLET_ANALYTICS_PATH,
        method: sendMethod,
        ...getAnalyticsErrorProperties(error),
      });

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setSendError(errorMessage);
    } finally {
      setIsSendingTransaction(false);
    }
  }, [
    isSendFormValid,
    isSendingTransaction,
    sendFormValues,
    loadWalletTransactions,
    refreshBalance,
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
      setShowConfetti(false); // Reset confetti state
    }
  }, []);

  // Handle canceling (refunding) a deposit_for_username transaction
  const handleCancelDeposit = useCallback(
    async (username: string, amount: number) => {
      try {
        const provider = await getWalletProvider();
        const transferProgram = getTelegramTransferProgram(provider);
        await refundDeposit(provider, transferProgram, username, amount);

        if (hapticFeedback.notificationOccurred.isAvailable()) {
          hapticFeedback.notificationOccurred("success");
        }

        // Close the modal and refresh data
        setTransactionDetailsSheetOpen(false);
        setSelectedTransaction(null);

        // Refresh balance and transactions
        void getWalletBalance(true).then(setSolBalanceLamports);
      } catch (error) {
        console.error("Failed to refund deposit:", error);
        if (hapticFeedback.notificationOccurred.isAvailable()) {
          hapticFeedback.notificationOccurred("error");
        }
        throw error; // Re-throw so the sheet can handle it
      }
    },
    [setSolBalanceLamports]
  );

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
  }, [setWalletAddress, walletAddress]);

  const handleShareDepositTransaction = useCallback(async () => {
    if (!selectedTransaction || !rawInitData || !solPriceUsd) {
      console.error(
        "Failed to share deposit transaction: missing required data"
      );
      return;
    }

    // Get recipient username from transaction (remove @ prefix if present)
    const recipientUsername =
      selectedTransaction.recipientUsername?.replace(/^@/, "") || "";
    if (!recipientUsername) {
      console.error(
        "Failed to share deposit transaction: missing recipient username"
      );
      return;
    }

    try {
      const amountSol = selectedTransaction.amountLamports / LAMPORTS_PER_SOL;
      const amountUsd = amountSol * solPriceUsd;

      const msgId = await createShareMessage(
        rawInitData,
        recipientUsername,
        amountSol,
        amountUsd
      );

      if (msgId) {
        await shareSavedInlineMessage(msgId);
      }
    } catch (error) {
      console.error("Failed to share deposit transaction", error);
    }
  }, [selectedTransaction, rawInitData, solPriceUsd]);

  const handleScanQR = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    void openQrScanner();
  }, []);

  const handleSwapTabChange = useCallback((tab: "swap" | "secure") => {
    setSwapActiveTab(tab);
    if (tab === "secure") {
      track(WALLET_ANALYTICS_EVENTS.openSecureSwap, {
        path: WALLET_ANALYTICS_PATH,
      });
    }
  }, []);

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
        const senderPublicKey = new PublicKey(transaction.sender);

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
    [
      incomingTransactions,
      rawInitData,
      refreshBalance,
      loadWalletTransactions,
    ]
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
        const transferProgram = getTelegramTransferProgram(provider);
        console.log("Fetching deposits for username:", username);
        const deposits = await fetchDeposits(provider, username);
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
          transferProgram,
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

  useEffect(() => {
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

    // Bg picker manages its own main button
    if (isBgPickerOpen) {
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
        if (isClaimingTransaction) {
          // Show only main button with loader during claim
          showMainButton({
            text: "Claim",
            onClick: () => {}, // No-op during loading
            isEnabled: false,
            showLoader: true,
          });
        } else {
          // Show Claim button
          showMainButton({
            text: "Claim",
            onClick: () =>
              handleApproveTransaction(
                selectedIncomingTransaction.id,
                CLAIM_SOURCES.manual
              ),
          });
        }
      } else {
        // For outgoing transactions, hide the main button
        hideMainButton();
      }
    } else if (isSendSheetOpen) {
      hideSecondaryButton();

      if (sendStep === 1) {
        // Token selection — no main button, token click auto-advances
        hideMainButton();
      } else if (sendStep === 2) {
        showMainButton({
          text: "Next",
          onClick: () => {
            if (isSendFormValid) setSendStep(3);
          },
          isEnabled: isSendFormValid,
          showLoader: false,
        });
      } else if (sendStep === 3) {
        showMainButton({
          text: "Review",
          onClick: () => {
            if (isSendFormValid) setSendStep(4);
          },
          isEnabled: isSendFormValid,
          showLoader: false,
        });
      } else if (sendStep === 4) {
        showMainButton({
          text: "Confirm and Send",
          onClick: () => {
            setIsSendingTransaction(true); // Set loading state BEFORE showing result view
            setSendStep(5);
            handleSubmitSend();
          },
          isEnabled: isSendFormValid && !isSendingTransaction,
          showLoader: false,
        });
      } else if (sendStep === 5) {
        if (isSendingTransaction) {
          // In-progress — hide button while spinner shows
          hideMainButton();
        } else if (sendError) {
          showMainButton({
            text: "Done",
            onClick: () => {
              setSendSheetOpen(false);
            },
            isEnabled: true,
            showLoader: false,
          });
        } else {
          showMainButton({
            text: "Share transaction",
            onClick: async () => {
              setSendSheetOpen(false);
              const recipientUsername = sendFormValues.recipient
                .trim()
                .replace(/^@/, "");

              if (
                sentAmountSol &&
                recipientUsername &&
                rawInitData &&
                solPriceUsd
              ) {
                try {
                  const amountSol = sentAmountSol;
                  const amountUsd = amountSol * (solPriceUsd || 0);
                  const msgId = await createShareMessage(
                    rawInitData,
                    recipientUsername,
                    amountSol,
                    amountUsd
                  );
                  if (msgId) {
                    await shareSavedInlineMessage(msgId);
                  }
                } catch (error) {
                  console.error("Failed to share transaction", error);
                }
              } else {
                console.error(
                  "Failed to share transaction: missing required data"
                );
              }
            },
            isEnabled: true,
            showLoader: false,
          });
        }
      }
    } else if (isSwapSheetOpen) {
      hideSecondaryButton();
      if (swapView === "result") {
        if (isSwapping) {
          // Swapping in progress - hide button
          hideMainButton();
        } else {
          // Result view (success or error) - show Done button
          showMainButton({
            text: "Done",
            onClick: () => {
              hapticFeedback.impactOccurred("light");
              setSwapSheetOpen(false);
              // Reset swap state
              setSwapView("main");
              setSwapActiveTab("swap");
              setSwapError(null);
              setSwappedFromAmount(undefined);
              setSwappedFromSymbol(undefined);
              setSwappedToAmount(undefined);
              setSwappedToSymbol(undefined);
            },
            isEnabled: true,
            showLoader: false,
          });
        }
      } else if (swapView === "confirm") {
        // Confirm view - show "Confirm and Swap" button
        showMainButton({
          text: "Confirm and Swap",
          onClick: () => {
            hapticFeedback.impactOccurred("medium");
            setIsSwapping(true); // Set loading state BEFORE showing result view
            setSwapView("result");
            void handleSubmitSwap();
          },
          isEnabled: !isSwapping,
          showLoader: false,
        });
      } else if (swapView === "main") {
        if (swapActiveTab === "swap") {
          showMainButton({
            text: "Review",
            onClick: () => {
              hapticFeedback.impactOccurred("light");
              setSwapView("confirm");
            },
            isEnabled: isSwapFormValid && !isSwapping,
            showLoader: false,
          });
        } else {
          const btnText =
            secureDirection === "shield"
              ? "Confirm and Shield"
              : "Confirm and Unshield";
          showMainButton({
            text: btnText,
            onClick: () => {
              hapticFeedback.impactOccurred("medium");
              setIsSwapping(true);
              setSwapView("result");
              void handleSubmitSecure();
            },
            isEnabled: isSwapFormValid && !isSwapping,
            showLoader: false,
          });
        }
      } else {
        // Token selection views - hide main button
        hideMainButton();
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
    isSwapSheetOpen,
    isReceiveSheetOpen,
    isBgPickerOpen,
    isSendFormValid,
    isSwapFormValid,
    isSendingTransaction,
    selectedTransaction,
    selectedIncomingTransaction,
    isClaimingTransaction,
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
    rawInitData,
    solPriceUsd,
    swapView,
    swapActiveTab,
    handleSubmitSwap,
    handleSubmitSecure,
    secureDirection,
    isSwapping,
  ]);

  const portfolioTotals = useMemo(
    () => computePortfolioTotals(tokenHoldings, solPriceUsd),
    [tokenHoldings, solPriceUsd]
  );

  const showBalanceSkeleton =
    isLoading ||
    isHoldingsLoading ||
    (displayCurrency === "SOL" && portfolioTotals.totalSol === null);
  const showSecondarySkeleton =
    isLoading ||
    isHoldingsLoading ||
    (displayCurrency === "USD" && portfolioTotals.totalSol === null);
  // Computed numeric values for NumberFlow animations (portfolio totals)
  const usdBalanceNumeric = portfolioTotals.totalUsd;
  const solBalanceNumeric = portfolioTotals.totalSol ?? 0;

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

  // Track window size for confetti
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Track balance card position for sticky pill crossfade with header logo.
  // Crossfade starts as the card bottom approaches the header — i.e. when
  // the card is almost fully scrolled behind the header, not when its top
  // edge first touches it.
  useEffect(() => {
    const headerBottom = Math.max(safeAreaInsetTop || 0, 12) + 10 + 27 + 16;
    const fadeRange = 50; // px over which the crossfade happens

    const handleScroll = () => {
      const el = balanceRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Progress 0→1 as the card bottom moves from (headerBottom + fadeRange) to headerBottom
      const progress =
        rect.bottom >= headerBottom + fadeRange
          ? 0
          : rect.bottom <= headerBottom
          ? 1
          : 1 - (rect.bottom - headerBottom) / fadeRange;
      setStickyBalanceOpacity(progress);
      document.documentElement.style.setProperty(
        "--header-logo-opacity",
        String(1 - progress)
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.documentElement.style.removeProperty("--header-logo-opacity");
    };
  }, [safeAreaInsetTop]);

  const handleScrollToTop = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      {/* Confetti for claim success */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
          initialVelocityX={8}
          initialVelocityY={25}
          tweenDuration={100}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 100 }}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
      <main
        className="min-h-screen font-sans overflow-hidden relative flex flex-col"
        style={{ background: "#fff" }}
      >
        {/* Sticky Balance Pill — scroll-driven crossfade with header logo */}
        {!showBalanceSkeleton && (
          <button
            onClick={handleScrollToTop}
            className="fixed left-1/2 -translate-x-1/2 z-[51] flex items-center px-4 py-1.5 rounded-[54px] active:opacity-80"
            style={{
              top: `${Math.max(safeAreaInsetTop || 0, 12) + 4}px`,
              background: "#fff",
              opacity: stickyBalanceOpacity,
              pointerEvents: stickyBalanceOpacity > 0.1 ? "auto" : "none",
              willChange: "opacity",
            }}
          >
            <span
              className="text-sm font-medium text-black"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {displayCurrency === "USD"
                ? `$${usdBalanceNumeric.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : `${solBalanceNumeric.toLocaleString("en-US", {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 4,
                  })} SOL`}
            </span>
          </button>
        )}

        {/* Main Content */}
        <div className="relative flex-1 flex flex-col w-full">
          {/* Balance Card */}
          <div className="flex flex-col items-center pt-5 px-4">
            <div
              ref={balanceRef}
              className="relative w-full overflow-hidden rounded-[26px]"
              style={{
                border: "2px solid rgba(255, 255, 255, 0.1)",
                aspectRatio: "361 / 203",
              }}
            >
              {/* Card background layers */}
              <div
                className="absolute inset-0 rounded-[26px]"
                style={{ background: "#f2f2f7" }}
              />
              {!bgLoaded && (
                <div
                  className="absolute inset-0 rounded-[26px] animate-pulse"
                  style={{ background: "rgba(0, 0, 0, 0.04)" }}
                />
              )}
              {balanceBg && (
                <Image
                  src={`/bgs/${balanceBg}.png`}
                  alt=""
                  fill
                  className="object-cover rounded-[26px]"
                  priority
                />
              )}
              {/* Inner shadow overlay */}
              <div
                className="absolute inset-0 rounded-[26px] pointer-events-none"
                style={{
                  boxShadow: "inset 0px 0px 36px 0px rgba(255, 255, 255, 0.4)",
                }}
              />

              {/* Card content */}
              <div className="relative flex flex-col justify-between h-full p-4">
                {/* Top: Wallet address */}
                {isLoading || !walletAddress ? (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-white/20 animate-pulse rounded" />
                    <div className="w-24 h-5 bg-white/20 animate-pulse rounded" />
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
                    className="flex items-center gap-1 active:opacity-70 transition-opacity self-start"
                  >
                    <Copy
                      className="w-5 h-5"
                      strokeWidth={1.5}
                      style={{
                        color: balanceBg ? "white" : "rgba(60, 60, 67, 0.6)",
                      }}
                    />
                    <span
                      className="text-[17px] leading-[22px]"
                      style={{
                        color: balanceBg ? "white" : "rgba(60, 60, 67, 0.6)",
                      }}
                    >
                      {addressCopied ? "Copied!" : formatAddress(walletAddress)}
                    </span>
                  </button>
                )}

                {/* Bottom: Balance + USD value */}
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      if (hapticFeedback.selectionChanged.isAvailable()) {
                        hapticFeedback.selectionChanged();
                      }
                      setDisplayCurrency((prev) => {
                        const newCurrency = prev === "USD" ? "SOL" : "USD";
                        setCachedDisplayCurrency(newCurrency);
                        void setCloudValue(DISPLAY_CURRENCY_KEY, newCurrency);
                        return newCurrency;
                      });
                    }}
                    className="active:scale-[0.98] transition-transform self-start"
                  >
                    {(() => {
                      const mainColor = balanceBg ? "white" : "#1c1c1e";
                      const decimalColor = balanceBg
                        ? "white"
                        : "rgba(60, 60, 67, 0.6)";

                      if (showBalanceSkeleton) {
                        return (
                          <div className="flex items-center gap-2">
                            <div className="w-40 h-10 bg-white/20 animate-pulse rounded" />
                            <div className="w-16 h-8 bg-white/20 animate-pulse rounded" />
                          </div>
                        );
                      }

                      const value =
                        displayCurrency === "USD"
                          ? usdBalanceNumeric
                          : solBalanceNumeric;
                      const decimals = displayCurrency === "USD" ? 2 : 4;
                      const prefix = displayCurrency === "USD" ? "$" : "";
                      const suffix = displayCurrency === "SOL" ? " SOL" : "";

                      // Convert to a stable fixed string so decimal digits never drift due to float math.
                      const fixed = value.toFixed(decimals);
                      const [intStr, decStr = "0"] = fixed.split(".");
                      const intPart = Number(intStr);
                      const decimalDigits = Number(decStr);

                      return (
                        <span
                          className="font-semibold inline-flex items-baseline"
                          style={{
                            fontVariantNumeric: "tabular-nums",
                            lineHeight: "48px",
                            color: mainColor,
                          }}
                        >
                          {prefix && (
                            <span className="text-[40px]">{prefix}</span>
                          )}
                          <NumberFlow
                            value={intPart}
                            style={{ fontSize: "40px" }}
                            format={{
                              maximumFractionDigits: 0,
                              useGrouping: true,
                            }}
                            willChange
                          />
                          <NumberFlow
                            value={decimalDigits}
                            prefix="."
                            suffix={suffix}
                            style={{ fontSize: "28px", color: decimalColor }}
                            format={{
                              minimumIntegerDigits: decimals,
                              useGrouping: false,
                            }}
                            willChange
                          />
                        </span>
                      );
                    })()}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[17px] leading-[22px]"
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        color: balanceBg ? "white" : "rgba(60, 60, 67, 0.6)",
                      }}
                    >
                      {showSecondarySkeleton ? (
                        <span className="inline-block w-28 h-5 bg-white/20 animate-pulse rounded" />
                      ) : displayCurrency === "USD" ? (
                        `${solBalanceNumeric.toLocaleString("en-US", {
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 4,
                        })} SOL`
                      ) : (
                        `$${usdBalanceNumeric.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      )}
                    </span>
                  </div>
                </div>

                {/* Brush icon for background picker */}
                {bgLoaded && (
                  <button
                    onClick={() => {
                      if (hapticFeedback.impactOccurred.isAvailable()) {
                        hapticFeedback.impactOccurred("light");
                      }
                      setBgPickerOpen(true);
                    }}
                    className="absolute bottom-4 right-4 p-2 rounded-full backdrop-blur-[8px] active:opacity-70 transition-opacity"
                    style={{
                      background: balanceBg
                        ? "rgba(255, 255, 255, 0.15)"
                        : "rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <Brush
                      size={20}
                      strokeWidth={1.5}
                      style={{
                        color: balanceBg
                          ? "rgba(255, 255, 255, 0.6)"
                          : "rgba(60, 60, 67, 0.6)",
                      }}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center px-4 pt-5 pb-4">
            <ActionButton
              icon={<ArrowUp />}
              label="Send"
              onClick={() => handleOpenSendSheet()}
              disabled={solBalanceLamports === null || solBalanceLamports === 0}
            />
            <ActionButton
              icon={<ArrowDown />}
              label="Receive"
              onClick={handleOpenReceiveSheet}
            />
            <ActionButton
              icon={<RefreshCcw />}
              label="Swap"
              onClick={handleOpenSwapSheet}
            />
            <ActionButton
              icon={<ScanIcon />}
              label={isMobilePlatform ? "Scan" : "Mobile only"}
              onClick={handleScanQR}
              disabled={!isMobilePlatform}
            />
          </div>

          {/* Banner Carousel */}
          <BannerCarousel isMobilePlatform={isMobilePlatform} />

          {/* Tokens Section */}
          {(() => {
            const displayTokens =
              tokenHoldings.length > 0
                ? tokenHoldings
                : [
                    {
                      mint: "SOL",
                      symbol: "SOL",
                      name: "Solana",
                      balance: 0,
                      decimals: 9,
                      priceUsd: solPriceUsd,
                      valueUsd: 0,
                      imageUrl: "/tokens/solana-sol-logo.png",
                    },
                  ];
            return (
              <>
                <div className="px-3 pt-3 pb-2">
                  <p className="text-base font-medium text-black leading-5 tracking-[-0.176px]">
                    Tokens
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-center px-4 pb-4">
                  {displayTokens.slice(0, 5).map((token) => {
                    const iconSrc = resolveTokenIcon(token);

                    return (
                      <div
                        key={token.mint}
                        className="flex items-center w-full overflow-hidden rounded-[20px] px-4 py-1"
                        style={{ border: "2px solid #f2f2f7" }}
                      >
                        {/* Token icon */}
                        <div className="py-1.5 pr-3">
                          <div className="w-12 h-12 relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden relative bg-[#f2f2f7]">
                              <Image
                                src={iconSrc}
                                alt={token.symbol}
                                fill
                                className="object-cover"
                              />
                            </div>
                            {token.isSecured && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-[20px] h-[20px]">
                                <Image
                                  src="/Shield.svg"
                                  alt="Secured"
                                  width={20}
                                  height={20}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Token info */}
                        <div className="flex-1 flex flex-col py-2.5 min-w-0">
                          <p className="text-[17px] font-medium text-black leading-[22px] tracking-[-0.187px]">
                            {token.symbol}
                          </p>
                          <p
                            className="text-[15px] leading-5"
                            style={{ color: "rgba(60, 60, 67, 0.6)" }}
                          >
                            {token.priceUsd !== null
                              ? `$${token.priceUsd.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                              : "—"}
                          </p>
                        </div>
                        {/* Token amount */}
                        <div className="flex flex-col items-end py-2.5 pl-3">
                          <p className="text-[17px] text-black leading-[22px] text-right">
                            {token.balance.toLocaleString("en-US", {
                              maximumFractionDigits: 4,
                            })}
                          </p>
                          <p
                            className="text-[15px] leading-5 text-right"
                            style={{ color: "rgba(60, 60, 67, 0.6)" }}
                          >
                            {token.valueUsd !== null
                              ? `$${token.valueUsd.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                              : "—"}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Show All button */}
                  {tokenHoldings.length > 5 && (
                    <button
                      onClick={() => {
                        if (hapticFeedback.impactOccurred.isAvailable()) {
                          hapticFeedback.impactOccurred("light");
                        }
                        setTokensSheetOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium leading-5"
                      style={{
                        background: "rgba(249, 54, 60, 0.14)",
                        color: "#f9363c",
                      }}
                    >
                      Show All
                    </button>
                  )}
                </div>
              </>
            );
          })()}

          {/* Activity Section - conditionally rendered */}
          {(() => {
            const hasNoTransactions =
              incomingTransactions.length === 0 &&
              walletTransactions.length === 0;
            const isActivityLoading =
              isLoading ||
              (isFetchingTransactions && walletTransactions.length === 0) ||
              (isFetchingDeposits && incomingTransactions.length === 0);

            // Loading state - show skeleton transaction cards
            if (isActivityLoading) {
              return (
                <>
                  <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                    <p className="text-base font-medium text-black leading-5 tracking-[-0.176px]">
                      Activity
                    </p>
                  </div>
                  <div className="flex-1 px-4 pb-4">
                    <div className="flex flex-col">
                      {/* Skeleton Transaction Card 1 */}
                      <div className="flex items-center px-4 rounded-2xl overflow-hidden">
                        <div className="py-1.5 pr-3">
                          <div className="w-12 h-12 rounded-full bg-black/5 animate-pulse" />
                        </div>
                        <div className="flex-1 py-2.5 flex flex-col gap-1.5">
                          <div className="w-20 h-5 bg-black/5 animate-pulse rounded" />
                          <div className="w-28 h-4 bg-black/5 animate-pulse rounded" />
                        </div>
                        <div className="flex flex-col items-end gap-1.5 py-2.5 pl-3">
                          <div className="w-16 h-5 bg-black/5 animate-pulse rounded" />
                          <div className="w-12 h-4 bg-black/5 animate-pulse rounded" />
                        </div>
                      </div>
                      {/* Skeleton Transaction Card 2 */}
                      <div className="flex items-center px-4 rounded-2xl overflow-hidden">
                        <div className="py-1.5 pr-3">
                          <div className="w-12 h-12 rounded-full bg-black/5 animate-pulse" />
                        </div>
                        <div className="flex-1 py-2.5 flex flex-col gap-1.5">
                          <div className="w-16 h-5 bg-black/5 animate-pulse rounded" />
                          <div className="w-24 h-4 bg-black/5 animate-pulse rounded" />
                        </div>
                        <div className="flex flex-col items-end gap-1.5 py-2.5 pl-3">
                          <div className="w-20 h-5 bg-black/5 animate-pulse rounded" />
                          <div className="w-14 h-4 bg-black/5 animate-pulse rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            }

            // No transactions - show empty state
            if (hasNoTransactions) {
              return (
                <div className="flex-1">
                  {/* Activity header */}
                  <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                    <p className="text-base font-medium text-black leading-5 tracking-[-0.176px]">
                      Activity
                    </p>
                  </div>
                  {/* Empty transactions state */}
                  <div className="px-4 pb-36">
                    <div className="flex flex-col gap-4 items-center justify-center px-8 py-6 rounded-[20px]">
                      <Image
                        src="/dogs/dog-cry.png"
                        alt=""
                        width={60}
                        height={48}
                      />
                      <p
                        className="text-[17px] leading-[22px] text-center"
                        style={{ color: "rgba(60, 60, 67, 0.6)" }}
                      >
                        You don&apos;t have any transactions yet
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // Normal state with transactions
            return (
              <>
                <div className="px-3 pt-3 pb-2">
                  <p className="text-base font-medium text-black leading-5 tracking-[-0.176px]">
                    Activity
                  </p>
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex flex-col pb-36">
                    <AnimatePresence initial={false} mode="popLayout">
                      {limitedActivityItems.map((item) => {
                        const isNewTransaction = newTransactionIds.has(
                          item.transaction.id
                        );

                        if (item.type === "incoming") {
                          const transaction = item.transaction;
                          return (
                            <motion.div
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
                              className="flex items-center px-4 rounded-2xl overflow-hidden w-full"
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
                                <p className="text-base text-black leading-5">
                                  Receiving
                                </p>
                                <p
                                  className="text-[13px] leading-4"
                                  style={{ color: "rgba(60, 60, 67, 0.6)" }}
                                >
                                  {formatTransactionAmount(
                                    transaction.amountLamports
                                  )}{" "}
                                  SOL from{" "}
                                  {formatSenderAddress(transaction.sender)}
                                </p>
                              </div>

                              {/* Right - Claiming Badge with pulse animation */}
                              <div className="py-2.5 pl-3">
                                <motion.div
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm leading-5"
                                  style={{
                                    background: "rgba(50, 229, 94, 0.15)",
                                    color: "#32e55e",
                                  }}
                                  animate={{ opacity: [1, 0.4, 1] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                >
                                  Claiming...
                                </motion.div>
                              </div>
                            </motion.div>
                          );
                        }

                        // Wallet transaction
                        const transaction = item.transaction;
                        const isIncoming = transaction.type === "incoming";
                        const isPending = transaction.type === "pending";
                        const mockInfo = USE_MOCK_DATA
                          ? MOCK_ACTIVITY_INFO[transaction.id]
                          : undefined;
                        const isSecureTransaction =
                          transaction.transferType === "secure";
                        const isUnshieldTransaction =
                          transaction.transferType === "unshield";
                        const isSecureOrUnshield =
                          isSecureTransaction || isUnshieldTransaction;
                        const _isDepositForUsername =
                          transaction.transferType === "deposit_for_username";
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
                          : "#000";
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
                            >
                              {/* Left - Text */}
                              <div className="flex-1 flex items-center">
                                <p
                                  className="text-sm leading-5"
                                  style={{ color: "rgba(60, 60, 67, 0.6)" }}
                                >
                                  {transferTypeLabel}
                                </p>
                              </div>

                              {/* Right - Date only */}
                              <div className="pl-3">
                                <p
                                  className="text-[13px] leading-4"
                                  style={{ color: "rgba(60, 60, 67, 0.4)" }}
                                >
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

                        // Secure/Unshield transaction view
                        if (isSecureOrUnshield) {
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
                              className="flex items-center px-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity"
                            >
                              {/* Left - Icon */}
                              <div className="py-1.5 pr-3">
                                <div className="w-12 h-12 relative">
                                  <div className="absolute left-0 top-0 w-8 h-8 rounded-full overflow-hidden bg-[#f2f2f7]">
                                    <Image
                                      src={
                                        transaction.secureTokenIcon ||
                                        "/tokens/solana-sol-logo.png"
                                      }
                                      alt={
                                        transaction.secureTokenSymbol || "Token"
                                      }
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="absolute bottom-0 right-0 w-8 h-8">
                                    <Image
                                      src={
                                        isSecureTransaction
                                          ? "/icons/Shield_32.png"
                                          : "/icons/Unshield_32.png"
                                      }
                                      alt={
                                        isSecureTransaction
                                          ? "Shielded"
                                          : "Unshielded"
                                      }
                                      width={32}
                                      height={32}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Middle - Text */}
                              <div className="flex-1 py-2.5 flex flex-col gap-0.5">
                                <p className="text-base text-black leading-5">
                                  {isSecureTransaction
                                    ? "Shielded"
                                    : "Unshielded"}
                                </p>
                                <p
                                  className="text-[13px] leading-4"
                                  style={{ color: "rgba(60, 60, 67, 0.6)" }}
                                >
                                  {transaction.secureTokenSymbol || "Token"}
                                </p>
                              </div>

                              {/* Right - Value */}
                              <div className="flex flex-col items-end gap-0.5 py-2.5 pl-3">
                                <p className="text-base leading-5 text-black">
                                  {transaction.secureAmount
                                    ? `${transaction.secureAmount.toLocaleString(
                                        "en-US",
                                        { maximumFractionDigits: 4 }
                                      )} ${transaction.secureTokenSymbol || ""}`
                                    : `${formatTransactionAmount(
                                        transaction.amountLamports
                                      )} SOL`}
                                </p>
                                <p
                                  className="text-[13px] leading-4"
                                  style={{ color: "rgba(60, 60, 67, 0.6)" }}
                                >
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

                        // Swap transaction view
                        if (transaction.transferType === "swap") {
                          const swapFromHolding = transaction.swapFromMint
                            ? tokenHoldings.find(
                                (h) => h.mint === transaction.swapFromMint
                              )
                            : undefined;
                          const swapToHolding = transaction.swapToMint
                            ? tokenHoldings.find(
                                (h) => h.mint === transaction.swapToMint
                              )
                            : undefined;
                          const swapFromIcon = transaction.swapFromMint
                            ? resolveTokenIcon({
                                mint: transaction.swapFromMint,
                                imageUrl: swapFromHolding?.imageUrl,
                              })
                            : "/tokens/solana-sol-logo.png";
                          const swapToIcon = transaction.swapToMint
                            ? resolveTokenIcon({
                                mint: transaction.swapToMint,
                                imageUrl: swapToHolding?.imageUrl,
                              })
                            : "/tokens/solana-sol-logo.png";
                          const swapFromSymbol =
                            transaction.swapFromSymbol ||
                            swapFromHolding?.symbol ||
                            "?";
                          const swapToSymbol =
                            transaction.swapToSymbol ||
                            swapToHolding?.symbol ||
                            "?";
                          const swapToAmount = transaction.swapToAmount;

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
                              className="flex items-center px-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity"
                            >
                              {/* Swap token icons - from (back) + to (front) */}
                              <div className="py-1.5 pr-3">
                                <div className="w-12 h-12 relative">
                                  <div className="absolute left-0.5 top-0.5 w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-[#f2f2f7]">
                                    <Image
                                      src={swapFromIcon}
                                      alt={swapFromSymbol}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="absolute right-0.5 bottom-0.5 w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-[#f2f2f7]">
                                    <Image
                                      src={swapToIcon}
                                      alt={swapToSymbol}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Middle - Text */}
                              <div className="flex-1 py-2.5 flex flex-col gap-0.5">
                                <p className="text-base text-black leading-5">
                                  Swap
                                </p>
                                <p
                                  className="text-[13px] leading-4"
                                  style={{ color: "rgba(60, 60, 67, 0.6)" }}
                                >
                                  {swapFromSymbol} to {swapToSymbol}
                                </p>
                              </div>

                              {/* Right - Value */}
                              <div className="flex flex-col items-end gap-0.5 py-2.5 pl-3">
                                <p
                                  className="text-base leading-5"
                                  style={{ color: "#32e55e" }}
                                >
                                  {swapToAmount != null
                                    ? `+${swapToAmount.toLocaleString("en-US", {
                                        maximumFractionDigits: 4,
                                      })} ${swapToSymbol}`
                                    : "Swap"}
                                </p>
                                <p
                                  className="text-[13px] leading-4"
                                  style={{ color: "rgba(60, 60, 67, 0.6)" }}
                                >
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
                            className="flex items-center px-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity"
                          >
                            {/* Left - Icon */}
                            <div className="py-1.5 pr-3">
                              {isPending ? (
                                <div className="w-12 h-12 rounded-full overflow-hidden relative">
                                  <Image
                                    src="/loyal-shield.png"
                                    alt="To be claimed"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : mockInfo ? (
                                <div className="w-12 h-12 rounded-full overflow-hidden relative bg-[#f2f2f7]">
                                  <Image
                                    src={mockInfo.tokenIcon}
                                    alt={mockInfo.tokenSymbol}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-full overflow-hidden relative">
                                  <Image
                                    src="/tokens/solana-sol-logo.png"
                                    alt="SOL"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Middle - Text */}
                            <div className="flex-1 py-2.5 flex flex-col gap-0.5">
                              <p className="text-base text-black leading-5">
                                {mockInfo
                                  ? mockInfo.label
                                  : isIncoming
                                  ? "Received"
                                  : isPending
                                  ? "To be claimed"
                                  : "Sent"}
                              </p>
                              {mockInfo ? (
                                <p
                                  className="text-[13px] leading-4"
                                  style={{ color: "rgba(60, 60, 67, 0.6)" }}
                                >
                                  {mockInfo.subtitle}
                                </p>
                              ) : (
                                !(
                                  isPending === false &&
                                  !isIncoming &&
                                  isUnknownRecipient
                                ) && (
                                  <p
                                    className="text-[13px] leading-4"
                                    style={{ color: "rgba(60, 60, 67, 0.6)" }}
                                  >
                                    {isIncoming
                                      ? "from"
                                      : isPending
                                      ? "by"
                                      : "to"}{" "}
                                    {formattedCounterparty}
                                  </p>
                                )
                              )}
                            </div>

                            {/* Right - Value */}
                            <div className="flex flex-col items-end gap-0.5 py-2.5 pl-3">
                              <p
                                className="text-base leading-5"
                                style={{ color: amountColor }}
                              >
                                {mockInfo
                                  ? mockInfo.displayAmount
                                  : `${amountPrefix}${
                                      isEffectivelyZero
                                        ? "0"
                                        : formatTransactionAmount(
                                            transaction.amountLamports
                                          )
                                    } SOL`}
                              </p>
                              <p
                                className="text-[13px] leading-4"
                                style={{ color: "rgba(60, 60, 67, 0.6)" }}
                              >
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

                    {/* Show All button */}
                    {incomingTransactions.length + walletTransactions.length >
                      10 && (
                      <button
                        onClick={handleOpenActivitySheet}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium leading-5"
                        style={{
                          background: "rgba(249, 54, 60, 0.14)",
                          color: "#f9363c",
                        }}
                      >
                        Show All
                      </button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Bottom Fade Gradient */}
        <div
          className="fixed bottom-0 left-0 right-0 h-32 z-40 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, #fff)",
          }}
        />
      </main>

      <SendSheet
        open={isSendSheetOpen}
        onOpenChange={handleSendSheetChange}
        initialRecipient={selectedRecipient}
        onValidationChange={handleSendValidationChange}
        onFormValuesChange={handleSendFormValuesChange}
        step={sendStep}
        onStepChange={setSendStep}
        balance={solBalanceLamports}
        walletAddress={walletAddress ?? undefined}
        solPriceUsd={solPriceUsd}
        isSolPriceLoading={isSolPriceLoading}
        sentAmountSol={sentAmountSol}
        sendError={sendError}
        isSending={isSendingTransaction}
        tokenHoldings={tokenHoldings}
      />
      <SwapSheet
        open={isSwapSheetOpen}
        onOpenChange={(open) => {
          setSwapSheetOpen(open);
          if (!open) {
            // Reset swap state when closing
            setSwapView("main");
            setSwapActiveTab("swap");
            setSwapError(null);
            setSwappedFromAmount(undefined);
            setSwappedFromSymbol(undefined);
            setSwappedToAmount(undefined);
            setSwappedToSymbol(undefined);
            setSecureDirection("shield");
            setSecureFormValues(null);
          }
        }}
        tokenHoldings={tokenHoldings}
        solPriceUsd={solPriceUsd}
        onValidationChange={setIsSwapFormValid}
        onSwapParamsChange={handleSwapParamsChange}
        onSecureParamsChange={handleSecureParamsChange}
        activeTab={swapActiveTab}
        onTabChange={handleSwapTabChange}
        secureDirection={secureDirection}
        onSecureDirectionChange={setSecureDirection}
        view={swapView}
        onViewChange={setSwapView}
        swapError={swapError}
        swappedFromAmount={swappedFromAmount}
        swappedFromSymbol={swappedFromSymbol}
        swappedToAmount={swappedToAmount}
        swappedToSymbol={swappedToSymbol}
        isSwapping={isSwapping}
      />
      <ReceiveSheet
        open={isReceiveSheetOpen}
        onOpenChange={handleReceiveSheetChange}
        walletAddress={walletAddress ?? undefined}
      />
      <TransactionDetailsSheet
        open={isTransactionDetailsSheetOpen}
        onOpenChange={handleTransactionDetailsSheetChange}
        transaction={selectedTransaction}
        showSuccess={showClaimSuccess}
        showError={claimError}
        solPriceUsd={solPriceUsd}
        tokenHoldings={tokenHoldings}
        onShare={
          selectedTransaction?.transferType === "deposit_for_username"
            ? handleShareDepositTransaction
            : undefined
        }
        onCancelDeposit={handleCancelDeposit}
        swapFromSymbol={selectedTransaction?.swapFromSymbol}
        swapToSymbol={selectedTransaction?.swapToSymbol}
        swapToAmount={selectedTransaction?.swapToAmount}
        swapToAmountUsd={selectedTransaction?.swapToAmountUsd}
        secureTokenSymbol={selectedTransaction?.secureTokenSymbol}
        secureTokenIcon={selectedTransaction?.secureTokenIcon}
        secureAmount={selectedTransaction?.secureAmount}
        secureAmountUsd={selectedTransaction?.secureAmountUsd}
      />
      <ActivitySheet
        open={isActivitySheetOpen}
        onOpenChange={handleActivitySheetChange}
        walletTransactions={walletTransactions}
        incomingTransactions={incomingTransactions}
        onTransactionClick={handleOpenWalletTransactionDetails}
        tokenHoldings={tokenHoldings}
        isLoading={
          (isFetchingTransactions && walletTransactions.length === 0) ||
          (isFetchingDeposits && incomingTransactions.length === 0)
        }
      />
      <TokensSheet
        open={isTokensSheetOpen}
        onOpenChange={setTokensSheetOpen}
        tokenHoldings={tokenHoldings}
      />
      <BalanceBackgroundPicker
        open={isBgPickerOpen}
        onOpenChange={setBgPickerOpen}
        selectedBg={balanceBg}
        onSelect={handleBgSelect}
      >
        {(previewBg) => {
          const mainColor = previewBg ? "white" : "#1c1c1e";
          const decimalColor = previewBg ? "white" : "rgba(60, 60, 67, 0.6)";
          const value =
            displayCurrency === "USD" ? usdBalanceNumeric : solBalanceNumeric;
          const decimals = displayCurrency === "USD" ? 2 : 4;
          const prefix = displayCurrency === "USD" ? "$" : "";
          const suffix = displayCurrency === "SOL" ? " SOL" : "";
          const intPart = Math.floor(value);
          const decimalDigits = Math.round(
            Math.abs(value - intPart) * Math.pow(10, decimals)
          );
          const decimalStr = String(decimalDigits).padStart(decimals, "0");
          return (
            <>
              <div className="flex items-center gap-1">
                <Copy
                  className="w-5 h-5"
                  strokeWidth={1.5}
                  style={{ color: decimalColor }}
                />
                <span
                  className="text-[17px] leading-[22px]"
                  style={{ color: decimalColor }}
                >
                  {walletAddress ? formatAddress(walletAddress) : "Loading..."}
                </span>
              </div>
              <div className="flex-1" />
              <div className="flex flex-col gap-1.5">
                <span
                  className="font-semibold inline-flex items-baseline"
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: "48px",
                    color: mainColor,
                  }}
                >
                  {prefix && <span className="text-[40px]">{prefix}</span>}
                  <span className="text-[40px]">
                    {intPart.toLocaleString("en-US")}
                  </span>
                  <span className="text-[28px]" style={{ color: decimalColor }}>
                    .{decimalStr}
                    {suffix}
                  </span>
                </span>
                <span
                  className="text-[17px] leading-[22px]"
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    color: decimalColor,
                  }}
                >
                  {displayCurrency === "USD"
                    ? `${solBalanceNumeric.toLocaleString("en-US", {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })} SOL`
                    : `$${usdBalanceNumeric.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                </span>
              </div>
            </>
          );
        }}
      </BalanceBackgroundPicker>
    </>
  );
}
