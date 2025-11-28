"use client";

import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import {
  ArrowLeft,
  Delete,
  Plus,
  RefreshCw,
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
}: SendSheetProps) {
  const [amountStr, setAmountStr] = useState("");
  const [recipient, setRecipient] = useState("");
  const [currency, setCurrency] = useState<'SOL' | 'USD'>('SOL');
  const [lastAmount, setLastAmount] = useState<LastAmount | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setAmountStr("");
      setRecipient(initialRecipient || "");
      setCurrency('SOL');
      setLastAmount(getLastAmount());
    }
  }, [open, initialRecipient]);

  // Auto-focus input on step 1
  useEffect(() => {
    if (open && step === 1) {
      // Delay to allow modal animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
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

  const handleNumpadPress = (value: string) => {
    if (value === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr(prev => (prev || '0') + '.');
      }
    } else if (value === 'delete') {
      setAmountStr(prev => prev.slice(0, -1));
    } else {
      // Prevent too many decimals
      if (amountStr.includes('.') && amountStr.split('.')[1].length >= (currency === 'SOL' ? 4 : 2)) {
        return;
      }
      setAmountStr(prev => prev + value);
    }
  };

  const handlePresetAmount = (val: number) => {
    setAmountStr(val.toString());
  };

  const toggleCurrency = () => {
    const currentVal = parseFloat(amountStr);
    if (isNaN(currentVal)) {
      setCurrency(prev => prev === 'SOL' ? 'USD' : 'SOL');
      return;
    }

    if (currency === 'SOL') {
      // SOL to USD
      setAmountStr((currentVal * SOL_PRICE_USD).toFixed(2));
      setCurrency('USD');
    } else {
      // USD to SOL
      setAmountStr((currentVal / SOL_PRICE_USD).toFixed(4));
      setCurrency('SOL');
    }
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
  const displayAmount = amountStr || "0";
  const secondaryDisplay = useMemo(() => {
    const val = parseFloat(amountStr);
    if (isNaN(val)) return currency === 'SOL' ? '≈ $0.00' : '≈ 0.00 SOL';

    if (currency === 'SOL') {
      return `≈ $${(val * SOL_PRICE_USD).toFixed(2)}`;
    } else {
      return `≈ ${(val / SOL_PRICE_USD).toFixed(4)} SOL`;
    }
  }, [amountStr, currency]);

  // Recipient info for Step 2 and 3 - flat/non-interactive display
  const RecipientInfo = () => (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.15)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-auto max-w-full"
    >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/70 to-purple-600/70 flex items-center justify-center shrink-0">
             {recipient.startsWith('@') ? <User size={14} className="text-white" /> : <Wallet size={14} className="text-white" />}
        </div>
        <span className="text-sm text-zinc-300 font-medium truncate max-w-[200px] font-mono tracking-tight">{recipient}</span>
    </div>
  );

  // Chevron icon component
  const ChevronIcon = () => (
    <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 6L11 12L5.5 18" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
              className="absolute left-2 p-1.5 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5 active:scale-95"
            >
              <ArrowLeft size={22} strokeWidth={1.5} />
            </button>
          )}

          {/* Title */}
          <span className="text-base font-medium text-white tracking-[-0.176px]">
            {step === 1 ? "Send to" : step === 2 ? "Amount" : "Review"}
          </span>

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
                    placeholder="Adress or @username"
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
            className="absolute inset-0 flex flex-col overflow-y-auto transition-all duration-300 ease-out"
            style={{
              transform: `translateX(${(2 - step) * 100}%)`,
              opacity: step === 2 ? 1 : 0,
              pointerEvents: step === 2 ? 'auto' : 'none'
            }}
          >
            {/* No additional background needed - uses parent gradient */}

            {/* Display Area */}
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-6 relative z-10">
               <RecipientInfo />

               <div className="flex flex-col items-center gap-4 mt-2">
                   {/* Currency Toggle */}
                   <button
                     onClick={toggleCurrency}
                     className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs font-semibold text-zinc-400 hover:bg-white/[0.05] active:bg-white/[0.08] transition-all"
                   >
                     <RefreshCw size={12} className="opacity-60" />
                     {currency}
                   </button>

                   {/* Amount Input Display */}
                   <div className="flex items-baseline gap-1 text-white relative px-4">
                     <span className="text-6xl font-bold tracking-tight text-white">
                        {displayAmount}
                     </span>
                     <span className="text-2xl font-medium text-zinc-600 ml-2">
                        {currency}
                     </span>
                   </div>

                   <p className="text-zinc-600 text-sm font-medium">
                     {secondaryDisplay}
                   </p>
               </div>
            </div>

            {/* Presets & Numpad Container */}
            <div
              style={{
                background: "linear-gradient(180deg, #0d0e12 0%, #0a0b0d 100%)",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)"
              }}
              className="rounded-t-[28px] pb-safe relative z-20"
            >
              {/* Presets */}
              <div className="flex gap-2 px-6 pt-5 pb-3 overflow-x-auto no-scrollbar justify-center">
                {/* Last used amount */}
                {lastAmount && (
                  <button
                    onClick={() => handlePresetAmount(currency === 'SOL' ? lastAmount.sol : lastAmount.usd)}
                    className="px-4 py-2 rounded-xl bg-teal-500/[0.08] border border-teal-500/20 text-sm font-medium text-teal-400 hover:bg-teal-500/[0.12] active:bg-teal-500/[0.15] transition-all"
                  >
                    {currency === 'SOL' ? lastAmount.sol : `$${lastAmount.usd}`}
                  </button>
                )}
                {currency === 'SOL' ? (
                  [0.1, 0.5, 1, 2].map(val => (
                    <button
                      key={val}
                      onClick={() => handlePresetAmount(val)}
                      className="px-5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04] text-sm font-medium text-zinc-400 hover:bg-white/[0.05] active:bg-white/[0.08] transition-all"
                    >
                      {val}
                    </button>
                  ))
                ) : (
                  [10, 50, 100, 200].map(val => (
                    <button
                      key={val}
                      onClick={() => handlePresetAmount(val)}
                      className="px-5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04] text-sm font-medium text-zinc-400 hover:bg-white/[0.05] active:bg-white/[0.08] transition-all"
                    >
                      ${val}
                    </button>
                  ))
                )}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-1 px-4 pb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'delete'].map((item) => (
                  <button
                    key={item}
                    onClick={() => handleNumpadPress(item.toString())}
                    className="h-14 flex items-center justify-center text-2xl font-medium text-white/90 rounded-xl transition-all active:bg-white/[0.05]"
                  >
                    {item === 'delete' ? (
                      <Delete size={24} className="text-zinc-500" />
                    ) : (
                      item
                    )}
                  </button>
                ))}
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