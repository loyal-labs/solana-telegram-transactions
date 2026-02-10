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
import { ArrowDown, ArrowUp, Brush, Copy, RefreshCcw } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Confetti from "react-confetti";

import { ScanIcon } from "@/components/ui/icons/ScanIcon";
import { ActionButton } from "@/components/wallet/ActionButton";
import ActivitySheet from "@/components/wallet/ActivitySheet";
import BalanceBackgroundPicker from "@/components/wallet/BalanceBackgroundPicker";
import ReceiveSheet from "@/components/wallet/ReceiveSheet";
import SendSheet, {
  addRecentRecipient,
  isValidSolanaAddress,
  isValidTelegramUsername,
} from "@/components/wallet/SendSheet";
import SwapSheet, {
  type SecureFormValues,
  type SwapFormValues,
  type SwapView,
} from "@/components/wallet/SwapSheet";
import TokensSheet from "@/components/wallet/TokensSheet";
import TransactionDetailsSheet from "@/components/wallet/TransactionDetailsSheet";
import { useSwap } from "@/hooks/useSwap";
import { useTelegramSafeArea } from "@/hooks/useTelegramSafeArea";
import {
  BALANCE_BG_KEY,
  DISPLAY_CURRENCY_KEY,
  SOL_PRICE_USD,
  TELEGRAM_BOT_ID,
  TELEGRAM_PUBLIC_KEY_PROD_UINT8ARRAY,
} from "@/lib/constants";
import { fetchInvoiceState } from "@/lib/irys/fetch-invoice-state";
import {
  refundDeposit,
  subscribeToDepositsWithUsername,
  topUpDeposit,
} from "@/lib/solana/deposits";
import {
  fetchLoyalDeposits,
  shieldTokens,
  unshieldTokens,
} from "@/lib/solana/deposits/loyal-deposits";
import { fetchDeposits } from "@/lib/solana/fetch-deposits";
import { fetchSolUsdPrice } from "@/lib/solana/fetch-sol-price";
import {
  getAccountTransactionHistory,
  listenForAccountTransactions,
} from "@/lib/solana/rpc/get-account-txn-history";
import type { WalletTransfer } from "@/lib/solana/rpc/types";
import {
  fetchTokenHoldings,
  type TokenHolding,
} from "@/lib/solana/token-holdings";
import {
  prepareCloseWsolTxn,
  prepareStoreInitDataTxn,
  sendStoreInitDataTxn,
} from "@/lib/solana/verify-and-claim-deposit";
import {
  formatAddress,
  formatBalance,
  formatSenderAddress,
  formatTransactionAmount,
  formatUsdValue,
} from "@/lib/solana/wallet/formatters";
import {
  getGaslessPublicKey,
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
  cleanInitData,
  createValidationBytesFromRawInitData,
  createValidationString,
  validateInitData,
} from "@/lib/telegram/mini-app/init-data-transform";
import { parseUsernameFromInitData } from "@/lib/telegram/mini-app/init-data-transform";
import { openInvoice } from "@/lib/telegram/mini-app/invoice";
import { openQrScanner } from "@/lib/telegram/mini-app/qr-code";
import {
  createShareMessage,
  shareSavedInlineMessage,
} from "@/lib/telegram/mini-app/share-message";
import { ensureTelegramTheme } from "@/lib/telegram/mini-app/theme";
import type { TelegramDeposit } from "@/types/deposits";
import type {
  IncomingTransaction,
  Transaction,
  TransactionDetailsData,
} from "@/types/wallet";

hashes.sha512 = sha512;

// ─── Mock data for development ─────────────────────────────────────────────
const USE_MOCK_DATA = false;
const TELEGRAM_USERNAME_PATTERN = /^[A-Za-z0-9_]{5,32}$/;

const MOCK_WALLET_ADDRESS = "UQAt7f8Kq9xZ3mNpR2vL5wYcD4bJ6hTgSoAeWnFqZir";
const MOCK_BALANCE_LAMPORTS = 1_267_476_540_000; // ~1267.47654 SOL
const MOCK_SOL_PRICE_USD = 132.05;

