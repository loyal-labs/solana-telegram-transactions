"use client";

import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import {
  ArrowLeft,
  Plus,
  Search,
  Send,
  User,
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
  step: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
  balance?: number | null; // Balance in lamports
  walletAddress?: string;
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
  { name: "Alice", username: "@alice_wonderland", avatar: "https://avatars.githubusercontent.com/u/537414?v=4" },
  { name: "Arthur", username: "@arthur_morgan", avatar: "https://avatars.githubusercontent.com/u/537414?v=4" },
  { name: "Bob", username: "@bob_builder", avatar: null },
  { name: "Carol", username: "@carol_danvers", avatar: null },
];

const SOL_PRICE_USD = 180;
const LAST_AMOUNT_KEY = 'lastSendAmount';
const LAMPORTS_PER_SOL = 1_000_000_000;

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
    const isValid = isAmountValid && isRecipientValid;

    if (step === 2 || step === 3) {
      onValidationChange?.(isValid);
      return;
    }

    // Default to invalid for any other state
    onValidationChange?.(false);
  }, [step, amountStr, recipient, open, onValidationChange]);


  const handleRecipientSelect = (selected: string) => {
    setRecipient(selected);
    onStepChange(2);
  };

  const handlePresetAmount = (val: number | string) => {
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
      <div
        style={{
          background: "rgba(38, 38, 38, 0.70)",
          backdropFilter: "blur(56px)",
          WebkitBackdropFilter: "blur(56px)",
        }}
        className="flex flex-col text-white relative overflow-hidden min-h-[500px] rounded-t-3xl"
      >
        <Drawer.Title asChild>
          <VisuallyHidden>Send assets</VisuallyHidden>
        </Drawer.Title>

        {/* Custom Header */}
        <div className="relative h-[52px] flex items-center justify-center shrink-0">
          {/* Drag Indicator */}
          <div
            className="absolute top-1 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full"
            style={{ background: "rgba(255, 255, 255, 0.1)" }}
          />

          {/* Back Button */}
          {step > 1 && (
            <button
              onClick={() => onStepChange((step - 1) as 1 | 2)}
              className="absolute left-2 p-1.5 text-white/60 hover:text-white transition-colors rounded-full bg-white/5 active:scale-95"
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
              }}
            >
              <div className="pr-1.5">
                <div className="w-7 h-7 rounded-full overflow-hidden relative">
                  <Image
                    src="https://avatars.githubusercontent.com/u/537414?v=4"
                    alt="Recipient"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <span className="text-sm leading-5">
                <span className="text-white/60">Send to </span>
                <span className="text-white">{recipient.startsWith('@') ? recipient : `${recipient.slice(0, 4)}...${recipient.slice(-4)}`}</span>
              </span>
            </div>
          )}

          {step === 3 && (
            <span className="text-base font-medium text-white tracking-[-0.176px]">
              Review
            </span>
          )}

          {/* Close Button */}
          <Modal.Close>
            <div
              className="absolute right-2 p-1.5 rounded-full flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
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
                {/* Validation Error - always reserve space to prevent layout shift */}
                <div className="h-4 px-1">
                  {recipient.trim().length > 0 && !isValidSolanaAddress(recipient) && !isValidTelegramUsername(recipient) && (
                    <p className="text-[13px] text-red-400 leading-4">Invalid address</p>
                  )}
                </div>
              </div>
            </div>

            {/* Suggested Section Header */}
            <div className="px-4 pt-3 pb-2">
              <p className="text-base font-medium text-white tracking-[-0.176px]">Suggested</p>
            </div>

            {/* Contact List */}
            <div className="pb-4">
              {/* Choose Contact Button */}
              <button
                onClick={() => {
                  // TODO: Implement contact picker
                  console.log("Choose contact clicked");
                }}
                className="w-full flex items-center px-3 py-1 rounded-2xl active:bg-white/[0.03] transition-colors"
              >
                <div className="py-1.5 pr-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      mixBlendMode: "lighten"
                    }}
                  >
                    <Plus size={28} strokeWidth={1.5} className="text-white/60" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-0.5 py-2.5">
                  <p className="text-base text-white text-left leading-5">Choose contact</p>
                  <p className="text-[13px] text-white/60 text-left leading-4">from Telegram</p>
                </div>
                <div className="pl-3 py-2 flex items-center justify-center h-10">
                  <ChevronIcon />
                </div>
              </button>

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
            className="absolute inset-0 flex flex-col p-6 items-center overflow-y-auto transition-all duration-300 ease-out"
            style={{
              transform: `translateX(${(3 - step) * 100}%)`,
              opacity: step === 3 ? 1 : 0,
              pointerEvents: step === 3 ? 'auto' : 'none'
            }}
          >
                {/* No additional background - uses parent gradient */}

                <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-5">
                        <Send size={22} className="text-teal-400" strokeWidth={2} />
                    </div>

                    <h2 className="text-xl font-semibold text-white mb-1.5 tracking-tight">Review Transaction</h2>
                    <p className="text-zinc-500 text-center mb-8 text-sm max-w-[240px]">
                        Confirm the details below
                    </p>

                    <div className="w-full max-w-sm">
                        <div
                          style={{
                            background: "rgba(0, 0, 0, 0.15)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                          className="rounded-xl p-5 space-y-4 relative overflow-hidden"
                        >
                            {/* Subtle top shine */}
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

                            {/* Recipient Row */}
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-600 text-sm">To</span>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-white/90 font-mono text-sm truncate max-w-[180px]">{recipient}</span>
                                    <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.04] flex items-center justify-center shrink-0">
                                        {recipient.startsWith('@') ? <User size={12} className="text-zinc-500" /> : <Wallet size={12} className="text-zinc-500" />}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-white/[0.04]" />

                            {/* Amount Row */}
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-600 text-sm">Amount</span>
                                <div className="text-right">
                                    <div className="text-white font-semibold text-base">{amountStr} {currency}</div>
                                    <div className="text-xs text-zinc-600">{secondaryDisplay}</div>
                                </div>
                            </div>

                            <div className="h-px bg-white/[0.04]" />

                            {/* Fee Row */}
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-600 text-sm">Fee</span>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/[0.08]">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                    <span className="text-emerald-400/90 text-xs font-semibold uppercase tracking-wide">Free</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 mb-4 w-full">
                     <div className="flex items-center justify-center gap-2 opacity-50">
                         <div className="w-1 h-1 rounded-full bg-indigo-500" />
                         <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-[0.15em]">Solana Devnet</span>
                     </div>
                </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
