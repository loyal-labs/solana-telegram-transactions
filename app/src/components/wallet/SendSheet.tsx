"use client";

import { hapticFeedback } from "@telegram-apps/sdk-react";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import {
  ArrowLeft,
  Check,
  Search,
  ShieldAlert,
  Wallet,
  X
} from "lucide-react";
import Image from "next/image";
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

export type SendSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialRecipient?: string;
  onValidationChange?: (isValid: boolean) => void;
  onFormValuesChange?: (values: { amount: string; recipient: string }) => void;
  step: 1 | 2 | 3 | 4;
  onStepChange: (step: 1 | 2 | 3 | 4) => void;
  balance?: number | null; // Balance in lamports
  walletAddress?: string;
  starsBalance?: number; // Balance in Stars
  onTopUpStars?: () => void; // Callback when user wants to top up Stars
  // Success/Error step props
  sentAmountSol?: number; // Amount sent in SOL (for success display)
  sendError?: string | null; // Error message (if present, shows error state instead of success)
};

// Basic Solana address validation (base58, 32-44 chars)
export const isValidSolanaAddress = (address: string): boolean => {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};

// Telegram username validation (starts with @, 5-32 chars excluding @)
export const isValidTelegramUsername = (username: string): boolean => {
  if (!username.startsWith("@")) return false;
  const usernameWithoutAt = username.slice(1);
  return usernameWithoutAt.length >= 5 && usernameWithoutAt.length <= 32;
};

const MOCK_CONTACTS = [
  { name: "Vlad", username: "@vlad_arbatov", avatar: "https://avatars.githubusercontent.com/u/537414?v=4" },
  { name: "Candy", username: "@candyflipline", avatar: "https://avatars.githubusercontent.com/u/537414?v=4" },
  { name: "Bob", username: "@bob_builder", avatar: null },
  { name: "Carol", username: "@carol_danvers", avatar: null },
];

const SOL_PRICE_USD = 180;
const LAST_AMOUNT_KEY = 'lastSendAmount';
const LAMPORTS_PER_SOL = 1_000_000_000;

// Fee constants
const SOLANA_FEE_SOL = 0.000005;
const SOLANA_FEE_USD = SOLANA_FEE_SOL * SOL_PRICE_USD;
const STARS_FEE_AMOUNT = 2000; // TODO: Change back to 1 Star for fee (hardcoded for testing)
const STARS_TO_USD = 0.02; // 1 Star = $0.02

type LastAmount = {
  sol: number;
  usd: number;
};

const getLastAmount = (): LastAmount | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LAST_AMOUNT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
};

const saveLastAmount = (solAmount: number) => {
  if (typeof window === 'undefined') return;
  try {
    const lastAmount: LastAmount = {
      sol: solAmount,
      usd: parseFloat((solAmount * SOL_PRICE_USD).toFixed(2)),
    };
    localStorage.setItem(LAST_AMOUNT_KEY, JSON.stringify(lastAmount));
  } catch {}
};

// Generate initials from name
const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

