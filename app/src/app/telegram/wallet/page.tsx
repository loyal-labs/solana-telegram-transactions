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
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Copy,
  QrCode,
  Star,
  Wallet
} from "lucide-react";
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
      className="flex flex-col items-center gap-2.5 group"
    >
      <div className="relative w-14 h-14 rounded-2xl surface-raised flex items-center justify-center">
        <div className="text-zinc-300 group-hover:text-white group-active:text-zinc-400">
          {React.cloneElement(
            icon as React.ReactElement<{ size?: number; strokeWidth?: number }>,
            { size: 22, strokeWidth: 2 }
          )}
        </div>
      </div>
      <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300">
        {label}
      </span>
    </button>
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [incomingTransactions, setIncomingTransactions] = useState<
    IncomingTransaction[]
  >([]);
  const [outgoingTransactions, setOutgoingTransactions] = useState<
    Transaction[]
  >([
    // Mock transactions for UI testing
    {
      id: "mock-1",
      type: "outgoing",
      amountLamports: 500000000, // 0.5 SOL
      recipient: "@alice",
      timestamp: Date.now() - 3600000 // 1 hour ago
    },
    {
      id: "mock-2",
      type: "pending",
      amountLamports: 250000000, // 0.25 SOL
      recipient: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      timestamp: Date.now() - 60000 // 1 minute ago
    }
  ]);
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
          text: "Send",
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
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap");
        .mono {
          font-family: "JetBrains Mono", monospace;
        }

        /* Tactile raised surface - feels like you can touch it */
        .surface-raised {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.03) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom-color: rgba(0, 0, 0, 0.2);
          box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.05) inset,
            0 -1px 0 0 rgba(0, 0, 0, 0.1) inset,
            0 4px 12px -2px rgba(0, 0, 0, 0.4),
            0 2px 4px -1px rgba(0, 0, 0, 0.2);
        }

        .surface-raised:active {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.04) 0%,
            rgba(255, 255, 255, 0.02) 100%
          );
          box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.03) inset,
            0 1px 2px 0 rgba(0, 0, 0, 0.2);
          transform: translateY(1px);
        }

        /* Inset/recessed surface - feels sunken into the page */
        .surface-inset {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(0, 0, 0, 0.3);
          border-top-color: rgba(0, 0, 0, 0.4);
          box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.03),
            0 2px 8px -2px rgba(0, 0, 0, 0.5) inset;
        }

        /* Card surface - subtle lift */
        .surface-card {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom-color: rgba(0, 0, 0, 0.15);
          box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.04) inset,
            0 4px 16px -4px rgba(0, 0, 0, 0.5);
        }

        .text-gradient {
          background: linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <main className="min-h-screen text-white font-sans selection:bg-teal-500/30 overflow-hidden relative">
        {/* Deep Background with Gradient */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, #1c1f26 0%, #111318 35%, #0a0b0d 100%)"
          }}
        >
          {/* Noise texture for surface feel */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
            }}
          />
        </div>

        <div
          className="relative z-10 px-6 pt-6 pb-20 max-w-md mx-auto flex flex-col min-h-screen"
          style={{ paddingTop: `${(safeAreaInsetTop || 0) + 16}px` }}
        >
          {/* Balance Section */}
          <div className="flex flex-col items-center pt-8 pb-6">
            {/* Balance Display */}
            <button
              onClick={() => {
                if (hapticFeedback.impactOccurred.isAvailable()) {
                  hapticFeedback.impactOccurred("light");
                }
                setDisplayCurrency(prev => (prev === "USD" ? "SOL" : "USD"));
              }}
              className="text-center relative group cursor-pointer active:scale-[0.98] transition-transform"
            >
              <p className="text-zinc-500 text-xs font-medium tracking-wide uppercase mb-3">
                Balance
              </p>

              {isLoading ? (
                <div className="h-16 w-48 bg-white/5 animate-pulse rounded-xl mx-auto" />
              ) : (
                <div className="flex flex-col items-center">
                  <h1 className="text-5xl font-semibold tracking-tight text-gradient">
                    {displayCurrency === "USD"
                      ? `$${formatUsdValue(balance)}`
                      : `${formatBalance(balance)} SOL`}
                  </h1>

                  {/* Secondary currency */}
                  <p className="mt-2 text-sm text-zinc-500 font-mono">
                    {displayCurrency === "USD"
                      ? `${formatBalance(balance)} SOL`
                      : `$${formatUsdValue(balance)}`}
                  </p>
                </div>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="surface-inset rounded-2xl p-5 mb-6">
            <div className="flex justify-around">
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
                icon={<QrCode />}
                label="Scan QR"
                onClick={handleScanQR}
              />
            </div>
          </div>

          {/* Wallet Address Card */}
          <div
            className="surface-card rounded-xl p-3.5 mb-6 flex items-center justify-between cursor-pointer group transition-all duration-150 hover:brightness-105 active:brightness-95 active:scale-[0.99]"
            onClick={() => {
              if (walletAddress) {
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(walletAddress);
                }
                if (hapticFeedback.notificationOccurred.isAvailable()) {
                  hapticFeedback.notificationOccurred("success");
                }
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center shadow-sm">
                <Wallet className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-white/90 font-medium text-sm">Wallet</p>
                <p className="text-zinc-500 text-xs font-mono">
                  {formatAddress(walletAddress)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-white" />
                  <span className="text-white/90 font-medium text-sm">12</span>
                </div>
                <p className="text-zinc-500 text-[10px]">for free gas</p>
              </div>
              <Copy className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
          </div>

          {/* Transactions List */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                Activity
              </h3>
            </div>

            <div className="space-y-2.5 pb-safe">
              {/* Empty State */}
              {incomingTransactions.length === 0 &&
                outgoingTransactions.length === 0 &&
                !isLoading && (
                  <div className="surface-inset flex flex-col items-center justify-center py-16 rounded-xl">
                    <Clock className="w-8 h-8 text-zinc-600 mb-3" />
                    <p className="text-zinc-500 text-sm">No activity yet</p>
                  </div>
                )}

              {/* Incoming */}
              {incomingTransactions.map(transaction => {
                const isClaiming = claimingTransactionId === transaction.id;
                return (
                  <div
                    key={transaction.id}
                    onClick={() =>
                      !isClaiming && handleOpenTransactionDetails(transaction)
                    }
                    className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-150 hover:brightness-105 active:brightness-95 active:scale-[0.99] ${
                      isClaiming ? "opacity-60 pointer-events-none" : ""
                    }`}
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.06) 100%)",
                      border: "1px solid rgba(16,185,129,0.2)",
                      borderBottomColor: "rgba(0,0,0,0.15)",
                      boxShadow:
                        "0 1px 0 0 rgba(16,185,129,0.1) inset, 0 4px 12px -4px rgba(0,0,0,0.4)"
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-sm">
                        <ArrowDown
                          className="w-5 h-5 text-emerald-400"
                          strokeWidth={2}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white/90 font-medium text-sm">
                            Received
                          </p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 font-medium">
                            Claim
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs mono">
                          from {formatSenderAddress(transaction.sender)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-semibold text-sm">
                        +{formatTransactionAmount(transaction.amountLamports)}{" "}
                        SOL
                      </p>
                      {isClaiming && (
                        <span className="text-xs text-zinc-500 animate-pulse">
                          Claiming...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Outgoing - non-interactive, flat/recessed style */}
              {outgoingTransactions.map(transaction => {
                const isPending = transaction.type === "pending";
                return (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl ${
                      isPending
                        ? "bg-amber-500/[0.06] border border-amber-500/10"
                        : "bg-white/[0.02] border border-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isPending
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-white/[0.04] text-zinc-500"
                        }`}
                      >
                        {isPending ? (
                          <Clock className="w-5 h-5 animate-pulse" />
                        ) : (
                          <ArrowUp className="w-5 h-5" strokeWidth={2} />
                        )}
                      </div>
                      <div>
                        <p className="text-white/70 font-medium text-sm">
                          {isPending ? "To be claimed..." : "Sent"}
                        </p>
                        <p className="text-zinc-600 text-xs mono">
                          {isPending ? "by" : "to"}{" "}
                          {transaction.recipient?.startsWith("@")
                            ? transaction.recipient
                            : formatSenderAddress(transaction.recipient || "")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 font-medium text-sm">
                        -{formatTransactionAmount(transaction.amountLamports)}{" "}
                        SOL
                      </p>
                      <p className="text-xs text-zinc-600">
                        {new Date(transaction.timestamp).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
      />
      <ReceiveSheet
        open={isReceiveSheetOpen}
        onOpenChange={handleReceiveSheetChange}
        trigger={null}
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
