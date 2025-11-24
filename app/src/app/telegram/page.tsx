'use client';

import { hashes } from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
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
  viewport,
} from '@telegram-apps/sdk-react';
import { 
  ArrowDown, 
  ArrowUp, 
  Clock, 
  Copy, 
  RefreshCw, 
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import React from 'react';

import ReceiveSheet from '@/components/wallet/ReceiveSheet';
import SendSheet, { isValidSolanaAddress, isValidTelegramUsername } from '@/components/wallet/SendSheet';
import TransactionDetailsSheet from '@/components/wallet/TransactionDetailsSheet';
import { TELEGRAM_BOT_ID, TELEGRAM_PUBLIC_KEY_PROD_UINT8ARRAY } from '@/lib/constants';
import { topUpDeposit } from '@/lib/solana/deposits';
import { fetchDeposits } from '@/lib/solana/fetch-deposits';
import { getTelegramTransferProgram } from '@/lib/solana/solana-helpers';
import { verifyAndClaimDeposit } from '@/lib/solana/verify-and-claim-deposit';
import { getWalletBalance, getWalletKeypair, getWalletProvider, getWalletPublicKey, sendSolTransaction } from '@/lib/solana/wallet/wallet-details';
import { SimpleWallet } from '@/lib/solana/wallet/wallet-implementation';
import { ensureWalletKeypair } from '@/lib/solana/wallet/wallet-keypair-logic';
import { initTelegram, sendString } from '@/lib/telegram';
import {
  hideMainButton,
  hideSecondaryButton,
  showMainButton,
  showReceiveShareButton,
  showTransactionDetailsButtons,
  showWalletHomeButtons,
} from '@/lib/telegram/buttons';
import {
  cleanInitData,
  createValidationBytesFromRawInitData,
  createValidationString,
  validateInitData,
} from '@/lib/telegram/init-data-transform';
import { parseUsernameFromInitData } from '@/lib/telegram/init-data-transform';
import { ensureTelegramTheme } from '@/lib/telegram/theme';

hashes.sha512 = sha512;

const SOL_PRICE_USD = 180;

type TransactionType = 'incoming' | 'outgoing' | 'pending';

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

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 text-white flex items-center justify-center transition-all group-active:scale-95 group-hover:bg-zinc-700 group-hover:border-zinc-600 shadow-xl backdrop-blur-sm">
                {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: 1.5 })}
            </div>
            <span className="text-xs text-zinc-400 font-medium tracking-wide group-hover:text-zinc-300 transition-colors">{label}</span>
        </button>
    )
}

