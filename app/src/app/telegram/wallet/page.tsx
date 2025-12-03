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
  viewport
} from "@telegram-apps/sdk-react";
import { ArrowDown, ArrowUp, ChevronRight, Clock, Copy } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ScanIcon } from "@/components/ui/icons/ScanIcon";
import { ActionButton } from "@/components/wallet/ActionButton";
import ActivitySheet from "@/components/wallet/ActivitySheet";
import ReceiveSheet from "@/components/wallet/ReceiveSheet";
import SendSheet, {
  addRecentRecipient,
  isValidSolanaAddress,
  isValidTelegramUsername
} from "@/components/wallet/SendSheet";
import TransactionDetailsSheet from "@/components/wallet/TransactionDetailsSheet";
import { useTelegramSafeArea } from "@/hooks/useTelegramSafeArea";
import {
  SOL_PRICE_USD,
  TELEGRAM_BOT_ID,
  TELEGRAM_PUBLIC_KEY_PROD_UINT8ARRAY
} from "@/lib/constants";
import { fetchInvoiceState } from "@/lib/irys/fetch-invoice-state";
import { topUpDeposit } from "@/lib/solana/deposits";
import { fetchDeposits } from "@/lib/solana/fetch-deposits";
import { fetchSolUsdPrice } from "@/lib/solana/fetch-sol-price";
import { getAccountTransactionHistory } from "@/lib/solana/rpc/get-account-txn-history";
import { getTelegramTransferProgram } from "@/lib/solana/solana-helpers";
import { verifyAndClaimDeposit } from "@/lib/solana/verify-and-claim-deposit";
import {
  formatAddress,
  formatBalance,
  formatSenderAddress,
  formatTransactionAmount,
  formatUsdValue
} from "@/lib/solana/wallet/formatters";
import {
  getWalletBalance,
  getWalletKeypair,
  getWalletProvider,
  getWalletPublicKey,
  sendSolTransaction,
  subscribeToWalletBalance} from "@/lib/solana/wallet/wallet-details";
import { SimpleWallet } from "@/lib/solana/wallet/wallet-implementation";
import { ensureWalletKeypair } from "@/lib/solana/wallet/wallet-keypair-logic";
import { initTelegram, sendString } from "@/lib/telegram/mini-app";
import {
  hideMainButton,
  hideSecondaryButton,
  showMainButton,
  showReceiveShareButton
} from "@/lib/telegram/mini-app/buttons";
import {
  cleanInitData,
  createValidationBytesFromRawInitData,
  createValidationString,
  validateInitData
} from "@/lib/telegram/mini-app/init-data-transform";
import { parseUsernameFromInitData } from "@/lib/telegram/mini-app/init-data-transform";
import { openInvoice } from "@/lib/telegram/mini-app/invoice";
import { openQrScanner } from "@/lib/telegram/mini-app/qr-code";
import { ensureTelegramTheme } from "@/lib/telegram/mini-app/theme";
import type {
  IncomingTransaction,
  Transaction,
  TransactionDetailsData,
  TransactionType
} from "@/types/wallet";

hashes.sha512 = sha512;

