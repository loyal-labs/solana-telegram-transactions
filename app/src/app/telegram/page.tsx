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
import { Check } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import LightRays from '@/components/LightRays';
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

type IncomingTransaction = {
  id: string;
  amountLamports: number;
  sender: string;
  username: string;
};

// Commented out - Quick Send feature not yet complete
// const QUICK_SEND_CONTACTS = [
//   { id: '1', name: 'Alice', initials: 'AL' },
//   { id: '2', name: 'Bob', initials: 'BO' },
//   { id: '3', name: 'Carol', initials: 'CA' },
//   { id: '4', name: 'Dave', initials: 'DA' },
//   { id: '5', name: 'Eve', initials: 'EV' },
// ];

// Commented out - Placeholder transactions
// const MOCK_TRANSACTIONS = [
//   { id: '1', name: 'Received from Alice', date: 'Today', amount: 0.5, type: 'receive' },
//   { id: '2', name: 'Sent to Bob', date: 'Yesterday', amount: -0.25, type: 'send' },
//   { id: '3', name: 'Received from Carol', date: 'Jan 15, 2025', amount: 1.0, type: 'receive' },
// ];

export default function Home() {
  const rawInitData = useRawInitData();
  const [isSendSheetOpen, setSendSheetOpen] = useState(false);
  const [isReceiveSheetOpen, setReceiveSheetOpen] = useState(false);
  const [isTransactionDetailsSheetOpen, setTransactionDetailsSheetOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [incomingTransactions, setIncomingTransactions] = useState<IncomingTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<IncomingTransaction | null>(null);
  const [isSendFormValid, setIsSendFormValid] = useState(false);
  const [sendAttempted, setSendAttempted] = useState(false);
  const [isClaimingTransaction, setIsClaimingTransaction] = useState(false);
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

    setIsSendingTransaction(true);
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
        const deposits = await fetchDeposits(provider, username);
        console.log("Deposits:", deposits);
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
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .mono {
          font-family: 'JetBrains Mono', monospace;
        }

        @keyframes particle-float {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(10px, -10px); opacity: 0.6; }
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        .particle {
          animation: particle-float 3s ease-in-out infinite;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <main className="relative min-h-screen overflow-hidden" style={{
        background: '#0a0a0a',
      }}>
        {/* Animated background rays */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, opacity: 0.3 }}>
          <LightRays
            raysOrigin="top-center"
            raysColor="#6366f1"
            raysSpeed={0.8}
            lightSpread={0.8}
            rayLength={2.5}
            followMouse={false}
            noiseAmount={0.1}
            distortion={0.05}
            fadeDistance={1.2}
            saturation={0.6}
          />
        </div>

        {/* Subtle texture overlay */}
        <div
          className="fixed inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-0 px-5 pb-28" style={{ paddingTop: `${(safeAreaInsetTop || 0) + 8}px` }}>
          {/* Header - empty space for visual balance */}
          <div className="mb-3 h-4" />

          {/* Balance - hero with radial glow and particles */}
          <div className="relative mb-10">
            {/* Radial glow effect behind balance */}
            <div
              className="absolute left-0 top-8 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
                animation: 'glow-pulse 4s ease-in-out infinite',
              }}
            />

            {/* Floating particles */}
            <div className="absolute top-0 right-0 pointer-events-none">
              <div className="particle" style={{ animationDelay: '0s' }}>
                <div className="w-1 h-1 rounded-full bg-white/20" />
              </div>
            </div>
            <div className="absolute top-12 right-16 pointer-events-none">
              <div className="particle" style={{ animationDelay: '0.5s' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
              </div>
            </div>
            <div className="absolute top-20 right-32 pointer-events-none">
              <div className="particle" style={{ animationDelay: '1s' }}>
                <div className="w-1 h-1 rounded-full bg-white/25" />
              </div>
            </div>

            <div className="relative">
              <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-3 font-medium">Total Balance</p>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
                  <span className="text-white/50 text-2xl font-semibold mono">Loading...</span>
                </div>
              ) : (
                <>
                  <h1 className="text-white text-5xl font-bold tracking-tighter mb-1.5 mono" style={{
                    textShadow: '0 0 40px rgba(255, 255, 255, 0.1)',
                  }}>
                    ${formatUsdValue(balance)}
                  </h1>
                  <p className="text-white/30 text-sm mono">{formatBalance(balance)} SOL</p>
                </>
              )}
            </div>
          </div>

          {/* Incoming Transactions Notifications */}
          {incomingTransactions.length > 0 && (
            <div className="relative mb-8">
              <div className="space-y-3">
                {incomingTransactions.map((transaction, idx) => (
                  <div
                    key={transaction.id}
                    onClick={() => handleOpenTransactionDetails(transaction)}
                    className="rounded-2xl p-4 shadow-lg transition-all hover:scale-[1.01] cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.03) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      animationDelay: `${idx * 0.1}s`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" style={{
                            boxShadow: '0 0 6px rgba(99, 102, 241, 0.8)',
                          }} />
                          <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium">
                            Incoming
                          </p>
                        </div>
                        <p className="text-white text-xl font-bold mono mb-1">
                          {formatTransactionAmount(transaction.amountLamports)} SOL
                        </p>
                        <p className="text-white/50 text-xs mono">
                          from {formatSenderAddress(transaction.sender)}
                        </p>
                      </div>

                      <div className="flex items-center ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveTransaction(transaction.id);
                          }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-emerald-500/20 active:scale-95"
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                          aria-label="Claim transaction"
                        >
                          <Check className="w-4 h-4 text-emerald-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Send - Commented out until feature is complete */}
          {/* <div className="relative mb-8"> */}
            {/* Decorative dotted line */}
            {/* <div className="absolute left-0 top-0 w-8 h-px" style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 2px, transparent 2px, transparent 6px)',
            }} /> */}

            {/* <div className="flex items-center justify-between mb-4">
              <h2 className="text-white/90 text-sm font-medium tracking-wide">Quick Send</h2>
              <button
                onClick={() => handleOpenSendSheet()}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.08]"
                style={{ background: 'rgba(255, 255, 255, 0.04)' }}
              >
                <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div> */}

            {/* <div className="flex space-x-3 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_SEND_CONTACTS.map((contact, idx) => (
                <button
                  key={contact.id}
                  onClick={() => handleOpenSendSheet(contact.name)}
                  className="flex flex-col items-center flex-shrink-0 group"
                >
                  <div
                    className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white/70 font-medium text-xs mb-1.5 transition-all group-hover:scale-105 group-hover:bg-white/[0.08]"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      animationDelay: `${idx * 0.1}s`,
                    }}
                  >
                    {contact.initials} */}
                    {/* Corner accent */}
                    {/* <div className="absolute top-0 right-0 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-1 h-1 rounded-full bg-indigo-400" style={{
                        boxShadow: '0 0 6px rgba(99, 102, 241, 0.6)',
                      }} />
                    </div>
                  </div>
                  <span className="text-white/40 text-[11px] tracking-wide">{contact.name}</span>
                </button>
              ))}
            </div>
          </div> */}

          {/* Wallet Card - THE focal card with stacking */}
          <div className="relative mb-8" style={{ perspective: '1000px' }}>
            <div
              className="rounded-3xl p-5 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-[0.15em] mb-1.5 font-medium">Address</p>
                  <p className="text-white/80 mono text-xs">{formatAddress(walletAddress)}</p>
                </div>
                <button
                  onClick={async () => {
                    if (hapticFeedback.impactOccurred.isAvailable()) {
                      hapticFeedback.impactOccurred('light');
                    }
                    if (walletAddress && navigator?.clipboard?.writeText) {
                      await navigator.clipboard.writeText(walletAddress);
                    }
                  }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.12] active:scale-95"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-[0.15em] mb-1.5 font-medium">Balance</p>
                  <p className="text-white text-xl font-bold mono">{formatBalance(balance)} SOL</p>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" style={{
                    boxShadow: '0 0 4px rgba(16, 185, 129, 0.6)',
                  }} />
                  <span className="text-white/30 text-[10px] tracking-wide">Devnet</span>
                </div>
              </div>
            </div>

            {/* Stacked shadows */}
            <div
              className="absolute top-2 left-2 right-2 h-full rounded-3xl -z-10"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            />
            <div
              className="absolute top-4 left-4 right-4 h-full rounded-3xl -z-20"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            />
          </div>

          {/* Transactions - asymmetric layout with accent bar */}
          <div className="relative">
            {/* Decorative accent bar */}
            <div className="absolute -left-5 top-0 bottom-0 w-px" style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(99, 102, 241, 0.3) 20%, rgba(99, 102, 241, 0.3) 80%, transparent 100%)',
            }} />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white/90 text-sm font-medium tracking-wide">Transactions</h2>
                <div className="w-12 h-px mt-1.5" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 6px)',
                }} />
              </div>
              {/* Commented out - Transaction history page not yet designed */}
              {/* <button className="text-white/40 text-xs hover:text-white/60 transition-colors">See all →</button> */}
            </div>

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center pt-6 pb-12 px-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <svg
                  className="w-6 h-6 text-white/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-white/30 text-sm tracking-wide">Your transactions will appear here</p>
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