const MOCK_TOKEN_HOLDINGS: import("@/lib/solana/token-holdings").TokenHolding[] =
  [
    {
      mint: "usdt",
      symbol: "USDT",
      name: "Tether USD",
      balance: 1267,
      decimals: 6,
      priceUsd: 0.99,
      valueUsd: 1254.33,
      imageUrl: "/tokens/USDT.png",
    },
    {
      mint: "sol",
      symbol: "SOL",
      name: "Solana",
      balance: 1267,
      decimals: 9,
      priceUsd: 99.03,
      valueUsd: 125470.01,
      imageUrl: "/tokens/solana-sol-logo.png",
    },
    {
      mint: "bnb",
      symbol: "BNB",
      name: "BNB",
      balance: 1267,
      decimals: 8,
      priceUsd: 559.06,
      valueUsd: 708328.02,
      imageUrl: "/tokens/bnb-bnb-logo.png",
    },
    {
      mint: "usdc",
      symbol: "USDC",
      name: "USD Coin",
      balance: 1267,
      decimals: 6,
      priceUsd: 0.99,
      valueUsd: 1254.33,
      imageUrl: "/tokens/usd-coin-usdc-logo.png",
    },
    {
      mint: "wbtc",
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      balance: 1267,
      decimals: 8,
      priceUsd: 76375.83,
      valueUsd: 96764126.61,
      imageUrl: "/tokens/bitcoin-btc-logo.png",
    },
    {
      mint: "avax",
      symbol: "AVAX",
      name: "Avalanche",
      balance: 500,
      decimals: 18,
      priceUsd: 35.2,
      valueUsd: 17600,
      imageUrl: "/tokens/avalanche-avax-logo.png",
    },
    {
      mint: "usdt-secured",
      symbol: "USDT",
      name: "Tether USD",
      balance: 1267,
      decimals: 6,
      priceUsd: 0.99,
      valueUsd: 2.12,
      imageUrl: "/tokens/USDT.png",
      isSecured: true,
    },
  ];

// Extended mock transaction info for activity display
type MockActivityInfo = {
  tokenSymbol: string;
  tokenIcon: string;
  displayAmount: string;
  subtitle: string;
  label: string;
};

const MOCK_ACTIVITY_INFO: Record<string, MockActivityInfo> = {
  "mock-1": {
    tokenSymbol: "SOL",
    tokenIcon: "/tokens/solana-sol-logo.png",
    displayAmount: "+0.25 SOL",
    subtitle: "USDC to SOL",
    label: "Swap",
  },
  "mock-2": {
    tokenSymbol: "USDC",
    tokenIcon: "/tokens/usd-coin-usdc-logo.png",
    displayAmount: "+200.00 USDC",
    subtitle: "from UQAt...qZir",
    label: "Received",
  },
  "mock-3": {
    tokenSymbol: "USDT",
    tokenIcon: "/tokens/USDT.png",
    displayAmount: "−0.5 USDT",
    subtitle: "to UQAt...qZir",
    label: "Sent",
  },
  "mock-4": {
    tokenSymbol: "SOL",
    tokenIcon: "/tokens/solana-sol-logo.png",
    displayAmount: "−0.25 SOL",
    subtitle: "by UQAt...qZir",
    label: "To be claimed",
  },
  "mock-5": {
    tokenSymbol: "BNB",
    tokenIcon: "/tokens/bnb-bnb-logo.png",
    displayAmount: "−0.5 BNB",
    subtitle: "to UQAt...qZir",
    label: "Sent",
  },
  "mock-6": {
    tokenSymbol: "USDC",
    tokenIcon: "/tokens/usd-coin-usdc-logo.png",
    displayAmount: "+200.00 USDC",
    subtitle: "from UQAt...qZir",
    label: "Received",
  },
};