export default function Home() {
  const rawInitData = useRawInitData();
  const { bottom: _safeBottom } = useTelegramSafeArea();
  const [isSendSheetOpen, setSendSheetOpen] = useState(false);
  const [sendStep, setSendStep] = useState<1 | 2 | 3 | 4>(1);
  const [sentAmountSol, setSentAmountSol] = useState<number | undefined>(undefined);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isReceiveSheetOpen, setReceiveSheetOpen] = useState(false);
  const [isActivitySheetOpen, setActivitySheetOpen] = useState(false);
  const [
    isTransactionDetailsSheetOpen,
    setTransactionDetailsSheetOpen
  ] = useState(false);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [starsBalance, setStarsBalance] = useState<number>(0);
  const [isStarsLoading, setIsStarsLoading] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [incomingTransactions, setIncomingTransactions] = useState<
    IncomingTransaction[]
  >([]);
  const [walletTransactions, setWalletTransactions] = useState<Transaction[]>(
    []
  );
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);
  const [
    selectedTransaction,
    setSelectedTransaction
  ] = useState<TransactionDetailsData | null>(null);
  // Keep original incoming transaction for claim functionality
  const [
    selectedIncomingTransaction,
    setSelectedIncomingTransaction
  ] = useState<IncomingTransaction | null>(null);
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
    recipient: ""
  });
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "SOL">("USD");
  const [addressCopied, setAddressCopied] = useState(false);
  const [isMobilePlatform, setIsMobilePlatform] = useState(false);
  const [solPriceUsd, setSolPriceUsd] = useState<number | null>(null);
  const [isSolPriceLoading, setIsSolPriceLoading] = useState(true);

  const mainButtonAvailable = useSignal(mainButton.setParams.isAvailable);
  const secondaryButtonAvailable = useSignal(
    secondaryButton.setParams.isAvailable
  );
  const ensuredWalletRef = useRef(false);

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
        body: new TextEncoder().encode(rawInitData)
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
      // Convert to TransactionDetailsData format
      const detailsData: TransactionDetailsData = {
        id: transaction.id,
        type: "incoming",
        amountLamports: transaction.amountLamports,
        sender: transaction.sender,
        senderUsername: transaction.username ? `@${transaction.username}` : undefined,
        status: "pending", // Incoming claimable transactions are pending
        timestamp: Date.now(), // TODO: Get actual timestamp from transaction
      };
      setSelectedTransaction(detailsData);
      setTransactionDetailsSheetOpen(true);
    },
    []
  );

  const handleOpenWalletTransactionDetails = useCallback(
    (transaction: Transaction) => {
      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("light");
      }
      // Clear incoming transaction ref
      setSelectedIncomingTransaction(null);
      // Convert to TransactionDetailsData format
      const detailsData: TransactionDetailsData = {
        id: transaction.id,
        type: transaction.type === "incoming" ? "incoming" : "outgoing",
        amountLamports: transaction.amountLamports,
        recipient: transaction.recipient,
        recipientUsername: transaction.recipient?.startsWith("@") ? transaction.recipient : undefined,
        sender: transaction.sender,
        senderUsername: transaction.sender?.startsWith("@") ? transaction.sender : undefined,
        status:
          transaction.status ??
          (transaction.type === "pending" ? "pending" : "completed"),
        timestamp: transaction.timestamp,
        networkFeeLamports: transaction.networkFeeLamports,
        signature: transaction.signature
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

  const refreshWalletBalance = useCallback(async () => {
    try {
      const balanceLamports = await getWalletBalance();
      setBalance(balanceLamports);
    } catch (error) {
      console.error("Failed to refresh wallet balance", error);
    }
  }, []);

  const loadWalletTransactions = useCallback(async () => {
    if (!walletAddress) return;

    setIsFetchingTransactions(true);
    try {
      const { transfers } = await getAccountTransactionHistory(
        new PublicKey(walletAddress),
        {
          limit: 10,
          onlySystemTransfers: false
        }
      );

      const mappedTransactions: Transaction[] = transfers.map(transfer => {
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
          status: transfer.status === "failed" ? "error" : "completed"
        };
      });

      setWalletTransactions(prev => {
        const pending = prev.filter(
          tx => tx.type === "pending" && !tx.signature
        );
        const existingBySignature = new Map(
          prev
            .filter(tx => tx.signature)
            .map(tx => [tx.signature as string, tx])
        );

        const merged = mappedTransactions.map(tx => {
          if (!tx.signature) return tx;
          const existing = existingBySignature.get(tx.signature);
          return existing ? { ...existing, ...tx } : tx;
        });

        const combined = [...pending, ...merged];
        return combined.sort((a, b) => b.timestamp - a.timestamp);
      });

    } catch (error) {
      console.error("Failed to fetch wallet transactions", error);
    } finally {
      setIsFetchingTransactions(false);
    }
  }, [walletAddress]);

  const _handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }

    setIsRefreshing(true);
    try {
      // Refresh wallet balance
      await refreshWalletBalance();

      try {
        const latestPrice = await fetchSolUsdPrice();
        setSolPriceUsd(latestPrice);
      } catch (priceError) {
        console.error("Failed to refresh SOL price", priceError);
      }

      try {
        await loadWalletTransactions();
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
            deposit => {
              const senderBase58 =
                typeof (deposit.user as { toBase58?: () => string })
                  .toBase58 === "function"
                  ? deposit.user.toBase58()
                  : String(deposit.user);

              return {
                id: `${senderBase58}-${deposit.lastNonce}`,
                amountLamports: deposit.amount,
                sender: senderBase58,
                username: username
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
    console.log("Trimmed recipient:", trimmedRecipient);
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
      console.log("Sending transaction to:", trimmedRecipient);

      let signature: string | null = null;

      if (isValidSolanaAddress(trimmedRecipient)) {
        console.log("Sending transaction to Solana address:");
        signature = await sendSolTransaction(trimmedRecipient, lamports);
      } else if (isValidTelegramUsername(trimmedRecipient)) {
        console.log(
          "Sending transaction to Telegram username:",
          trimmedRecipient
        );
        const username = trimmedRecipient.replace(/^@/, "");
        const provider = await getWalletProvider();
        const transferProgram = getTelegramTransferProgram(provider);
        await topUpDeposit(provider, transferProgram, username, lamports);
      } else {
        throw new Error("Invalid recipient");
      }

      await refreshWalletBalance();
      if (signature) {
        void loadWalletTransactions();
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
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
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
    refreshWalletBalance
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
        (await getWalletPublicKey().then(publicKey => {
          const base58 = publicKey.toBase58();
          setWalletAddress(prev => prev ?? base58);
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
            text: address
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
          console.log("Copied wallet address to clipboard");
          return;
        } catch (copyError) {
          console.warn("Clipboard copy failed", copyError);
        }
      }

      if (sendString(address)) {
        console.log("Shared wallet address via Telegram bridge");
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
        tx => tx.id === transactionId
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

        const {
          validationBytes,
          signatureBytes
        } = createValidationBytesFromRawInitData(rawInitData);
        const senderPublicKey = new PublicKey(transaction.sender);

        const username = transaction.username;
        const amountLamports = transaction.amountLamports;
        console.log(
          "username:",
          username,
          " to:",
          recipientPublicKey.toBase58()
        );

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

        setIncomingTransactions(prev =>
          prev.filter(tx => tx.id !== transactionId)
        );

        await refreshWalletBalance();

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
        const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
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
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    const loadPrice = async () => {
      while (retryCount < MAX_RETRIES && isMounted) {
        try {
          const price = await fetchSolUsdPrice();
          if (!isMounted) return;
          setSolPriceUsd(price);
          setIsSolPriceLoading(false);
          return; // Success, exit
        } catch (error) {
          retryCount++;
          console.error(`Failed to fetch SOL price (attempt ${retryCount}/${MAX_RETRIES})`, error);
          if (retryCount < MAX_RETRIES && isMounted) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
      // All retries failed, use fallback price
      if (isMounted) {
        console.warn("Using fallback SOL price after all retries failed");
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

        const provider = await getWalletProvider();
        console.log("Fetching deposits for username:", username);
        const deposits = await fetchDeposits(provider, username);
        console.log("Deposits fetched:", deposits.length, deposits);
        if (isCancelled) {
          return;
        }

        const mappedTransactions: IncomingTransaction[] = deposits.map(
          deposit => {
            const senderBase58 =
              typeof (deposit.user as { toBase58?: () => string }).toBase58 ===
              "function"
                ? deposit.user.toBase58()
                : String(deposit.user);

            return {
              id: `${senderBase58}-${deposit.lastNonce}`,
              amountLamports: deposit.amount,
              sender: senderBase58,
              username: deposit.username
            };
          }
        );

        console.log(
          "Setting incoming transactions:",
          mappedTransactions.length,
          mappedTransactions
        );
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
        console.log("Closing behavior mounted");
      }

      if (closingBehavior.enableConfirmation.isAvailable()) {
        closingBehavior.enableConfirmation();
        const isEnabled = closingBehavior.isConfirmationEnabled();
        console.log("Closing confirmation enabled:", isEnabled);
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
    console.log("Platform detected:", platform, "isMobile:", isMobile);

    if (isMobile) {
      if (viewport.requestFullscreen.isAvailable()) {
        void viewport.requestFullscreen().catch(error => {
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

  useEffect(() => {
    if (ensuredWalletRef.current) return;
    ensuredWalletRef.current = true;

    void (async () => {
      try {
        const { keypair, isNew } = await ensureWalletKeypair();
        const publicKeyBase58 = keypair.publicKey.toBase58();
        console.log("Wallet keypair ready", {
          isNew,
          publicKey: publicKeyBase58
        });
        setWalletAddress(publicKeyBase58);

        const balanceLamports = await getWalletBalance();
        setBalance(balanceLamports);
        setIsLoading(false);
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

    const loadStarsBalance = async () => {
      setIsStarsLoading(true);
      try {
        const invoice = await fetchInvoiceState(walletAddress);
        if (isCancelled) return;
        const remaining = Number.isFinite(invoice.remainingStars)
          ? Number(invoice.remainingStars)
          : 0;
        setStarsBalance(remaining);
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to fetch Stars balance", error);
          setStarsBalance(0);
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
    let unsubscribe: (() => Promise<void>) | null = null;

    void (async () => {
      try {
        unsubscribe = await subscribeToWalletBalance(lamports => {
          if (isCancelled) return;
          setBalance(prev => (prev === lamports ? prev : lamports));
        });
      } catch (error) {
        console.error("Failed to subscribe to wallet balance", error);
      }
    })();

    return () => {
      isCancelled = true;
      if (unsubscribe) {
        void unsubscribe();
      }
    };
  }, [walletAddress]);

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
          showLoader: false
        });
      } else if (selectedIncomingTransaction) {
        // Only show Claim button for incoming (claimable) transactions
        if (isClaimingTransaction) {
          // Show only main button with loader during claim
          showMainButton({
            text: "Claim",
            onClick: () => {}, // No-op during loading
            isEnabled: false,
            showLoader: true
          });
        } else {
          // Show only Claim button (no Ignore)
          showMainButton({
            text: "Claim",
            onClick: () => handleApproveTransaction(selectedIncomingTransaction.id)
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
          showLoader: false
        });
      } else if (sendStep === 2) {
        showMainButton({
          text: "Review",
          onClick: () => {
            if (isSendFormValid) setSendStep(3);
          },
          isEnabled: isSendFormValid,
          showLoader: false
        });
      } else if (sendStep === 3) {
        showMainButton({
          text: "Confirm and Send",
          onClick: handleSubmitSend,
          isEnabled: isSendFormValid && !isSendingTransaction,
          showLoader: isSendingTransaction
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
            showLoader: false
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
                  recipientUsername: trimmedRecipient.startsWith("@") ? trimmedRecipient : undefined,
                  status: "completed",
                  timestamp: Date.now(),
                };
                setSelectedTransaction(detailsData);
                setSelectedIncomingTransaction(null);
                setTransactionDetailsSheetOpen(true);
              }
            },
            isEnabled: true,
            showLoader: false
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
    sendError
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

  return (
    <>
      <main
        className="min-h-screen text-white font-sans overflow-hidden relative flex flex-col"
        style={{ background: "#16161a" }}
      >

        {/* Main Content */}
        <div
          className="relative flex-1 flex flex-col w-full"
          style={{ paddingTop: "calc(var(--app-safe-top, 20px) + 16px)" }}
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
            <div className="flex flex-col items-center gap-1.5 mt-1.5">
              <button
                onClick={() => {
                  if (hapticFeedback.selectionChanged.isAvailable()) {
                    hapticFeedback.selectionChanged();
                  }
                  setDisplayCurrency(prev => (prev === "USD" ? "SOL" : "USD"));
                }}
                className="active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center leading-[48px] gap-2">
                  <NumberFlow
                    value={displayCurrency === "USD" ? usdBalanceNumeric : solBalanceNumeric}
                    format={{
                      minimumFractionDigits: displayCurrency === "USD" ? 2 : 4,
                      maximumFractionDigits: displayCurrency === "USD" ? 2 : 4
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
                  value={displayCurrency === "USD" ? solBalanceNumeric : usdBalanceNumeric}
                  format={{
                    minimumFractionDigits: displayCurrency === "USD" ? 4 : 2,
                    maximumFractionDigits: displayCurrency === "USD" ? 4 : 2
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

          {/* Stars Card Section */}
          <div className="px-4 pb-4">
            {showStarsSkeleton ? (
              <div
                className="flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden w-full"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  mixBlendMode: "lighten"
                }}
              >
                {/* Skeleton Icon */}
                <div className="py-1.5 pr-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                </div>
                {/* Skeleton Text */}
                <div className="flex-1 py-2.5 flex flex-col gap-1.5">
                  <div className="w-12 h-5 bg-white/5 animate-pulse rounded" />
                  <div className="w-16 h-4 bg-white/5 animate-pulse rounded" />
                </div>
                {/* Skeleton Value */}
                <div className="flex flex-col items-end gap-1.5 py-2.5 pl-3">
                  <div className="w-12 h-5 bg-white/5 animate-pulse rounded" />
                  <div className="w-10 h-4 bg-white/5 animate-pulse rounded" />
                </div>
              </div>
            ) : (
              <button
                onClick={handleTopUpStars}
                disabled={isCreatingInvoice}
                className="flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  mixBlendMode: "lighten"
                }}
              >
                {/* Left - Icon */}
                <div className="py-1.5 pr-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      mixBlendMode: "lighten"
                    }}
                  >
                    <Image
                      src="/icons/telegram-stars.svg"
                      alt="Stars"
                      width={28}
                      height={28}
                      className="opacity-60"
                    />
                  </div>
                </div>

                {/* Middle - Text */}
                <div className="flex-1 py-2.5 flex flex-col gap-0.5">
                  <p className="text-base text-white leading-5">Stars</p>
                  <p className="text-[13px] text-white/60 leading-4">
                    for free gas
                  </p>
                </div>

                {/* Right - Value */}
                <div className="flex flex-col items-end gap-0.5 py-2.5 pl-3">
                  <p className="text-base text-white leading-5">{starsBalance.toLocaleString()}</p>
                  <p className="text-[13px] text-white/60 leading-4">${(starsBalance * 0.02).toFixed(2)}</p>
                </div>

                {/* Chevron */}
                <div className="pl-3 py-2 flex items-center justify-center">
                  <ChevronRight size={16} strokeWidth={1.5} className="text-white/60" />
                </div>
              </button>
            )}
          </div>

          {/* Activity Section - conditionally rendered */}
          {(() => {
            const hasNoTransactions =
              incomingTransactions.length === 0 &&
              walletTransactions.length === 0;
            const isEmptyWallet =
              (balance === null || balance === 0) &&
              starsBalance === 0 &&
              !isStarsLoading;
            const isActivityLoading =
              isLoading ||
              isStarsLoading ||
              (isFetchingTransactions && walletTransactions.length === 0);

            // Loading state - show skeleton transaction cards
            if (isActivityLoading) {
              return (
                <div className="flex-1 px-4 pb-4">
                  <div className="flex flex-col gap-2">
                    {/* Skeleton Transaction Card 1 */}
                    <div
                      className="flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden"
                      style={{
                        background: "rgba(255, 255, 255, 0.06)",
                        mixBlendMode: "lighten"
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
                        mixBlendMode: "lighten"
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
              );
            }

            // Empty wallet state - no SOL, no Stars, no transactions
            // Activity title is NOT shown in this state
            if (isEmptyWallet && hasNoTransactions) {
              return (
                <div className="flex-1 px-4 pb-4">
                  <div
                    className="flex flex-col gap-4 items-center justify-center px-8 py-6 rounded-2xl h-[200px]"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      mixBlendMode: "lighten"
                    }}
                  >
                    <p className="text-base text-white/60 leading-5 text-center">
                      You don&apos;t have SOL yet. Network fees (gas) can be
                      paid with Telegram Stars, so add a small Stars balance to
                      receive tokens.
                    </p>
                    <button
                      onClick={handleTopUpStars}
                      disabled={isCreatingInvoice}
                      className="px-4 py-2 rounded-[40px] text-sm text-white leading-5"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, rgba(50, 229, 94, 0.15) 0%, rgba(50, 229, 94, 0.15) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)"
                      }}
                    >
                      Add Stars
                    </button>
                  </div>
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
                      mixBlendMode: "lighten"
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
                    {limitedActivityItems.map(item => {
                      if (item.type === "incoming") {
                        const transaction = item.transaction;
                        const isClaiming = claimingTransactionId === transaction.id;
                        return (
                          <button
                            key={transaction.id}
                            onClick={() =>
                              !isClaiming && handleOpenTransactionDetails(transaction)
                            }
                            disabled={isClaiming}
                            className={`flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity ${
                              isClaiming ? "opacity-60" : ""
                            }`}
                            style={{
                              background: "rgba(255, 255, 255, 0.06)",
                              mixBlendMode: "lighten"
                            }}
                          >
                            {/* Left - Icon */}
                            <div className="py-1.5 pr-3">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(50, 229, 94, 0.15)" }}
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
                              <p className="text-base text-white leading-5">Received</p>
                              <p className="text-[13px] text-white/60 leading-4">
                                from {formatSenderAddress(transaction.sender)}
                              </p>
                            </div>

                            {/* Right - Claim Badge */}
                            <div className="py-2.5 pl-3">
                              <div
                                className="px-4 py-2 rounded-full text-sm text-white leading-5"
                                style={{
                                  background:
                                    "linear-gradient(90deg, rgba(50, 229, 94, 0.15) 0%, rgba(50, 229, 94, 0.15) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)"
                                }}
                              >
                                {isClaiming
                                  ? "Claiming..."
                                  : `Claim ${formatTransactionAmount(transaction.amountLamports)} SOL`}
                              </div>
                            </div>
                          </button>
                        );
                      }

                      // Wallet transaction
                      const transaction = item.transaction;
                      const isIncoming = transaction.type === "incoming";
                      const isPending = transaction.type === "pending";
                      const transferTypeLabel =
                        transaction.transferType === "store"
                          ? "Store data"
                          : transaction.transferType === "verify_telegram_init_data"
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

                      return (
                        <button
                          key={transaction.id}
                          onClick={() => handleOpenWalletTransactionDetails(transaction)}
                          className="flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity"
                          style={{
                            background: "rgba(255, 255, 255, 0.06)",
                            mixBlendMode: "lighten"
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
                                  isIncoming || isPending ? "normal" : "lighten"
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
                              {transferTypeLabel ??
                                (isIncoming
                                  ? "Received"
                                  : isPending
                                    ? "To be claimed"
                                    : "Sent")}
                            </p>
                            {!(isPending === false && !isIncoming && isUnknownRecipient) && (
                              <p className="text-[13px] text-white/60 leading-4">
                                {isIncoming ? "from" : isPending ? "by" : "to"}{" "}
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
                                : formatTransactionAmount(transaction.amountLamports)}{" "}
                              SOL
                            </p>
                            <p className="text-[13px] text-white/60 leading-4">
                              {timestamp.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric"
                              })}
                              ,{" "}
                              {timestamp.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
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
      />
    </>
  );
}
