"use client";

import { hashes } from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  addToHomeScreen,
  checkHomeScreenStatus,
  closingBehavior,
  hapticFeedback,
  mainButton,
  off,
  on,
  secondaryButton,
  useRawInitData,
  useSignal,
  viewport
} from "@telegram-apps/sdk-react";
import { ArrowDown, ArrowUp, Clock, Copy } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import React from "react";

import ReceiveSheet from "@/components/wallet/ReceiveSheet";
import SendSheet, {
  isValidSolanaAddress,
  isValidTelegramUsername
} from "@/components/wallet/SendSheet";
import TransactionDetailsSheet from "@/components/wallet/TransactionDetailsSheet";
import {
  TELEGRAM_BOT_ID,
  TELEGRAM_PUBLIC_KEY_PROD_UINT8ARRAY
} from "@/lib/constants";
import { topUpDeposit } from "@/lib/solana/deposits";
import { fetchDeposits } from "@/lib/solana/fetch-deposits";
import { getTelegramTransferProgram } from "@/lib/solana/solana-helpers";
import { verifyAndClaimDeposit } from "@/lib/solana/verify-and-claim-deposit";
import {
  getWalletBalance,
  getWalletKeypair,
  getWalletProvider,
  getWalletPublicKey,
  sendSolTransaction
} from "@/lib/solana/wallet/wallet-details";
import { SimpleWallet } from "@/lib/solana/wallet/wallet-implementation";
import { ensureWalletKeypair } from "@/lib/solana/wallet/wallet-keypair-logic";
import { initTelegram, sendString } from "@/lib/telegram";
import {
  hideMainButton,
  hideSecondaryButton,
  showMainButton,
  showReceiveShareButton
} from "@/lib/telegram/buttons";
import {
  cleanInitData,
  createValidationBytesFromRawInitData,
  createValidationString,
  validateInitData
} from "@/lib/telegram/init-data-transform";
import { parseUsernameFromInitData } from "@/lib/telegram/init-data-transform";
import { ensureTelegramTheme } from "@/lib/telegram/theme";

hashes.sha512 = sha512;

const SOL_PRICE_USD = 180;

type TransactionType = "incoming" | "outgoing" | "pending";

type Transaction = {
  id: string;
  type: TransactionType;
  amountLamports: number;
  // For incoming transactions
  sender?: string;
  username?: string;
  // For outgoing transactions
  recipient?: string;
  timestamp: number;
};

// Legacy type for internal use - will be removed
type IncomingTransaction = {
  id: string;
  amountLamports: number;
  sender: string;
  username: string;
};