export default function Home() {
  const rawInitData = useRawInitData();
  const [isSendSheetOpen, setSendSheetOpen] = useState(false);
  const [isReceiveSheetOpen, setReceiveSheetOpen] = useState(false);
  const [isTransactionDetailsSheetOpen, setTransactionDetailsSheetOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [incomingTransactions, setIncomingTransactions] = useState<IncomingTransaction[]>([]);
  const [outgoingTransactions, setOutgoingTransactions] = useState<Transaction[]>([
    // Mock transactions for UI testing
    {
      id: 'mock-1',
      type: 'outgoing',
      amountLamports: 500000000, // 0.5 SOL
      recipient: '@alice',
      timestamp: Date.now() - 3600000, // 1 hour ago
    },
    {
      id: 'mock-2',
      type: 'pending',
      amountLamports: 250000000, // 0.25 SOL
      recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      timestamp: Date.now() - 60000, // 1 minute ago
    },
  ]);
  const [selectedTransaction, setSelectedTransaction] = useState<IncomingTransaction | null>(null);
  const [isSendFormValid, setIsSendFormValid] = useState(false);
  const [sendAttempted, setSendAttempted] = useState(false);
  const [isClaimingTransaction, setIsClaimingTransaction] = useState(false);
  const [claimingTransactionId, setClaimingTransactionId] = useState<string | null>(null);
  const [sendFormValues, setSendFormValues] = useState<{ amount: string; recipient: string }>({
    amount: "",
    recipient: "",
  });
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);

  const mainButtonAvailable = useSignal(mainButton.setParams.isAvailable);
  const secondaryButtonAvailable = useSignal(secondaryButton.setParams.isAvailable);
  const safeAreaInsetTop = useSignal(viewport.safeAreaInsetTop);
  const ensuredWalletRef = useRef(false);

  const handleOpenSendSheet = useCallback((recipientName?: string) => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('light');
    }
    if (recipientName) {
      setSelectedRecipient(recipientName);
      setSendFormValues({ amount: "", recipient: recipientName });
    } else {
      setSelectedRecipient("");
      setSendFormValues({ amount: "", recipient: "" });
    }
    setSendAttempted(false); // Reset error state when opening
    setSendSheetOpen(true);
  }, []);

  const handleOpenReceiveSheet = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('light');
    }
    setReceiveSheetOpen(true);
  }, []);

  const handleOpenTransactionDetails = useCallback((transaction: IncomingTransaction) => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('light');
    }
    setSelectedTransaction(transaction);
    setTransactionDetailsSheetOpen(true);
  }, []);

  const handleSendValidationChange = useCallback((isValid: boolean) => {
    setIsSendFormValid(isValid);
  }, []);

  const handleSendFormValuesChange = useCallback((values: { amount: string; recipient: string }) => {
    setSendFormValues(values);
  }, []);

  const handleSendSheetChange = useCallback((open: boolean) => {
    if (!open && hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('light');
    }
    setSendSheetOpen(open);
    if (!open) {
      setSelectedRecipient("");
      setSendAttempted(false);
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
      hapticFeedback.impactOccurred('light');
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

          const mappedTransactions: IncomingTransaction[] = deposits.map((deposit) => {
            const senderBase58 =
              typeof (deposit.user as { toBase58?: () => string }).toBase58 === "function"
                ? deposit.user.toBase58()
                : String(deposit.user);

            return {
              id: `${senderBase58}-${deposit.lastNonce}`,
              amountLamports: deposit.amount,
              sender: senderBase58,
              username: username,
            };
          });

          setIncomingTransactions(mappedTransactions);
        }
      }

      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      console.error("Failed to refresh data", error);
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, rawInitData, refreshWalletBalance]);

  const handleSubmitSend = useCallback(async () => {
    setSendAttempted(true);
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
      type: 'pending',
      amountLamports: lamports,
      recipient: trimmedRecipient,
      timestamp: Date.now(),
    };

    setIsSendingTransaction(true);
    setOutgoingTransactions((prev) => [pendingTransaction, ...prev]);

    try {
      console.log("Sending transaction to:", trimmedRecipient);

      if (isValidSolanaAddress(trimmedRecipient)) {
        console.log("Sending transaction to Solana address:")
        await sendSolTransaction(trimmedRecipient, lamports);
      } else if (isValidTelegramUsername(trimmedRecipient)) {
        console.log("Sending transaction to Telegram username:", trimmedRecipient);
        const username = trimmedRecipient.replace(/^@/, "");
        const provider = await getWalletProvider();
        const transferProgram = getTelegramTransferProgram(provider);
        await topUpDeposit(provider, transferProgram, username, lamports);
      } else {
        throw new Error("Invalid recipient");
      }

      // Update pending transaction to confirmed
      setOutgoingTransactions((prev) =>
        prev.map((tx) =>
          tx.id === pendingTxId ? { ...tx, type: 'outgoing' as TransactionType } : tx
        )
      );

      await refreshWalletBalance();

      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred('success');
      }

      setSendSheetOpen(false);
      setSelectedRecipient("");
      setSendAttempted(false);
      setSendFormValues({ amount: "", recipient: "" });
    } catch (error) {
      console.error("Failed to send transaction", error);
      // Remove failed pending transaction
      setOutgoingTransactions((prev) => prev.filter((tx) => tx.id !== pendingTxId));
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsSendingTransaction(false);
    }
  }, [isSendFormValid, isSendingTransaction, sendFormValues, refreshWalletBalance]);

  const handleReceiveSheetChange = useCallback((open: boolean) => {
    if (!open && hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('light');
    }
    setReceiveSheetOpen(open);
  }, []);

  const handleTransactionDetailsSheetChange = useCallback((open: boolean) => {
    if (!open && hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('light');
    }
    setTransactionDetailsSheetOpen(open);
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

  const handleApproveTransaction = useCallback(async (transactionId: string) => {
    if (!rawInitData) {
      console.error("Cannot verify init data: raw init data missing");
      return;
    }

    const transaction = incomingTransactions.find((tx) => tx.id === transactionId);
    if (!transaction) {
      console.warn("Transaction not found for approval:", transactionId);
      return;
    }

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('medium');
    }
    setIsClaimingTransaction(true);
    setClaimingTransactionId(transactionId);
    try {
      const provider = await getWalletProvider();
      const keypair = await getWalletKeypair();
      const wallet = new SimpleWallet(keypair);
      const recipientPublicKey = provider.publicKey;

      const { validationBytes, signatureBytes } = createValidationBytesFromRawInitData(rawInitData);
      const senderPublicKey = new PublicKey(transaction.sender);

      const username = transaction.username;
      const amountLamports = transaction.amountLamports;
      console.log("username:", username, " to:", recipientPublicKey.toBase58());

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

      setIncomingTransactions((prev) => prev.filter((tx) => tx.id !== transactionId));

      await refreshWalletBalance();

      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred('success');
      }

      setTransactionDetailsSheetOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Failed to claim transaction", error);
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsClaimingTransaction(false);
      setClaimingTransactionId(null);
    }
  }, [incomingTransactions, rawInitData, refreshWalletBalance]);

  useEffect(() => {
    if (rawInitData) {
      const cleanInitDataResult = cleanInitData(rawInitData);
      const validationString = createValidationString(TELEGRAM_BOT_ID, cleanInitDataResult);
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

        const mappedTransactions: IncomingTransaction[] = deposits.map((deposit) => {
          const senderBase58 =
            typeof (deposit.user as { toBase58?: () => string }).toBase58 === "function"
              ? deposit.user.toBase58()
              : String(deposit.user);

          return {
            id: `${senderBase58}-${deposit.lastNonce}`,
            amountLamports: deposit.amount,
            sender: senderBase58,
            username: deposit.username,
          };
        });

        console.log("Setting incoming transactions:", mappedTransactions.length, mappedTransactions);
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
        console.log('Closing behavior mounted');
      }

      if (closingBehavior.enableConfirmation.isAvailable()) {
        closingBehavior.enableConfirmation();
        const isEnabled = closingBehavior.isConfirmationEnabled();
        console.log('Closing confirmation enabled:', isEnabled);
      } else {
        console.warn('enableConfirmation is not available');
      }
    } catch (error) {
      console.error('Failed to enable closing confirmation:', error);
    }

    // Enable fullscreen for mobile platforms
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const platform = params.get('tgWebAppPlatform');

    if (platform === 'ios' || platform === 'android') {
      if (viewport.requestFullscreen.isAvailable()) {
        void viewport.requestFullscreen().catch((error) => {
          console.warn('Failed to enable fullscreen:', error);
        });
      }
    }

    // Suppress Telegram SDK viewport errors in non-TMA environment
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      // Suppress viewport_changed and other bridge validation errors
      if (message.includes('viewport_changed') ||
          message.includes('ValiError: Invalid type: Expected Object but received null')) {
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
        console.log("Wallet keypair ready", { isNew, publicKey: publicKeyBase58 });
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
    const HOME_SCREEN_PROMPT_KEY = 'homeScreenPrompted';

    const promptAddToHomeScreen = async () => {
      try {
        // Check if already prompted
        const alreadyPrompted = localStorage.getItem(HOME_SCREEN_PROMPT_KEY);
        if (alreadyPrompted === 'true') {
          console.log('Home screen prompt already shown');
          return;
        }

        // Check if already added
        if (checkHomeScreenStatus.isAvailable()) {
          const status = await checkHomeScreenStatus();
          if (status === 'added') {
            console.log('Already added to home screen');
            return;
          }
        }

        // Prompt user to add
        if (addToHomeScreen.isAvailable()) {
          addToHomeScreen();
          // Mark as prompted immediately
          localStorage.setItem(HOME_SCREEN_PROMPT_KEY, 'true');
          console.log('Prompted to add to home screen');
        }
      } catch (error) {
        console.error('Failed to prompt add to home screen:', error);
      }
    };

    // Event handlers
    const onAdded = () => {
      console.log('App added to home screen');
      localStorage.setItem(HOME_SCREEN_PROMPT_KEY, 'true');
    };

    const onFailed = () => {
      console.log('User declined add to home screen');
      localStorage.setItem(HOME_SCREEN_PROMPT_KEY, 'true');
    };

    // Attach event listeners
    on('home_screen_added', onAdded);
    on('home_screen_failed', onFailed);

    // Prompt after a short delay to let the app initialize
    const timeoutId = setTimeout(() => {
      void promptAddToHomeScreen();
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      off('home_screen_added', onAdded);
      off('home_screen_failed', onFailed);
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
          showLoader: true,
        });
      } else {
        // Show only Claim button (no Ignore)
        showMainButton({
          text: "Claim",
          onClick: () => handleApproveTransaction(selectedTransaction.id),
        });
      }
    } else if (isSendSheetOpen) {
      hideSecondaryButton();
      showMainButton({
        text: "Send",
        onClick: handleSubmitSend,
        isEnabled: isSendFormValid && !isSendingTransaction,
        showLoader: isSendingTransaction,
      });
    } else if (isReceiveSheetOpen) {
      hideSecondaryButton();
      showReceiveShareButton({ onShare: handleShareAddress });
    } else {
      showWalletHomeButtons({
        onSend: () => handleOpenSendSheet(),
        onReceive: handleOpenReceiveSheet,
      });
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
    return usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      <main className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
        {/* Abstract Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
             <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
             <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[100px]" />
        </div>

        <div className="relative z-10 px-5 pt-6 pb-24 max-w-md mx-auto flex flex-col min-h-screen" style={{ paddingTop: `${(safeAreaInsetTop || 0) + 24}px` }}>
            
            {/* Header / Balance */}
            <div className="flex flex-col items-center justify-center py-6 space-y-8">
                 {/* Balance Display */}
                 <div className="text-center space-y-3 scale-100 transition-transform active:scale-95 duration-200">
                    <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase">Total Balance</p>
                    {isLoading ? (
                        <div className="h-16 w-48 bg-zinc-900/50 animate-pulse rounded-2xl mx-auto" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <h1 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
                                ${formatUsdValue(balance)}
                            </h1>
                            <div className="flex items-center space-x-2 mt-3 px-4 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/60 backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-zinc-300 text-sm font-mono tracking-tight">{formatBalance(balance)} SOL</span>
                            </div>
                        </div>
                    )}
                 </div>

                 {/* Action Buttons */}
                 <div className="flex items-center justify-center gap-6 w-full">
                    <ActionButton icon={<ArrowUp />} label="Send" onClick={() => handleOpenSendSheet()} />
                    <ActionButton icon={<ArrowDown />} label="Receive" onClick={handleOpenReceiveSheet} />
                    <ActionButton icon={<Copy />} label="Copy" onClick={() => {
                        if (walletAddress) {
                            if (navigator?.clipboard?.writeText) {
                                navigator.clipboard.writeText(walletAddress);
                            }
                            if (hapticFeedback.notificationOccurred.isAvailable()) {
                                hapticFeedback.notificationOccurred('success');
                            }
                        }
                    }} />
                    <ActionButton 
                        icon={<RefreshCw className={isRefreshing ? "animate-spin" : ""} />} 
                        label="Refresh" 
                        onClick={handleRefresh} 
                    />
                 </div>
            </div>

            {/* Wallet Address Card (Compact) */}
             <div className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 mb-8 flex items-center justify-between backdrop-blur-md hover:bg-zinc-900/60 transition-colors cursor-pointer group"
                  onClick={() => {
                      if (walletAddress) {
                          if (navigator?.clipboard?.writeText) {
                              navigator.clipboard.writeText(walletAddress);
                          }
                          if (hapticFeedback.notificationOccurred.isAvailable()) {
                              hapticFeedback.notificationOccurred('success');
                          }
                      }
                  }}>
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-white font-medium text-sm group-hover:text-indigo-300 transition-colors">Solana Wallet</p>
                        <p className="text-zinc-500 text-xs font-mono">{formatAddress(walletAddress)}</p>
                    </div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy className="w-4 h-4 text-white/60" />
                </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-lg font-bold text-white tracking-tight">Activity</h3>
                </div>
                
                <div className="space-y-3 pb-safe">
                    {/* Empty State */}
                    {incomingTransactions.length === 0 && outgoingTransactions.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-600 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                                <Clock className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-sm font-medium">No recent activity</p>
                        </div>
                    )}

                    {/* Incoming */}
                    {incomingTransactions.map((transaction) => {
                         const isClaiming = claimingTransactionId === transaction.id;
                         return (
                            <div
                                key={transaction.id}
                                onClick={() => !isClaiming && handleOpenTransactionDetails(transaction)}
                                className={`group flex items-center justify-between p-3 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer ${isClaiming ? 'opacity-60 pointer-events-none' : ''}`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                        <ArrowDown className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-white font-semibold text-sm">Received</p>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">NEW</span>
                                        </div>
                                        <p className="text-zinc-500 text-xs mono">from {formatSenderAddress(transaction.sender)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-400 font-bold text-sm">+{formatTransactionAmount(transaction.amountLamports)} SOL</p>
                                    {isClaiming ? (
                                        <span className="text-xs text-zinc-500 animate-pulse">Claiming...</span>
                                    ) : (
                                        <span className="text-xs text-zinc-500">Tap to claim</span>
                                    )}
                                </div>
                            </div>
                         );
                    })}

                    {/* Outgoing */}
                    {outgoingTransactions.map((transaction) => {
                         const isPending = transaction.type === 'pending';
                         return (
                            <div
                                key={transaction.id}
                                className={`flex items-center justify-between p-3 rounded-2xl border ${
                                    isPending 
                                    ? 'bg-amber-500/5 border-amber-500/20' 
                                    : 'bg-zinc-900/30 border-zinc-800/50'
                                }`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        isPending ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                        {isPending ? <Clock className="w-5 h-5 animate-pulse" /> : <ArrowUp className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-sm">{isPending ? 'Sending...' : 'Sent'}</p>
                                        <p className="text-zinc-500 text-xs mono">to {
                                            transaction.recipient?.startsWith('@')
                                            ? transaction.recipient
                                            : formatSenderAddress(transaction.recipient || '')
                                        }</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-bold text-sm">-{formatTransactionAmount(transaction.amountLamports)} SOL</p>
                                    <p className="text-xs text-zinc-500">{
                                        new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    }</p>
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
        showErrors={sendAttempted}
      />
      <ReceiveSheet open={isReceiveSheetOpen} onOpenChange={handleReceiveSheetChange} trigger={null} />
      <TransactionDetailsSheet
        open={isTransactionDetailsSheetOpen}
        onOpenChange={handleTransactionDetailsSheetChange}
        trigger={null}
        transaction={selectedTransaction}
      />
    </>
  );
}