// Generate a consistent color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    "rgba(99, 102, 241, 0.3)", // indigo
    "rgba(236, 72, 153, 0.3)", // pink
    "rgba(34, 197, 94, 0.3)", // green
    "rgba(249, 115, 22, 0.3)", // orange
    "rgba(139, 92, 246, 0.3)", // violet
    "rgba(14, 165, 233, 0.3)", // sky
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function SendSheet({
  trigger,
  open,
  onOpenChange,
  initialRecipient,
  onValidationChange,
  onFormValuesChange,
  step,
  onStepChange,
  balance,
  walletAddress,
  starsBalance = 0,
  onTopUpStars,
  sentAmountSol,
  sendError,
}: SendSheetProps) {
  // Convert balance from lamports to SOL
  const balanceInSol = balance ? balance / LAMPORTS_PER_SOL : 0;
  const balanceInUsd = balanceInSol * SOL_PRICE_USD;

  // Abbreviate wallet address for display
  const abbreviatedAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
    : '';
  const [amountStr, setAmountStr] = useState("");
  const [recipient, setRecipient] = useState("");
  const [currency, setCurrency] = useState<'SOL' | 'USD'>('SOL');
  const [lastAmount, setLastAmount] = useState<LastAmount | null>(null);
  const [feePaymentMethod, setFeePaymentMethod] = useState<'solana' | 'stars'>('solana');
  const inputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const amountTextRef = useRef<HTMLParagraphElement>(null);
  const [caretLeft, setCaretLeft] = useState(0);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setAmountStr("");
      setRecipient(initialRecipient || "");
      setCurrency('SOL');
      setLastAmount(getLastAmount());
    }
  }, [open, initialRecipient]);

  // Auto-focus input based on step
  useEffect(() => {
    if (open && step === 1) {
      // Delay to allow modal animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
    if (open && step === 2) {
      // Focus amount input on step 2
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
    if (open && step === 3) {
      // Blur inputs to close keyboard on Review step
      amountInputRef.current?.blur();
      inputRef.current?.blur();
    }
  }, [open, step]);

  // Update caret position based on actual text width
  useEffect(() => {
    if (amountTextRef.current) {
      setCaretLeft(amountTextRef.current.offsetWidth);
    } else {
      setCaretLeft(0);
    }
  }, [amountStr]);

  // Prevent backspace from navigating when on step 2
  // We use a ref to track current amountStr to avoid stale closure issues
  const amountStrRef = useRef(amountStr);
  useEffect(() => {
    amountStrRef.current = amountStr;
  }, [amountStr]);

  useEffect(() => {
    if (!open || step !== 2) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        // Only prevent if amount is empty (to avoid Telegram navigation)
        // Let the input handle backspace when there's content
        if (!amountStrRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, step]);

  // Save last amount when moving to step 3 (confirmation)
  useEffect(() => {
    if (step === 3 && amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        // Convert to SOL if currently in USD
        const solAmount = currency === 'USD' ? amount / SOL_PRICE_USD : amount;
        saveLastAmount(solAmount);
      }
    }
  }, [step, amountStr, currency]);

  // Handle value reporting to parent
  useEffect(() => {
    if (onFormValuesChange) {
      // If USD, convert to SOL for the parent form value
      let finalAmount = amountStr;
      if (currency === 'USD' && amountStr) {
        const usdVal = parseFloat(amountStr);
        if (!isNaN(usdVal)) {
          finalAmount = (usdVal / SOL_PRICE_USD).toFixed(6); // approx conversion
        }
      }
      onFormValuesChange({ amount: finalAmount, recipient });
    }
  }, [amountStr, recipient, currency, onFormValuesChange]);

  // Validation Logic
  useEffect(() => {
    if (!open) {
      onValidationChange?.(false);
      return;
    }

    const recipientTrimmed = recipient.trim();
    const isRecipientValid = isValidSolanaAddress(recipientTrimmed) || isValidTelegramUsername(recipientTrimmed);

    if (step === 1) {
      onValidationChange?.(isRecipientValid);
      return;
    }

    // For steps 2 and 3, check both amount and recipient
    const amount = parseFloat(amountStr);
    const isAmountValid = !isNaN(amount) && amount > 0 && isFinite(amount);

    // Check if amount exceeds balance
    const amountInSol = currency === 'SOL' ? amount : amount / SOL_PRICE_USD;
    const hasEnoughBalance = !isNaN(amountInSol) && amountInSol <= balanceInSol;

    // For step 2, don't check fee method yet
    if (step === 2) {
      const isValid = isAmountValid && isRecipientValid && hasEnoughBalance;
      onValidationChange?.(isValid);
      return;
    }

    // For step 3, also check if selected fee method has sufficient funds
    if (step === 3) {
      const hasEnoughSolForFee = balanceInSol >= amountInSol + SOLANA_FEE_SOL;
      const hasEnoughStarsForFee = starsBalance >= STARS_FEE_AMOUNT;

      const hasSufficientFeeBalance = feePaymentMethod === 'solana'
        ? hasEnoughSolForFee
        : hasEnoughStarsForFee;

      const isValid = isAmountValid && isRecipientValid && hasEnoughBalance && hasSufficientFeeBalance;
      onValidationChange?.(isValid);
      return;
    }

    // Default to invalid for any other state
    onValidationChange?.(false);
  }, [step, amountStr, recipient, open, onValidationChange, currency, balanceInSol, feePaymentMethod, starsBalance]);


  const handleRecipientSelect = (selected: string) => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setRecipient(selected);
    onStepChange(2);
  };

  const handlePresetAmount = (val: number | string) => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    // Ensure we set a clean string value
    const strVal = typeof val === 'string' ? val : val.toString();
    setAmountStr(strVal);
    // Re-focus the input after selecting preset
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 0);
  };

  const modalStyle = useMemo(
    () =>
      ({
        "--tgui--bg_color": "transparent",
        "--tgui--divider": "rgba(255, 255, 255, 0.05)",
      }) as CSSProperties,
    [],
  );

  // Computed display values
  const secondaryDisplay = useMemo(() => {
    const val = parseFloat(amountStr);
    if (isNaN(val)) return currency === 'SOL' ? '≈ $0.00' : '≈ 0.00 SOL';

    if (currency === 'SOL') {
      return `≈ $${(val * SOL_PRICE_USD).toFixed(2)}`;
    } else {
      return `≈ ${(val / SOL_PRICE_USD).toFixed(4)} SOL`;
    }
  }, [amountStr, currency]);

  // Chevron icon component
  const ChevronIcon = () => (
    <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 6L11 12L5.5 18" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // Arrow up/down icon for currency switch
  const ArrowUpDownIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.33 5.25V22.75M9.33 22.75L5.25 18.67M9.33 22.75L13.42 18.67" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.67 22.75V5.25M18.67 5.25L14.58 9.33M18.67 5.25L22.75 9.33" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <Modal
      aria-label="Send assets"
      trigger={trigger || <button style={{ display: 'none' }} />}
      open={open}
      onOpenChange={onOpenChange}
      style={modalStyle}
      snapPoints={[1]}
    >
      {/* Safe area spacer - pointer-events-none allows clicks to pass through to overlay */}
      <div className="shrink-0 pointer-events-none" style={{ height: 64 }} />
      <div
        style={{
          background: "rgba(38, 38, 38, 0.55)",
          backgroundBlendMode: "luminosity",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
        className="flex flex-col text-white relative overflow-hidden min-h-[500px] rounded-t-3xl"
      >
        <Drawer.Title asChild>
          <VisuallyHidden>Send assets</VisuallyHidden>
        </Drawer.Title>

        {/* Custom Header */}
        <div className="relative h-[52px] flex items-center justify-center shrink-0">
          {/* Back Button - only for steps 2 and 3 */}
          {(step === 2 || step === 3) && (
            <button
              onClick={() => {
                if (hapticFeedback.impactOccurred.isAvailable()) {
                  hapticFeedback.impactOccurred("light");
                }
                onStepChange((step - 1) as 1 | 2);
              }}
              className="absolute left-2 p-1.5 text-white/60 hover:text-white rounded-full bg-white/5 active:scale-95 active:bg-white/10 transition-all duration-150"
            >
              <ArrowLeft size={22} strokeWidth={1.5} />
            </button>
          )}

          {/* Title - changes based on step */}
          {step === 1 && (
            <span className="text-base font-medium text-white tracking-[-0.176px]">
              Send to
            </span>
          )}

          {/* Recipient Pill for Step 2 */}
          {step === 2 && (
            <div
              className="flex items-center pl-1 pr-3 py-1 rounded-[54px]"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                mixBlendMode: "lighten",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div className="pr-1.5">
                {recipient.startsWith('@') ? (
                  /* Avatar for username */
                  <div className="w-7 h-7 rounded-full overflow-hidden relative">
                    <Image
                      src="https://avatars.githubusercontent.com/u/537414?v=4"
                      alt="Recipient"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  /* Wallet icon for address */
                  <div className="w-7 h-7 rounded-[16.8px] flex items-center justify-center text-white">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                      <path d="M15.8333 5.83333V3.33333C15.8333 3.11232 15.7455 2.90036 15.5893 2.74408C15.433 2.5878 15.221 2.5 15 2.5H4.16667C3.72464 2.5 3.30072 2.67559 2.98816 2.98816C2.67559 3.30072 2.5 3.72464 2.5 4.16667C2.5 4.60869 2.67559 5.03262 2.98816 5.34518C3.30072 5.65774 3.72464 5.83333 4.16667 5.83333H16.6667C16.8877 5.83333 17.0996 5.92113 17.2559 6.07741C17.4122 6.23369 17.5 6.44565 17.5 6.66667V10M17.5 10H15C14.558 10 14.1341 10.1756 13.8215 10.4882C13.5089 10.8007 13.3333 11.2246 13.3333 11.6667C13.3333 12.1087 13.5089 12.5326 13.8215 12.8452C14.1341 13.1577 14.558 13.3333 15 13.3333H17.5C17.721 13.3333 17.933 13.2455 18.0893 13.0893C18.2455 12.933 18.3333 12.721 18.3333 12.5V10.8333C18.3333 10.6123 18.2455 10.4004 18.0893 10.2441C17.933 10.0878 17.721 10 17.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.5 4.16656V15.8332C2.5 16.2753 2.67559 16.6992 2.98816 17.0117C3.30072 17.3243 3.72464 17.4999 4.16667 17.4999H16.6667C16.8877 17.4999 17.0996 17.4121 17.2559 17.2558C17.4122 17.0995 17.5 16.8876 17.5 16.6666V13.3332" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-sm leading-5">
                <span className="text-white/60">Send to </span>
                <span className="text-white">{recipient.startsWith('@') ? recipient : `${recipient.slice(0, 4)}…${recipient.slice(-4)}`}</span>
              </span>
            </div>
          )}

          {/* Recipient Pill for Step 3 and 4 */}
          {(step === 3 || step === 4) && (
            <div
              className="flex items-center pl-1 pr-3 py-1 rounded-[54px]"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                mixBlendMode: "lighten",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div className="pr-1.5">
                {recipient.startsWith('@') ? (
                  /* Avatar for username */
                  <div className="w-7 h-7 rounded-full overflow-hidden relative">
                    <Image
                      src="https://avatars.githubusercontent.com/u/537414?v=4"
                      alt="Recipient"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  /* Wallet icon for address */
                  <div className="w-7 h-7 rounded-[16.8px] flex items-center justify-center text-white">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                      <path d="M15.8333 5.83333V3.33333C15.8333 3.11232 15.7455 2.90036 15.5893 2.74408C15.433 2.5878 15.221 2.5 15 2.5H4.16667C3.72464 2.5 3.30072 2.67559 2.98816 2.98816C2.67559 3.30072 2.5 3.72464 2.5 4.16667C2.5 4.60869 2.67559 5.03262 2.98816 5.34518C3.30072 5.65774 3.72464 5.83333 4.16667 5.83333H16.6667C16.8877 5.83333 17.0996 5.92113 17.2559 6.07741C17.4122 6.23369 17.5 6.44565 17.5 6.66667V10M17.5 10H15C14.558 10 14.1341 10.1756 13.8215 10.4882C13.5089 10.8007 13.3333 11.2246 13.3333 11.6667C13.3333 12.1087 13.5089 12.5326 13.8215 12.8452C14.1341 13.1577 14.558 13.3333 15 13.3333H17.5C17.721 13.3333 17.933 13.2455 18.0893 13.0893C18.2455 12.933 18.3333 12.721 18.3333 12.5V10.8333C18.3333 10.6123 18.2455 10.4004 18.0893 10.2441C17.933 10.0878 17.721 10 17.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.5 4.16656V15.8332C2.5 16.2753 2.67559 16.6992 2.98816 17.0117C3.30072 17.3243 3.72464 17.4999 4.16667 17.4999H16.6667C16.8877 17.4999 17.0996 17.4121 17.2559 17.2558C17.4122 17.0995 17.5 16.8876 17.5 16.6666V13.3332" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-sm leading-5">
                <span className="text-white/60">{step === 4 ? "Sent to " : "Send to "}</span>
                <span className="text-white">{recipient.startsWith('@') ? recipient : `${recipient.slice(0, 4)}…${recipient.slice(-4)}`}</span>
              </span>
            </div>
          )}

          {/* Close Button */}
          <Modal.Close>
            <div
              onClick={() => {
                if (hapticFeedback.impactOccurred.isAvailable()) {
                  hapticFeedback.impactOccurred("light");
                }
              }}
              className="absolute right-2 p-1.5 rounded-full flex items-center justify-center active:scale-95 active:bg-white/10 transition-all duration-150 cursor-pointer"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
              }}
            >
              <X size={24} strokeWidth={1.5} className="text-white/60" />
            </div>
          </Modal.Close>
        </div>

        {/* Steps Container with Slide Animation */}
        <div className="relative flex-1 overflow-hidden">
          {/* STEP 1: RECIPIENT */}
          <div
            className="absolute inset-0 flex flex-col overflow-y-auto transition-all duration-300 ease-out"
            style={{
              transform: `translateX(${(1 - step) * 100}%)`,
              opacity: step === 1 ? 1 : 0,
              pointerEvents: step === 1 ? 'auto' : 'none'
            }}
          >
            {/* Search Input */}
            <div className="px-4 pt-2 pb-2">
              <div className="flex flex-col gap-2">
                <div
                  className="flex items-center rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div className="pl-3 pr-3 py-3 flex items-center justify-center">
                    <Search size={24} strokeWidth={1.5} className="text-white/40" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Address or @username"
                    value={recipient}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[a-zA-Z0-9@._]*$/.test(val)) {
                        setRecipient(val);
                      }
                    }}
                    className="flex-1 py-3.5 pr-3 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
                {/* Validation Error */}
                {recipient.trim().length > 0 && !isValidSolanaAddress(recipient) && !isValidTelegramUsername(recipient) && (
                  <p className="text-[13px] text-red-400 leading-4 px-1">Invalid address</p>
                )}
              </div>
            </div>

            {/* Recent Section Header */}
            <div className="px-4 pt-3 pb-2">
              <p className="text-base font-medium text-white tracking-[-0.176px]">Recent</p>
            </div>

            {/* Contact List */}
            <div className="pb-4">
              {/* Contact Items */}
              {MOCK_CONTACTS.map((contact) => (
                <button
                  key={contact.username}
                  onClick={() => handleRecipientSelect(contact.username)}
                  className="w-full flex items-center px-3 py-1 rounded-2xl active:bg-white/[0.03] transition-colors"
                >
                  <div className="py-1.5 pr-3">
                    {contact.avatar ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden relative">
                        <Image
                          src={contact.avatar}
                          alt={contact.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg"
                        style={{ background: getAvatarColor(contact.name) }}
                      >
                        {getInitials(contact.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 py-2.5">
                    <p className="text-base text-white text-left leading-5">{contact.name}</p>
                    <p className="text-[13px] text-white/60 text-left leading-4">{contact.username}</p>
                  </div>
                  <div className="pl-3 py-2 flex items-center justify-center h-10">
                    <ChevronIcon />
                  </div>
                </button>
              ))}

              {/* Manual Entry - Show when typing a valid address/username */}
              {recipient.trim().length > 0 && (isValidSolanaAddress(recipient) || isValidTelegramUsername(recipient)) && (
                <button
                  onClick={() => handleRecipientSelect(recipient)}
                  className="w-full flex items-center px-3 py-1 rounded-2xl active:bg-white/[0.03] transition-colors"
                >
                  <div className="py-1.5 pr-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(99, 102, 241, 0.2)",
                      }}
                    >
                      <Wallet size={24} strokeWidth={1.5} className="text-indigo-400" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 py-2.5">
                    <p className="text-base text-white text-left leading-5">Send to address</p>
                    <p className="text-[13px] text-white/60 text-left leading-4 truncate max-w-[200px]">{recipient}</p>
                  </div>
                  <div className="pl-3 py-2 flex items-center justify-center h-10">
                    <ChevronIcon />
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* STEP 2: AMOUNT */}
          <div
            className="absolute inset-0 flex flex-col transition-all duration-300 ease-out"
            style={{
              transform: `translateX(${(2 - step) * 100}%)`,
              opacity: step === 2 ? 1 : 0,
              pointerEvents: step === 2 ? 'auto' : 'none'
            }}
            onKeyDownCapture={(e) => {
              // Capture backspace at container level to prevent Telegram navigation
              if (e.key === 'Backspace') {
                e.stopPropagation();
                if (!amountStr) {
                  e.preventDefault();
                }
              }
            }}
          >
            {/* Content Area */}
            <div className="flex-1 flex flex-col px-4 pt-2 pb-4 gap-2.5 overflow-hidden">
              {/* Amount Input Section */}
              <div className="px-2 flex flex-col gap-1 relative">
                {/* Hidden input for keyboard - positioned to cover the area */}
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  value={amountStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                      if (val.includes('.')) {
                        const [, decimals] = val.split('.');
                        if (decimals && decimals.length > (currency === 'SOL' ? 4 : 2)) {
                          return;
                        }
                      }
                      setAmountStr(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent backspace from triggering navigation
                    if (e.key === 'Backspace') {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      // Only prevent default if input is empty to avoid going back
                      if (!amountStr) {
                        e.preventDefault();
                      }
                    }
                  }}
                  className="absolute inset-0 opacity-0 z-10 cursor-text"
                  autoComplete="off"
                />
                {/* Amount Input Row with Switch Button */}
                <div className="flex gap-1 items-end h-[48px]">
                  {/* Amount Input with Currency */}
                  <div className="flex-1 flex gap-2 items-baseline relative">
                    <p
                      ref={amountTextRef}
                      className="text-[40px] font-semibold leading-[48px] text-white"
                    >
                      {amountStr || '\u200B'}
                    </p>
                    <p className="text-[28px] font-semibold leading-8 text-white/40 tracking-[0.4px]">
                      {currency}
                    </p>
                    {/* Caret - positioned after the number, vertically centered */}
                    <div
                      className="absolute w-[1.5px] h-[44px] bg-white top-1/2 -translate-y-1/2"
                      style={{
                        left: `${caretLeft}px`,
                        animation: 'blink 1s step-end infinite'
                      }}
                    />
                  </div>
                  {/* Currency Switch Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hapticFeedback.selectionChanged.isAvailable()) {
                        hapticFeedback.selectionChanged();
                      }
                      // Convert the amount when switching
                      if (amountStr) {
                        const val = parseFloat(amountStr);
                        if (!isNaN(val)) {
                          if (currency === 'SOL') {
                            setAmountStr((val * SOL_PRICE_USD).toFixed(2));
                          } else {
                            setAmountStr((val / SOL_PRICE_USD).toFixed(4));
                          }
                        }
                      }
                      setCurrency(currency === 'SOL' ? 'USD' : 'SOL');
                      // Refocus input after switching
                      setTimeout(() => {
                        amountInputRef.current?.focus();
                      }, 0);
                    }}
                    className="z-20 opacity-40 hover:opacity-60 transition-opacity text-white shrink-0 mb-1"
                  >
                    <ArrowUpDownIcon />
                  </button>
                </div>
                {/* USD Conversion */}
                <p className="text-base leading-5 text-white/40 h-[22px]">
                  {secondaryDisplay.replace('≈ ', '~')}
                </p>
                {/* Insufficient balance error */}
                {(() => {
                  const val = parseFloat(amountStr);
                  if (isNaN(val) || val <= 0) return null;
                  const amountInSol = currency === 'SOL' ? val : val / SOL_PRICE_USD;
                  if (amountInSol > balanceInSol) {
                    return <p className="text-[13px] text-red-400 leading-4 px-1">Insufficient balance</p>;
                  }
                  return null;
                })()}
                {/* Blink animation style */}
                <style jsx>{`
                  @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                  }
                `}</style>
              </div>

              {/* Quick Amount Presets */}
              <div className="flex gap-2 w-full">
                {/* Last used amount (first position) */}
                {lastAmount && (
                  <button
                    onClick={() => handlePresetAmount(lastAmount.sol)}
                    className="flex-1 min-w-[64px] px-4 py-2 rounded-[40px] text-sm font-normal leading-5 text-white text-center transition-all active:opacity-70"
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      mixBlendMode: "lighten",
                    }}
                  >
                    {lastAmount.sol}
                  </button>
                )}
                {[0.1, 1].map(val => (
                  <button
                    key={val}
                    onClick={() => handlePresetAmount(val)}
                    className="flex-1 min-w-[64px] px-4 py-2 rounded-[40px] text-sm font-normal leading-5 text-white text-center transition-all active:opacity-70"
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      mixBlendMode: "lighten",
                    }}
                  >
                    {val}
                  </button>
                ))}
                <button
                  onClick={() => {
                    // Format based on current currency
                    if (currency === 'SOL') {
                      const maxVal = balanceInSol.toFixed(4).replace(/\.?0+$/, '');
                      handlePresetAmount(maxVal || '0');
                    } else {
                      const maxVal = balanceInUsd.toFixed(2).replace(/\.?0+$/, '');
                      handlePresetAmount(maxVal || '0');
                    }
                  }}
                  className="flex-1 min-w-[64px] px-4 py-2 rounded-[40px] text-sm font-normal leading-5 text-white text-center transition-all active:opacity-70"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    mixBlendMode: "lighten",
                  }}
                >
                  Max
                </button>
              </div>

              {/* Balance Card */}
              <div
                className="flex items-center pl-3 pr-4 py-1 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  mixBlendMode: "lighten",
                }}
              >
                {/* Left: Solana Icon */}
                <div className="py-1.5 pr-3">
                  <div className="w-12 h-12 overflow-hidden flex items-center justify-center">
                    <Image
                      src="/icons/solana.svg"
                      alt="Solana"
                      width={48}
                      height={48}
                    />
                  </div>
                </div>
                {/* Middle: Balance label + wallet address */}
                <div className="flex-1 flex flex-col gap-0.5 py-2.5">
                  <p className="text-base leading-5 text-white">Balance</p>
                  <p className="text-[13px] leading-4 text-white/60">{abbreviatedAddress}</p>
                </div>
                {/* Right: Balance amount + USD */}
                <div className="flex flex-col gap-0.5 items-end py-2.5 pl-3">
                  <p className="text-base leading-5 text-white text-right">{balanceInSol.toFixed(2)} SOL</p>
                  <p className="text-[13px] leading-4 text-white/60 text-right">~${balanceInUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

          </div>

          {/* STEP 3: CONFIRMATION */}
          <div
            className="absolute inset-0 flex flex-col transition-all duration-300 ease-out"
            style={{
              transform: `translateX(${(3 - step) * 100}%)`,
              opacity: step === 3 ? 1 : 0,
              pointerEvents: step === 3 ? 'auto' : 'none'
            }}
          >
            {/* Amount Display Section (same layout as Step 2, but read-only) */}
            <div className="px-4 pt-2 pb-4">
              <div className="px-2 flex flex-col gap-1">
                {/* Amount Display */}
                <div className="flex gap-2 items-baseline h-[48px]">
                  <p className="text-[40px] font-semibold leading-[48px] text-white">
                    {(() => {
                      // Convert to SOL for display if needed
                      const val = parseFloat(amountStr);
                      if (isNaN(val)) return '0';
                      if (currency === 'USD') {
                        return (val / SOL_PRICE_USD).toFixed(4).replace(/\.?0+$/, '') || '0';
                      }
                      return amountStr || '0';
                    })()}
                  </p>
                  <p className="text-[28px] font-semibold leading-8 text-white/40 tracking-[0.4px]">
                    SOL
                  </p>
                </div>
                {/* USD Conversion */}
                <p className="text-base leading-[22px] text-white/40">
                  {(() => {
                    const val = parseFloat(amountStr);
                    if (isNaN(val)) return '≈$0.00';
                    const usdVal = currency === 'SOL' ? val * SOL_PRICE_USD : val;
                    return `≈$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  })()}
                </p>
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="flex flex-col w-full">
              {/* Transfer Fee Header */}
              <div className="px-4 pt-3 pb-2">
                <p className="text-base font-medium text-white tracking-[-0.176px]">Transfer fee</p>
              </div>

              {/* Cards */}
              <div className="px-4 flex flex-col gap-2">
                {/* Transfer Fee Section */}
                {(() => {
                  // Calculate if user has enough balance for selected fee method
                  const amountVal = parseFloat(amountStr);
                  const amountInSol = isNaN(amountVal) ? 0 : (currency === 'SOL' ? amountVal : amountVal / SOL_PRICE_USD);
                  const hasEnoughSolForFee = balanceInSol >= amountInSol + SOLANA_FEE_SOL;
                  const hasEnoughStarsForFee = starsBalance >= STARS_FEE_AMOUNT;

                  // Check circle icons
                  const CheckCircleOn = () => (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="12" fill="#3F89F7"/>
                      <path d="M6.5 12.5L10 16L17.5 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  );
                  const CheckCircleOff = () => (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 0C18.6289 0 24 5.37258 24 12C24 18.6289 18.6274 24 12 24C5.37113 24 0 18.6274 0 12C0 5.37113 5.37258 0 12 0ZM12 1.5C6.20044 1.5 1.5 6.20005 1.5 12C1.5 17.7996 6.20005 22.5 12 22.5C17.7996 22.5 22.5 17.8 22.5 12C22.5 6.20044 17.8 1.5 12 1.5Z" fill="white" fillOpacity="0.1"/>
                    </svg>
                  );

                  return (
                    <div
                      className="flex flex-col py-1 rounded-2xl"
                      style={{
                        background: "rgba(255, 255, 255, 0.06)",
                        mixBlendMode: "lighten",
                      }}
                    >
                      {/* Stars Row */}
                      <div className="flex items-center pl-3 pr-4">
                        {/* Clickable area for selection (dimmed when insufficient) */}
                        <button
                          onClick={() => {
                            if (hasEnoughStarsForFee) {
                              if (hapticFeedback.selectionChanged.isAvailable()) {
                                hapticFeedback.selectionChanged();
                              }
                              setFeePaymentMethod('stars');
                            }
                          }}
                          disabled={!hasEnoughStarsForFee}
                          className={`flex items-center flex-1 transition-opacity ${
                            !hasEnoughStarsForFee ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                        >
                          {/* Icon */}
                          <div className="pr-3 py-1">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ background: "rgba(255, 255, 255, 0.06)", mixBlendMode: "lighten" }}
                            >
                              <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M9.53309 15.7592L5.59486 18.1718C5.18536 18.4226 4.65002 18.294 4.39917 17.8845C4.27664 17.6845 4.24012 17.4435 4.29786 17.2162L4.9075 14.8167C5.12757 13.9504 5.72031 13.2264 6.52598 12.8396L10.8224 10.7768C11.0227 10.6806 11.1071 10.4403 11.0109 10.24C10.9331 10.0778 10.7569 9.98698 10.5796 10.0177L5.79718 10.8456C4.82501 11.0139 3.82807 10.7455 3.07187 10.1118L1.56105 8.84567C1.19298 8.53721 1.14465 7.98877 1.4531 7.62071C1.60313 7.44168 1.81886 7.33054 2.05172 7.31232L6.66772 6.95107C6.99383 6.92555 7.27802 6.71918 7.40322 6.41698L9.18399 2.11831C9.36778 1.67464 9.87644 1.46397 10.3201 1.64776C10.5331 1.73602 10.7024 1.90528 10.7907 2.11831L12.5714 6.41698C12.6966 6.71918 12.9808 6.92555 13.3069 6.95107L17.9483 7.31431C18.4271 7.35177 18.7848 7.77027 18.7473 8.24904C18.7293 8.47935 18.6203 8.69303 18.4446 8.84291L14.9049 11.8606C14.6555 12.0731 14.5469 12.4075 14.6235 12.7259L15.7117 17.2466C15.8241 17.7136 15.5367 18.1831 15.0699 18.2955C14.8455 18.3496 14.6089 18.3121 14.4121 18.1916L10.4416 15.7592C10.1628 15.5885 9.81183 15.5885 9.53309 15.7592Z" fill="white"/>
                              </svg>
                            </div>
                          </div>
                          {/* Text */}
                          <div className="flex-1 flex flex-col gap-0.5 py-2.5 text-left">
                            <p className="text-base leading-5 text-white">{STARS_FEE_AMOUNT} Stars</p>
                            <p className="text-[13px] leading-4 text-white/60">
                              {hasEnoughStarsForFee ? `≈ $${(STARS_FEE_AMOUNT * STARS_TO_USD).toFixed(2)}` : 'Not enough Stars'}
                            </p>
                          </div>
                        </button>
                        {/* Top up button (shown when not enough stars) - outside dimmed area */}
                        {!hasEnoughStarsForFee && onTopUpStars && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hapticFeedback.impactOccurred.isAvailable()) {
                                hapticFeedback.impactOccurred("light");
                              }
                              onTopUpStars();
                            }}
                            className="px-3 py-1.5 rounded-full text-sm text-white leading-5 active:opacity-80 transition-opacity mr-3"
                            style={{
                              background: "linear-gradient(90deg, rgba(50, 229, 94, 0.15) 0%, rgba(50, 229, 94, 0.15) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)"
                            }}
                          >
                            Top up
                          </button>
                        )}
                        {/* Check - also dimmed when insufficient */}
                        <div className={`pl-4 py-1.5 shrink-0 ${!hasEnoughStarsForFee ? 'opacity-40' : ''}`}>
                          {feePaymentMethod === 'stars' && hasEnoughStarsForFee ? <CheckCircleOn /> : <CheckCircleOff />}
                        </div>
                      </div>

                      {/* SOL Row */}
                      <button
                        onClick={() => {
                          if (hapticFeedback.selectionChanged.isAvailable()) {
                            hapticFeedback.selectionChanged();
                          }
                          setFeePaymentMethod('solana');
                        }}
                        className="flex items-center pl-3 pr-4"
                      >
                        {/* Icon */}
                        <div className="pr-3 py-1">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(255, 255, 255, 0.06)", mixBlendMode: "lighten" }}
                          >
                            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M15.701 6.35782C15.601 6.44906 15.471 6.50032 15.3356 6.50184H2.51488C2.05973 6.50184 1.83037 5.98179 2.14507 5.67687L4.25105 3.64735C4.34876 3.55223 4.47918 3.49815 4.61553 3.49622H17.4852C17.9448 3.49622 18.1697 4.0216 17.8497 4.32741L15.701 6.35782ZM15.701 16.3632C15.6004 16.4528 15.4704 16.5025 15.3356 16.5028H2.51488C2.05973 16.5028 1.83037 15.9872 2.14507 15.6831L4.25105 13.6474C4.34973 13.5546 4.48004 13.5028 4.61553 13.5025H17.4852C17.9448 13.5025 18.1697 14.0225 17.8497 14.3275L15.701 16.3632ZM15.701 8.64159C15.6004 8.55197 15.4704 8.50232 15.3356 8.50202H2.51488C2.05973 8.50202 1.83037 9.01763 2.14507 9.32166L4.25105 11.3574C4.34973 11.4502 4.48004 11.5021 4.61553 11.5023H17.4852C17.9448 11.5023 18.1697 10.9823 17.8497 10.6773L15.701 8.64159Z" fill="white"/>
                            </svg>
                          </div>
                        </div>
                        {/* Text */}
                        <div className="flex-1 flex flex-col gap-0.5 py-2.5 text-left">
                          <p className="text-base leading-5 text-white">{SOLANA_FEE_SOL} SOL</p>
                          <p className="text-[13px] leading-4 text-white/60">≈ ${SOLANA_FEE_USD.toFixed(2)}</p>
                        </div>
                        {/* Check */}
                        <div className="pl-4 py-1.5 shrink-0">
                          {feePaymentMethod === 'solana' ? <CheckCircleOn /> : <CheckCircleOff />}
                        </div>
                      </button>
                    </div>
                  );
                })()}

                {/* Total Amount Card */}
                <div
                  className="flex items-center pl-3 pr-4 py-1 rounded-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    mixBlendMode: "lighten",
                  }}
                >
                  <div className="flex-1 flex flex-col gap-0.5 py-2.5">
                    <p className="text-[13px] leading-4 text-white/60">Total amount</p>
                    <div className="flex items-baseline text-base leading-5">
                      <span className="text-white">
                        {(() => {
                          const val = parseFloat(amountStr);
                          if (isNaN(val)) {
                            return feePaymentMethod === 'solana' ? `${SOLANA_FEE_SOL} SOL` : '0 SOL';
                          }
                          const solVal = currency === 'SOL' ? val : val / SOL_PRICE_USD;
                          // Only add SOL fee if paying with Solana
                          const total = feePaymentMethod === 'solana' ? solVal + SOLANA_FEE_SOL : solVal;
                          return `${total.toFixed(6).replace(/\.?0+$/, '')} SOL`;
                        })()}
                      </span>
                      <span className="text-white/60">
                        {(() => {
                          const val = parseFloat(amountStr);
                          if (isNaN(val)) {
                            return feePaymentMethod === 'solana' ? ` ≈ $${SOLANA_FEE_USD.toFixed(2)}` : ' ≈ $0.00';
                          }
                          const usdVal = currency === 'SOL' ? val * SOL_PRICE_USD : val;
                          // Only add USD fee equivalent if paying with Solana
                          const totalUsd = feePaymentMethod === 'solana' ? usdVal + SOLANA_FEE_USD : usdVal;
                          return ` ≈ $${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        })()}
                      </span>
                      {feePaymentMethod === 'stars' && (
                        <span className="text-white/60">&nbsp;+ {STARS_FEE_AMOUNT} Star</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: SUCCESS or ERROR */}
          <div
            className="absolute inset-0 flex flex-col transition-all duration-300 ease-out"
            style={{
              transform: `translateX(${(4 - step) * 100}%)`,
              opacity: step === 4 ? 1 : 0,
              pointerEvents: step === 4 ? 'auto' : 'none'
            }}
          >
            {sendError ? (
              /* Error Content */
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
                {/* Animated Error Icon */}
                <div className="relative mb-5">
                  <div
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                    style={{
                      background: "#FF4D4D",
                      animation: step === 4 ? "result-pulse 0.6s ease-out" : "none"
                    }}
                  >
                    <ShieldAlert
                      className="text-white"
                      size={40}
                      strokeWidth={2}
                      style={{
                        animation: step === 4 ? "result-icon 0.4s ease-out 0.2s both" : "none"
                      }}
                    />
                  </div>
                </div>

                {/* Error Text */}
                <div className="flex flex-col gap-3 items-center text-center max-w-[280px]">
                  <h2 className="text-2xl font-semibold text-white leading-7">
                    Transaction failed
                  </h2>
                  <p className="text-base leading-5 text-white/60">
                    {sendError}
                  </p>
                </div>
              </div>
            ) : (
              /* Success Content */
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
                {/* Animated Success Icon */}
                <div className="relative mb-5">
                  <div
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                    style={{
                      background: "#2990ff",
                      animation: step === 4 ? "result-pulse 0.6s ease-out" : "none"
                    }}
                  >
                    <Check
                      className="text-white"
                      size={40}
                      strokeWidth={2.5}
                      style={{
                        animation: step === 4 ? "result-icon 0.4s ease-out 0.2s both" : "none"
                      }}
                    />
                  </div>
                </div>

                {/* Success Text */}
                <div className="flex flex-col gap-3 items-center text-center max-w-[280px]">
                  <h2 className="text-2xl font-semibold text-white leading-7">
                    SOL sent
                  </h2>
                  <p className="text-base leading-5 text-white/60">
                    <span className="text-white">
                      {sentAmountSol?.toFixed(4).replace(/\.?0+$/, '') || '0'} SOL
                    </span>
                    {" "}successfully sent to{" "}
                    <span className="text-white">
                      {recipient.startsWith('@') ? recipient : `${recipient.slice(0, 4)}…${recipient.slice(-4)}`}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Animation keyframes */}
            <style jsx>{`
              @keyframes result-pulse {
                0% {
                  transform: scale(0);
                  opacity: 0;
                }
                50% {
                  transform: scale(1.1);
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }
              @keyframes result-icon {
                0% {
                  transform: scale(0) rotate(-45deg);
                  opacity: 0;
                }
                100% {
                  transform: scale(1) rotate(0deg);
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </Modal>
  );
}