function ActionButton({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-2 min-w-0 overflow-hidden rounded-2xl"
    >
      <div
        className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
        style={{
          background: "rgba(255, 255, 255, 0.06)",
          mixBlendMode: "lighten"
        }}
      >
        <div className="text-white">
          {React.cloneElement(
            icon as React.ReactElement<{ size?: number; strokeWidth?: number }>,
            { size: 28, strokeWidth: 1.5 }
          )}
        </div>
      </div>
      <span className="text-[13px] text-white/60 leading-4">{label}</span>
    </button>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M3.5 8.167V5.833A2.333 2.333 0 0 1 5.833 3.5h2.334"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.833 3.5h2.334A2.333 2.333 0 0 1 24.5 5.833v2.334"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24.5 19.833v2.334a2.333 2.333 0 0 1-2.333 2.333h-2.334"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.167 24.5H5.833A2.333 2.333 0 0 1 3.5 22.167v-2.334"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.167 14h11.666"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  const rawInitData = useRawInitData();
  const [isSendSheetOpen, setSendSheetOpen] = useState(false);
  const [sendStep, setSendStep] = useState<1 | 2 | 3>(1);
  const [isReceiveSheetOpen, setReceiveSheetOpen] = useState(false);
  const [
    isTransactionDetailsSheetOpen,
    setTransactionDetailsSheetOpen
  ] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [starsBalance, setStarsBalance] = useState<number>(1267); // Mock Stars balance
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [incomingTransactions, setIncomingTransactions] = useState<
    IncomingTransaction[]
  >([]);
  const [outgoingTransactions, setOutgoingTransactions] = useState<
    Transaction[]
  >([]);
  const [
    selectedTransaction,
    setSelectedTransaction
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

  const mainButtonAvailable = useSignal(mainButton.setParams.isAvailable);
  const secondaryButtonAvailable = useSignal(
    secondaryButton.setParams.isAvailable
  );
  const safeAreaInsetTop = useSignal(viewport.safeAreaInsetTop);
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

  const handleTopUpStars = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    // TODO: Implement Stars top-up flow (e.g., open Telegram Stars purchase)
    console.log("Top up stars clicked");
  }, []);

  const handleOpenTransactionDetails = useCallback(
    (transaction: IncomingTransaction) => {
      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("light");
      }
      setSelectedTransaction(transaction);
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

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }

    setIsRefreshing(true);
    try {
      // Refresh wallet balance
      await refreshWalletBalance();

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
  }, [isRefreshing, rawInitData, refreshWalletBalance]);

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

    // Create a pending transaction
    const pendingTxId = `pending-${Date.now()}`;
    const pendingTransaction: Transaction = {
      id: pendingTxId,
      type: "pending",
      amountLamports: lamports,
      recipient: trimmedRecipient,
      timestamp: Date.now()
    };

    setIsSendingTransaction(true);
    setOutgoingTransactions(prev => [pendingTransaction, ...prev]);

    try {
      console.log("Sending transaction to:", trimmedRecipient);

      if (isValidSolanaAddress(trimmedRecipient)) {
        console.log("Sending transaction to Solana address:");
        await sendSolTransaction(trimmedRecipient, lamports);
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

      // Update pending transaction to confirmed
      setOutgoingTransactions(prev =>
        prev.map(tx =>
          tx.id === pendingTxId
            ? { ...tx, type: "outgoing" as TransactionType }
            : tx
        )
      );

      await refreshWalletBalance();

      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("success");
      }

      setSendSheetOpen(false);
      setSelectedRecipient("");
      setSendFormValues({ amount: "", recipient: "" });
    } catch (error) {
      console.error("Failed to send transaction", error);
      // Remove failed pending transaction
      setOutgoingTransactions(prev => prev.filter(tx => tx.id !== pendingTxId));
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("error");
      }
    } finally {
      setIsSendingTransaction(false);
    }
  }, [
    isSendFormValid,
    isSendingTransaction,
    sendFormValues,
    refreshWalletBalance
  ]);

  const handleReceiveSheetChange = useCallback((open: boolean) => {
    if (!open && hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setReceiveSheetOpen(open);
  }, []);

  const handleTransactionDetailsSheetChange = useCallback((open: boolean) => {
    if (!open && hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setTransactionDetailsSheetOpen(open);
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
    // TODO: Implement QR code scanning
    console.log("Scan QR clicked");
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

        setTransactionDetailsSheetOpen(false);
        setSelectedTransaction(null);
      } catch (error) {
        console.error("Failed to claim transaction", error);
        if (hapticFeedback.notificationOccurred.isAvailable()) {
          hapticFeedback.notificationOccurred("error");
        }
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
      const signature = cleanInitDataResult.signature as string;
      const isValid = validateInitData(validationString, signature);
      console.log("Signature is valid: ", isValid);
    }
  }, [rawInitData]);

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

    // Enable fullscreen for mobile platforms
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const platform = params.get("tgWebAppPlatform");

    if (platform === "ios" || platform === "android") {
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

  // Add to home screen prompt
  useEffect(() => {
    const HOME_SCREEN_PROMPT_KEY = "homeScreenPrompted";

    const promptAddToHomeScreen = async () => {
      try {
        // Check if already prompted
        const alreadyPrompted = localStorage.getItem(HOME_SCREEN_PROMPT_KEY);
        if (alreadyPrompted === "true") {
          console.log("Home screen prompt already shown");
          return;
        }

        // Check if already added
        if (checkHomeScreenStatus.isAvailable()) {
          const status = await checkHomeScreenStatus();
          if (status === "added") {
            console.log("Already added to home screen");
            return;
          }
        }

        // Prompt user to add
        if (addToHomeScreen.isAvailable()) {
          addToHomeScreen();
          // Mark as prompted immediately
          localStorage.setItem(HOME_SCREEN_PROMPT_KEY, "true");
          console.log("Prompted to add to home screen");
        }
      } catch (error) {
        console.error("Failed to prompt add to home screen:", error);
      }
    };

    // Event handlers
    const onAdded = () => {
      console.log("App added to home screen");
      localStorage.setItem(HOME_SCREEN_PROMPT_KEY, "true");
    };

    const onFailed = () => {
      console.log("User declined add to home screen");
      localStorage.setItem(HOME_SCREEN_PROMPT_KEY, "true");
    };

    // Attach event listeners
    on("home_screen_added", onAdded);
    on("home_screen_failed", onFailed);

    // Prompt after a short delay to let the app initialize
    const timeoutId = setTimeout(() => {
      void promptAddToHomeScreen();
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      off("home_screen_added", onAdded);
      off("home_screen_failed", onFailed);
    };
  }, []);

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
          onClick: () => handleApproveTransaction(selectedTransaction.id)
        });
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
      } else {
        showMainButton({
          text: "Confirm and Send",
          onClick: handleSubmitSend,
          isEnabled: isSendFormValid && !isSendingTransaction,
          showLoader: isSendingTransaction
        });
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
    isClaimingTransaction,
    mainButtonAvailable,
    secondaryButtonAvailable,
    handleOpenSendSheet,
    handleOpenReceiveSheet,
    handleShareAddress,
    handleApproveTransaction,
    handleSubmitSend,
    sendStep // Added this dep
  ]);

  const formatBalance = (lamports: number | null): string => {
    if (lamports === null) return "0.0000";
    const sol = lamports / LAMPORTS_PER_SOL;
    return sol.toFixed(4);
  };

  const formatUsdValue = (lamports: number | null): string => {
    if (lamports === null) return "0.00";
    const sol = lamports / LAMPORTS_PER_SOL;
    const usd = sol * SOL_PRICE_USD;
    return usd.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatAddress = (address: string | null): string => {
    if (!address) return "Loading...";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatSenderAddress = (address: string): string => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatTransactionAmount = (lamports: number): string => {
    const sol = lamports / LAMPORTS_PER_SOL;
    // Format to up to 4 decimal places, but remove trailing zeros
    return parseFloat(sol.toFixed(4)).toString();
  };

  return (
    <>
      <main
        className="min-h-screen text-white font-sans overflow-hidden relative flex flex-col"
        style={{ background: "#16161a" }}
      >

        {/* Main Content */}
        <div
          className="relative flex-1 flex flex-col w-full"
          style={{ paddingTop: `${(safeAreaInsetTop || 0) + 36}px` }}
        >
          {/* Balance Section */}
          <div className="flex flex-col items-center pb-6 px-6">
            {/* Wallet Address */}
            <button
              onClick={() => {
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

            {/* Balance Display */}
            <div className="flex flex-col items-center gap-1.5 mt-1.5">
              <button
                onClick={() => {
                  if (hapticFeedback.impactOccurred.isAvailable()) {
                    hapticFeedback.impactOccurred("light");
                  }
                  setDisplayCurrency(prev => (prev === "USD" ? "SOL" : "USD"));
                }}
                className="active:scale-[0.98] transition-transform"
              >
                {isLoading ? (
                  <div className="h-12 w-48 bg-white/5 animate-pulse rounded-xl mx-auto" />
                ) : displayCurrency === "USD" ? (
                  <div className="flex items-center leading-[48px]">
                    <span className="text-[40px] font-semibold text-white/60">
                      $
                    </span>
                    <span className="text-[40px] font-semibold text-white">
                      {formatUsdValue(balance)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center leading-[48px] gap-2">
                    <span className="text-[40px] font-semibold text-white">
                      {formatBalance(balance)}
                    </span>
                    <span className="text-[40px] font-semibold text-white/60">
                      SOL
                    </span>
                  </div>
                )}
              </button>

              {/* Secondary Amount */}
              <p className="text-base text-white/60 leading-5">
                {displayCurrency === "USD"
                  ? `${formatBalance(balance)} SOL`
                  : `$${formatUsdValue(balance)}`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full px-6 mt-8">
              <ActionButton
                icon={<ArrowUp />}
                label="Send"
                onClick={() => handleOpenSendSheet()}
              />
              <ActionButton
                icon={<ArrowDown />}
                label="Receive"
                onClick={handleOpenReceiveSheet}
              />
              <ActionButton
                icon={<ScanIcon />}
                label="Scan"
                onClick={handleScanQR}
              />
            </div>
          </div>

          {/* Stars Card Section */}
          <div className="px-4 pb-4">
            <div
              className="flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden"
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
            </div>
          </div>

          {/* Activity Section - conditionally rendered */}
          {(() => {
            const hasNoTransactions =
              incomingTransactions.length === 0 &&
              outgoingTransactions.length === 0;
            const isEmptyWallet =
              (balance === null || balance === 0) && starsBalance === 0;

            // Empty wallet state - no SOL, no Stars, no transactions
            // Activity title is NOT shown in this state
            if (isEmptyWallet && hasNoTransactions && !isLoading) {
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
            if (hasNoTransactions && !isLoading) {
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
                <div className="px-4 pt-3 pb-2">
                  <p className="text-base font-medium text-white leading-5 tracking-[-0.176px]">
                    Activity
                  </p>
                </div>
                <div className="flex-1 px-4 pb-4">
                  <div className="flex flex-col gap-2 pb-36">

              {/* Incoming Transactions (Claimable) */}
              {incomingTransactions.map(transaction => {
                const isClaiming = claimingTransactionId === transaction.id;
                return (
                  <div
                    key={transaction.id}
                    className={`flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden ${
                      isClaiming ? "opacity-60 pointer-events-none" : ""
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
                      <p className="text-base text-white leading-5">Recieved</p>
                      <p className="text-[13px] text-white/60 leading-4">
                        from {formatSenderAddress(transaction.sender)}
                      </p>
                    </div>

                    {/* Right - Claim Button */}
                    <div className="py-2.5 pl-3">
                      <button
                        onClick={() =>
                          !isClaiming &&
                          handleOpenTransactionDetails(transaction)
                        }
                        className="px-4 py-2 rounded-full text-sm text-white leading-5 active:opacity-80 transition-opacity"
                        style={{
                          background:
                            "linear-gradient(90deg, rgba(50, 229, 94, 0.15) 0%, rgba(50, 229, 94, 0.15) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)"
                        }}
                      >
                        {isClaiming
                          ? "Claiming..."
                          : `Claim ${formatTransactionAmount(transaction.amountLamports)} SOL`}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Outgoing Transactions */}
              {outgoingTransactions.map(transaction => {
                const isPending = transaction.type === "pending";
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden"
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
                          background: isPending
                            ? "rgba(0, 177, 251, 0.15)"
                            : "rgba(255, 255, 255, 0.06)",
                          mixBlendMode: isPending ? "normal" : "lighten"
                        }}
                      >
                        {isPending ? (
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
                        {isPending ? "To be claimed" : "Sent"}
                      </p>
                      <p className="text-[13px] text-white/60 leading-4">
                        {isPending ? "by" : "to"}{" "}
                        {transaction.recipient?.startsWith("@")
                          ? transaction.recipient
                          : formatSenderAddress(transaction.recipient || "")}
                      </p>
                    </div>

                    {/* Right - Value */}
                    <div className="flex flex-col items-end gap-0.5 py-2.5 pl-3">
                      <p
                        className="text-base leading-5"
                        style={{ color: isPending ? "#00b1fb" : "white" }}
                      >
                        −{formatTransactionAmount(transaction.amountLamports)}{" "}
                        SOL
                      </p>
                      <p className="text-[13px] text-white/60 leading-4">
                        {new Date(transaction.timestamp).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                        ,{" "}
                        {new Date(transaction.timestamp).toLocaleTimeString(
                          [],
                          { hour: "numeric", minute: "2-digit" }
                        )}
                      </p>
                    </div>
                  </div>
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
      />
    </>
  );
}