const MOCK_WALLET_TRANSACTIONS: Transaction[] = [
  {
    id: "mock-1",
    type: "incoming",
    transferType: "swap",
    amountLamports: 250_000_000,
    sender: undefined,
    recipient: undefined,
    timestamp: Date.now() - 86400000 * 2,
    status: "completed",
    signature: "mock-sig-1",
    swapFromSymbol: "USDC",
    swapToSymbol: "SOL",
    swapToAmount: 0.25,
    swapToAmountUsd: 25.0,
  },
  {
    id: "mock-2",
    type: "incoming",
    transferType: "transfer",
    amountLamports: 500_000_000,
    sender: "UQAt...qZir",
    recipient: undefined,
    timestamp: Date.now() - 3600000,
    status: "completed",
    signature: "mock-sig-2",
  },
  {
    id: "mock-3",
    type: "outgoing",
    transferType: "transfer",
    amountLamports: 500_000_000,
    sender: undefined,
    recipient: "UQAt...qZir",
    timestamp: Date.now() - 86400000,
    status: "completed",
    signature: "mock-sig-3",
  },
  {
    id: "mock-4",
    type: "pending",
    transferType: "deposit_for_username",
    amountLamports: 250_000_000,
    sender: undefined,
    recipient: "UQAt...qZir",
    timestamp: Date.now() - 86400000 * 2,
    status: "pending",
    signature: "mock-sig-4",
  },
  {
    id: "mock-5",
    type: "outgoing",
    transferType: "transfer",
    amountLamports: 500_000_000,
    sender: undefined,
    recipient: "UQAt...qZir",
    timestamp: Date.now() - 86400000,
    status: "completed",
    signature: "mock-sig-5",
  },
  {
    id: "mock-6",
    type: "incoming",
    transferType: "transfer",
    amountLamports: 500_000_000,
    sender: "UQAt...qZir",
    recipient: undefined,
    timestamp: Date.now() - 3600000,
    status: "completed",
    signature: "mock-sig-6",
  },
  {
    id: "mock-7",
    type: "outgoing",
    transferType: "secure",
    amountLamports: 0,
    sender: undefined,
    recipient: undefined,
    timestamp: Date.now() - 7200000,
    status: "completed",
    signature: "mock-sig-7",
    secureTokenSymbol: "USDC",
    secureTokenIcon: "/tokens/usd-coin-usdc-logo.png",
    secureAmount: 15.0001,
    secureAmountUsd: 2869.77,
  },
  {
    id: "mock-8",
    type: "outgoing",
    transferType: "unshield",
    amountLamports: 0,
    sender: undefined,
    recipient: undefined,
    timestamp: Date.now() - 10800000,
    status: "completed",
    signature: "mock-sig-8",
    secureTokenSymbol: "USDT",
    secureTokenIcon: "/tokens/USDT.png",
    secureAmount: 15000.01,
    secureAmountUsd: 15000.01,
  },
];
// ─── End mock data ─────────────────────────────────────────────────────────

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

const mapDepositToIncomingTransaction = (
  deposit: TelegramDeposit
): IncomingTransaction => {
  const depositId =
    typeof deposit.address?.toBase58 === "function"
      ? deposit.address.toBase58()
      : `${deposit.username}-native`;

  return {
    id: depositId,
    amountLamports: deposit.amount,
    sender: "Unknown sender",
    username: deposit.username,
  };
};

// Track wallet address at module level for cache lookups on remount
let cachedWalletAddress: string | null = null;

// Display currency preference cache
let cachedDisplayCurrency: "USD" | "SOL" | null = null;

// Balance background preference cache
let cachedBalanceBg: string | null | undefined = undefined; // undefined = not loaded yet

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
  const [walletAddress, setWalletAddress] = useState<string | null>(() =>
    USE_MOCK_DATA ? MOCK_WALLET_ADDRESS : cachedWalletAddress
  );
  const [balance, setBalance] = useState<number | null>(() =>
    USE_MOCK_DATA
      ? MOCK_BALANCE_LAMPORTS
      : cachedWalletAddress
      ? getCachedWalletBalance(cachedWalletAddress)
      : null
  );
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>(() =>
    USE_MOCK_DATA ? MOCK_TOKEN_HOLDINGS : []
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
  const [isLoading, setIsLoading] = useState(() =>
    USE_MOCK_DATA ? false : !hasCachedWalletData()
  );
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
  const [walletTransactions, setWalletTransactions] = useState<Transaction[]>(
    () =>
      USE_MOCK_DATA
        ? MOCK_WALLET_TRANSACTIONS
        : cachedWalletAddress
        ? walletTransactionsCache.get(cachedWalletAddress) ?? []
        : []
  );
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);
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
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "SOL">(
    () => cachedDisplayCurrency ?? "USD"
  );
  const [balanceBg, setBalanceBg] = useState<string | null>(() =>
    cachedBalanceBg !== undefined ? cachedBalanceBg : null
  );
  const [bgLoaded, setBgLoaded] = useState(() => cachedBalanceBg !== undefined);
  const [isBgPickerOpen, setBgPickerOpen] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [isMobilePlatform, setIsMobilePlatform] = useState(false);
  const [solPriceUsd, setSolPriceUsd] = useState<number | null>(() =>
    USE_MOCK_DATA ? MOCK_SOL_PRICE_USD : getCachedSolPrice()
  );
  const [isSolPriceLoading, setIsSolPriceLoading] = useState(() =>
    USE_MOCK_DATA ? false : getCachedSolPrice() === null
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const mainButtonAvailable = useSignal(mainButton.setParams.isAvailable);
  const secondaryButtonAvailable = useSignal(
    secondaryButton.setParams.isAvailable
  );
  const ensuredWalletRef = useRef(false);
  const claimInFlightRef = useRef(false);
  const attemptedAutoClaimIdsRef = useRef<Set<string>>(new Set());

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
        // Refresh balance after successful swap
        void refreshWalletBalance(true);
      } else {
        setSwapError(result.error || "Swap failed");
        setSwapView("result");
      }
    } catch (error) {
      console.error("[swap] Error:", error);
      setSwapError(error instanceof Error ? error.message : "Swap failed");
      setSwapView("result");
    } finally {
      setIsSwapping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapFormValues, isSwapFormValid, isSwapping, executeSwap]);

  const handleSubmitSecure = useCallback(async () => {
    if (!secureFormValues || !isSwapFormValid || isSwapping) return;

    setIsSwapping(true);
    hapticFeedback.impactOccurred("medium");

    try {
      const tokenMint = new PublicKey(secureFormValues.mint);
      const rawAmount = Math.floor(
        secureFormValues.amount * Math.pow(10, secureFormValues.decimals)
      );

      if (secureDirection === "shield") {
        await shieldTokens({ tokenMint, amount: rawAmount });
      } else {
        await unshieldTokens({ tokenMint, amount: rawAmount });
      }

      setSwappedToAmount(secureFormValues.amount);
      setSwappedToSymbol(secureFormValues.symbol);
      setSwapError(null);
      setSwapView("result");
      void refreshWalletBalance(true);
    } catch (error) {
      console.error("[secure] Error:", error);
      setSwapError(error instanceof Error ? error.message : "Operation failed");
      setSwapView("result");
    } finally {
      setIsSwapping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secureFormValues, secureDirection, isSwapFormValid, isSwapping]);

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
            mapDepositToIncomingTransaction
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
        const topUpResult = await topUpDeposit(provider, username, lamports);
        signature = topUpResult.signature;
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
    } catch (error) {
      console.error("Failed to send transaction", error);
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("error");
      }

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

  const handleBgSelect = useCallback((bg: string | null) => {
    setBalanceBg(bg);
    cachedBalanceBg = bg;
    void setCloudValue(BALANCE_BG_KEY, bg ?? "none");
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
        await refundDeposit(provider, username, amount);

        if (hapticFeedback.notificationOccurred.isAvailable()) {
          hapticFeedback.notificationOccurred("success");
        }

        // Close the modal and refresh data
        setTransactionDetailsSheetOpen(false);
        setSelectedTransaction(null);

        // Refresh balance and transactions
        void getWalletBalance(true).then(setBalance);
      } catch (error) {
        console.error("Failed to refund deposit:", error);
        if (hapticFeedback.notificationOccurred.isAvailable()) {
          hapticFeedback.notificationOccurred("error");
        }
        throw error; // Re-throw so the sheet can handle it
      }
    },
    []
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
          console.warn("Clipboard copy failed", copyError, address);
        }
      }

      if (sendString(address)) {
      }
    } catch (error) {
      console.error("Failed to share wallet address", error);
    }
  }, [walletAddress]);

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

  const handleApproveTransaction = useCallback(
    async (transactionId: string) => {
      if (claimInFlightRef.current) {
        return;
      }

      if (!rawInitData) {
        setClaimError(
          "Cannot verify init data: missing Telegram session data."
        );
        return;
      }

      const transaction = incomingTransactions.find(
        (tx) => tx.id === transactionId
      );
      if (!transaction) {
        console.warn("Transaction not found for approval:", transactionId);
        return;
      }

      claimInFlightRef.current = true;
      setClaimError(null);

      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("medium");
      }
      setIsClaimingTransaction(true);
      try {
        const provider = await getWalletProvider();
        const keypair = await getWalletKeypair();
        const wallet = new SimpleWallet(keypair);
        const recipientPublicKey = provider.publicKey;
        const gaslessPublicKey = await getGaslessPublicKey();

        const { validationBytes, signatureBytes } =
          createValidationBytesFromRawInitData(rawInitData);
        const parsedInitData = cleanInitData(rawInitData);
        const initDataUsername = parseUsernameFromInitData(parsedInitData);

        if (
          !initDataUsername ||
          !TELEGRAM_USERNAME_PATTERN.test(initDataUsername)
        ) {
          throw new Error("Invalid Telegram username in init data.");
        }

        const username = transaction.username;
        if (!TELEGRAM_USERNAME_PATTERN.test(username)) {
          throw new Error("Invalid username on deposit.");
        }
        if (initDataUsername !== username) {
          throw new Error(
            "Telegram account username does not match the deposit username."
          );
        }
        const amountLamports = transaction.amountLamports;

        const storeTx = await prepareStoreInitDataTxn(
          provider,
          gaslessPublicKey,
          validationBytes,
          wallet
        );

        const closeTx = await prepareCloseWsolTxn(
          provider,
          gaslessPublicKey,
          wallet
        );

        const claimResponse = await sendStoreInitDataTxn(
          storeTx,
          recipientPublicKey,
          username,
          amountLamports,
          validationBytes,
          signatureBytes,
          TELEGRAM_PUBLIC_KEY_PROD_UINT8ARRAY,
          closeTx ?? undefined
        );

        const claimed = Boolean(
          typeof claimResponse === "object" && claimResponse !== null
            ? (claimResponse as { success?: boolean }).success
            : claimResponse
        );
        if (!claimed) {
          throw new Error("Failed to claim deposit");
        }

        setIncomingTransactions((prev) =>
          prev.filter((tx) => tx.id !== transactionId)
        );

        await refreshWalletBalance(true);
        void loadWalletTransactions({ force: true });

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
        claimInFlightRef.current = false;
        setIsClaimingTransaction(false);
      }
    },
    [
      incomingTransactions,
      rawInitData,
      refreshWalletBalance,
      loadWalletTransactions,
    ]
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
      if (!isValid) {
        console.warn("Telegram init data signature validation failed");
      }
    }
  }, [rawInitData]);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
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
        const deposits = await fetchDeposits(provider, username);
        if (isCancelled) {
          return;
        }

        const mappedTransactions = deposits.map(
          mapDepositToIncomingTransaction
        );

        setCachedIncomingTransactions(username, mappedTransactions);
        setIncomingTransactions(mappedTransactions);

        unsubscribe = await subscribeToDepositsWithUsername(
          provider,
          username,
          (deposit) => {
            if (isCancelled) {
              return;
            }
            const mapped = mapDepositToIncomingTransaction(deposit);
            setIncomingTransactions((prev) => {
              if (deposit.amount <= 0) {
                const next = prev.filter((tx) => tx.id !== mapped.id);
                setCachedIncomingTransactions(username, next);
                return next;
              }

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

    // Keep only tx ids that still exist to avoid unbounded growth.
    const currentIds = new Set(incomingTransactions.map((tx) => tx.id));
    attemptedAutoClaimIdsRef.current.forEach((attemptedId) => {
      if (!currentIds.has(attemptedId)) {
        attemptedAutoClaimIdsRef.current.delete(attemptedId);
      }
    });

    // Auto-claim each transaction id at most once to prevent retry loops.
    const nextAutoClaim = incomingTransactions.find(
      (tx) => !attemptedAutoClaimIdsRef.current.has(tx.id)
    );
    if (nextAutoClaim) {
      attemptedAutoClaimIdsRef.current.add(nextAutoClaim.id);
      void handleApproveTransaction(nextAutoClaim.id);
    }
  }, [incomingTransactions, isClaimingTransaction, handleApproveTransaction]);

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

  // Load balance background preference from cloud storage
  useEffect(() => {
    if (cachedBalanceBg !== undefined) return; // Already loaded from cache

    void (async () => {
      try {
        const stored = await getCloudValue(BALANCE_BG_KEY);
        if (typeof stored === "string" && stored.length > 0) {
          const bg = stored === "none" ? null : stored;
          cachedBalanceBg = bg;
          setBalanceBg(bg);
        } else {
          cachedBalanceBg = "balance-bg-01";
          setBalanceBg("balance-bg-01");
        }
      } catch (error) {
        console.error("Failed to load balance background preference", error);
        cachedBalanceBg = "balance-bg-01";
        setBalanceBg("balance-bg-01");
      } finally {
        setBgLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
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
    if (USE_MOCK_DATA) return;
    if (!walletAddress) return;
    void loadWalletTransactions();
  }, [walletAddress, loadWalletTransactions]);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
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
    if (USE_MOCK_DATA) return;
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

  // Fetch token holdings
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!walletAddress) return;

    let isMounted = true;

    const loadHoldings = async () => {
      try {
        const holdings = await fetchTokenHoldings(walletAddress);
        if (!isMounted) return;

        // Check Loyal deposits for all tokens
        const userPubkey = new PublicKey(walletAddress);
        const mints = holdings.map((h) => h.mint);
        const loyalDeposits = await fetchLoyalDeposits(userPubkey, mints);

        if (!isMounted) return;

        // Add secured entries for tokens with Loyal deposits
        const securedHoldings: TokenHolding[] = [];
        for (const [mint, amount] of loyalDeposits) {
          const original = holdings.find((h) => h.mint === mint);
          if (original) {
            securedHoldings.push({
              ...original,
              balance: amount / Math.pow(10, original.decimals),
              valueUsd: original.priceUsd
                ? (amount / Math.pow(10, original.decimals)) * original.priceUsd
                : null,
              isSecured: true,
            });
          }
        }

        setTokenHoldings([...holdings, ...securedHoldings]);
      } catch (error) {
        console.error("Failed to fetch token holdings:", error);
      }
    };

    void loadHoldings();

    return () => {
      isMounted = false;
    };
  }, [walletAddress]);

  // Refresh token holdings when balance changes (transaction completed)
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!walletAddress || balance === null) return;

    // Debounce the refresh to avoid rapid refetches
    const timer = setTimeout(() => {
      void fetchTokenHoldings(walletAddress, true)
        .then(async (holdings) => {
          const userPubkey = new PublicKey(walletAddress);
          const mints = holdings.map((h) => h.mint);
          const loyalDeposits = await fetchLoyalDeposits(userPubkey, mints);

          const securedHoldings: TokenHolding[] = [];
          for (const [mint, amount] of loyalDeposits) {
            const original = holdings.find((h) => h.mint === mint);
            if (original) {
              securedHoldings.push({
                ...original,
                balance: Number(amount) / Math.pow(10, original.decimals),
                valueUsd: original.priceUsd
                  ? (Number(amount) / Math.pow(10, original.decimals)) * original.priceUsd
                  : null,
                isSecured: true,
              });
            }
          }

          setTokenHoldings([...holdings, ...securedHoldings]);
        })
        .catch(console.error);
    }, 2000);

    return () => clearTimeout(timer);
  }, [balance, walletAddress]);

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

  // Track window size for confetti
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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
        rootMargin: `-${
          Math.max(safeAreaInsetTop || 0, 12) + 15
        }px 0px 0px 0px`,
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
        {/* Sticky Balance Pill — crossfades with logo in header */}
        <AnimatePresence>
          {showStickyBalance && !isLoading && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
              onClick={handleScrollToTop}
              className="fixed left-1/2 -translate-x-1/2 z-[51] flex items-center px-4 py-1.5 rounded-[54px] active:opacity-80 transition-opacity"
              style={{
                top: `${Math.max(safeAreaInsetTop || 0, 12) + 4}px`,
                background: "#fff",
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
            </motion.button>
          )}
        </AnimatePresence>

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
                          navigator.clipboard
                            .writeText(walletAddress)
                            .catch((copyError) => {
                              console.warn(
                                "Clipboard copy failed",
                                copyError,
                                walletAddress
                              );
                            });
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
                        cachedDisplayCurrency = newCurrency;
                        void setCloudValue(DISPLAY_CURRENCY_KEY, newCurrency);
                        return newCurrency;
                      });
                    }}
                    className="active:scale-[0.98] transition-transform self-start"
                  >
                    {(() => {
                      const value =
                        displayCurrency === "USD"
                          ? usdBalanceNumeric
                          : solBalanceNumeric;
                      const decimals = displayCurrency === "USD" ? 2 : 5;
                      const intPart = Math.trunc(value);
                      const decimalDigits = Math.round(
                        Math.abs(value - intPart) * Math.pow(10, decimals)
                      );
                      const prefix = displayCurrency === "USD" ? "$" : "";
                      const suffix = displayCurrency === "SOL" ? " SOL" : "";
                      const mainColor = balanceBg ? "white" : "#1c1c1e";
                      const decimalColor = balanceBg
                        ? "white"
                        : "rgba(60, 60, 67, 0.6)";
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
              disabled={balance === null || balance === 0}
            />
            <ActionButton
              icon={<ArrowDown />}
              label="Receive"
              onClick={handleOpenReceiveSheet}
            />
            <ActionButton
              icon={<RefreshCcw />}
              label="Swap"
              onClick={() => {
                hapticFeedback.impactOccurred("light");
                setSwapSheetOpen(true);
              }}
            />
            <ActionButton
              icon={<ScanIcon />}
              label={isMobilePlatform ? "Scan" : "Mobile only"}
              onClick={handleScanQR}
              disabled={!isMobilePlatform}
            />
          </div>

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
                    const displaySymbol =
                      token.symbol === "SOL" &&
                      token.name.toLowerCase().includes("wrapped")
                        ? "wSOL"
                        : token.symbol;
                    return (
                      <div
                        key={`${token.mint} (${token.name})`}
                        className="flex items-center w-full overflow-hidden rounded-[20px] px-4 py-1"
                        style={{ border: "2px solid #f2f2f7" }}
                      >
                        {/* Token icon */}
                        <div className="py-1.5 pr-3">
                          <div className="w-12 h-12 relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden relative bg-[#f2f2f7]">
                              {token.imageUrl && (
                                <Image
                                  src={token.imageUrl}
                                  alt={displaySymbol}
                                  fill
                                  className="object-cover"
                                />
                              )}
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
                            {displaySymbol}
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
                        const isDepositForUsername =
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
                                  <div className="w-12 h-12 rounded-full overflow-hidden relative bg-[#f2f2f7]">
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
                                  {isSecureTransaction && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-[20px] h-[20px]">
                                      <Image
                                        src="/Shield.svg"
                                        alt="Shield"
                                        width={20}
                                        height={20}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Middle - Text */}
                              <div className="flex-1 py-2.5 flex flex-col gap-0.5">
                                <p className="text-base text-black leading-5">
                                  {isSecureTransaction ? "Secure" : "Unshield"}
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
        balance={balance}
        walletAddress={walletAddress ?? undefined}
        starsBalance={starsBalance}
        onTopUpStars={handleTopUpStars}
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
        onTabChange={setSwapActiveTab}
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
