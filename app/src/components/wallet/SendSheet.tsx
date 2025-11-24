"use client";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import {
  ArrowLeft,
  ChevronRight,
  Delete,
  Search,
  Wallet,
  X,
  RefreshCw,
  User,
  Send
} from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from "react";

export type SendSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialRecipient?: string;
  onValidationChange?: (isValid: boolean) => void;
  onFormValuesChange?: (values: { amount: string; recipient: string }) => void;
  showErrors?: boolean;
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
  { name: "Alice", username: "@alice", initials: "A", gradient: "from-pink-500 to-rose-500" },
  { name: "Bob", username: "@bob", initials: "B", gradient: "from-blue-500 to-cyan-500" },
  { name: "Carol", username: "@carol", initials: "C", gradient: "from-emerald-500 to-teal-500" },
  { name: "Dave", username: "@dave", initials: "D", gradient: "from-amber-500 to-orange-500" },
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

export default function SendSheet({
  trigger,
  open,
  onOpenChange,
  initialRecipient,
  onValidationChange,
  onFormValuesChange,
  showErrors,
  step,
  onStepChange,
}: SendSheetProps) {
  const [amountStr, setAmountStr] = useState("");
  const [recipient, setRecipient] = useState("");
  const [currency, setCurrency] = useState<'SOL' | 'USD'>('SOL');
  const [lastAmount, setLastAmount] = useState<LastAmount | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setAmountStr("");
      setRecipient(initialRecipient || "");
      setCurrency('SOL');
      setLastAmount(getLastAmount());
    }
  }, [open, initialRecipient]);

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

    if (step === 1) {
      const isRecipientValid = isValidSolanaAddress(recipient.trim()) || isValidTelegramUsername(recipient.trim());
      onValidationChange?.(isRecipientValid);
      return;
    }

    if (step === 2) {
      const amount = parseFloat(amountStr);
      const isAmountValid = !isNaN(amount) && amount > 0;
      const isRecipientValid = isValidSolanaAddress(recipient.trim()) || isValidTelegramUsername(recipient.trim());
      onValidationChange?.(isAmountValid && isRecipientValid);
      return;
    }

    if (step === 3) {
      // Always valid in step 3 (confirmation), unless fields are somehow empty
      const amount = parseFloat(amountStr);
      const isAmountValid = !isNaN(amount) && amount > 0;
      const isRecipientValid = isValidSolanaAddress(recipient.trim()) || isValidTelegramUsername(recipient.trim());
      onValidationChange?.(isAmountValid && isRecipientValid);
      return;
    }

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
        "--tgui--bg_color": "#050505",
        "--tgui--divider": "rgba(255, 255, 255, 0.06)",
        "--tgui--secondary_bg_color": "#0a0a0a",
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

  // Recipient info for Step 2 and 3
  const RecipientInfo = () => (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/[0.06] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] w-auto max-w-full">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500/80 to-purple-600/80 flex items-center justify-center shrink-0 shadow-lg">
             {recipient.startsWith('@') ? <User size={14} className="text-white" /> : <Wallet size={14} className="text-white" />}
        </div>
        <span className="text-sm text-zinc-300 font-medium truncate max-w-[200px] font-mono tracking-tight">{recipient}</span>
    </div>
  );

  return (
    <Modal
      aria-label="Send assets"
      trigger={trigger || <button style={{ display: 'none' }} />}
      open={open}
      onOpenChange={onOpenChange}
      style={modalStyle}
      header={
        <Modal.Header
          before={
            step > 1 && (
              <button
                onClick={() => onStepChange((step - 1) as 1 | 2)}
                className="p-1.5 -ml-1 text-zinc-500 hover:text-white transition-colors rounded-xl hover:bg-white/5 active:scale-95"
              >
                <ArrowLeft size={22} strokeWidth={2} />
              </button>
            )
          }
          after={
            <Modal.Close>
              <div className="p-1.5 -mr-1 text-zinc-500 hover:text-white transition-colors rounded-xl hover:bg-white/5 active:scale-95">
                <X size={22} strokeWidth={2} />
              </div>
            </Modal.Close>
          }
          style={{
            background: "#050505",
            color: "white",
            borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
            fontFamily: "Inter, sans-serif"
          }}
        >
          <span className="font-semibold tracking-tight text-white/90">
            {step === 1 ? "Send to" : step === 2 ? "Amount" : "Review"}
          </span>
        </Modal.Header>
      }
    >
      <div className="bg-[#050505] min-h-[500px] flex flex-col text-white relative overflow-hidden">
        {/* Background gradient orb */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/[0.06] blur-[80px] pointer-events-none" />

        <Drawer.Title asChild>
          <VisuallyHidden>Send assets</VisuallyHidden>
        </Drawer.Title>

        {step === 1 && (
          // STEP 1: RECIPIENT
          <div className="p-6 flex flex-col gap-5 relative z-10">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors duration-300">
                <Search size={18} strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="Address or @username"
                value={recipient}
                onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Z0-9@.]*$/.test(val)) {
                        setRecipient(val);
                    }
                }}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all font-mono text-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]"
                autoFocus
              />
            </div>

            {/* Manual Entry Confirm */}
            {recipient.trim().length > 0 && (
              <button
                onClick={() => {
                     if (isValidSolanaAddress(recipient) || isValidTelegramUsername(recipient)) {
                         handleRecipientSelect(recipient)
                     }
                }}
                disabled={!(isValidSolanaAddress(recipient) || isValidTelegramUsername(recipient))}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 group ${
                    (isValidSolanaAddress(recipient) || isValidTelegramUsername(recipient))
                    ? "bg-white/[0.03] border-indigo-500/20 active:scale-[0.98] hover:bg-white/[0.05] hover:border-indigo-500/30"
                    : "bg-red-500/[0.03] border-red-500/10 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                       (isValidSolanaAddress(recipient) || isValidTelegramUsername(recipient))
                       ? "bg-gradient-to-br from-indigo-500/80 to-purple-600/80 text-white shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)]"
                       : "bg-zinc-800/50 text-zinc-500"
                  }`}>
                    <Wallet size={18} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col overflow-hidden items-start">
                    <span className={`text-sm font-semibold truncate ${
                         (isValidSolanaAddress(recipient) || isValidTelegramUsername(recipient))
                         ? "text-white"
                         : "text-red-400/80"
                    }`}>
                        {(isValidSolanaAddress(recipient) || isValidTelegramUsername(recipient)) ? "Send to this address" : "Invalid address"}
                    </span>
                    <span className="text-xs text-zinc-500 truncate font-mono max-w-[200px]">{recipient}</span>
                  </div>
                </div>
                {(isValidSolanaAddress(recipient) || isValidTelegramUsername(recipient)) && (
                    <ChevronRight size={18} className="text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                )}
              </button>
            )}

            {/* Recent Contacts */}
            <div className="mt-2">
              <h3 className="text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.15em] mb-4 px-1">
                Suggested
              </h3>
              <div className="flex flex-col gap-1">
                {MOCK_CONTACTS.map((contact) => (
                  <button
                    key={contact.username}
                    onClick={() => handleRecipientSelect(contact.username)}
                    className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/[0.03] active:bg-white/[0.06] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${contact.gradient} flex items-center justify-center text-white font-semibold text-sm shadow-lg group-hover:scale-105 group-active:scale-95 transition-transform`}>
                        {contact.initials}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">{contact.name}</span>
                        <span className="text-xs text-zinc-600 font-mono">{contact.username}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          // STEP 2: AMOUNT
          <div className="flex flex-col h-full bg-[#050505] relative">
            {/* Background Glow */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/[0.04] blur-[100px] rounded-full pointer-events-none" />

            {/* Display Area */}
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-6 relative z-10">
               <RecipientInfo />

               <div className="flex flex-col items-center gap-4 mt-2">
                   {/* Currency Toggle */}
                   <button
                     onClick={toggleCurrency}
                     className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-semibold text-zinc-500 hover:text-white hover:bg-white/[0.06] hover:border-white/10 transition-all active:scale-95"
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
            <div className="bg-[#080808] border-t border-white/[0.04] rounded-t-[28px] pb-safe relative z-20">
              {/* Presets */}
              <div className="flex gap-2 px-6 pt-5 pb-3 overflow-x-auto no-scrollbar justify-center">
                {/* Last used amount */}
                {lastAmount && (
                  <button
                    onClick={() => handlePresetAmount(currency === 'SOL' ? lastAmount.sol : lastAmount.usd)}
                    className="px-4 py-2 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/20 text-sm font-medium text-indigo-400 hover:bg-indigo-500/[0.12] hover:text-indigo-300 hover:border-indigo-500/30 transition-all active:scale-95"
                  >
                    {currency === 'SOL' ? lastAmount.sol : `$${lastAmount.usd}`}
                  </button>
                )}
                {currency === 'SOL' ? (
                  [0.1, 0.5, 1, 2].map(val => (
                    <button
                      key={val}
                      onClick={() => handlePresetAmount(val)}
                      className="px-5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04] text-sm font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.08] transition-all active:scale-95"
                    >
                      {val}
                    </button>
                  ))
                ) : (
                  [10, 50, 100, 200].map(val => (
                    <button
                      key={val}
                      onClick={() => handlePresetAmount(val)}
                      className="px-5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04] text-sm font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.08] transition-all active:scale-95"
                    >
                      ${val}
                    </button>
                  ))
                )}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-y-1 px-4 pb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'delete'].map((item) => (
                  <button
                    key={item}
                    onClick={() => handleNumpadPress(item.toString())}
                    className="h-14 flex items-center justify-center text-2xl font-medium text-white/90 rounded-2xl active:bg-white/[0.04] transition-colors"
                  >
                    {item === 'delete' ? (
                      <Delete size={24} className="text-zinc-600" />
                    ) : (
                      item
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
            // STEP 3: CONFIRMATION
            <div className="flex flex-col h-full p-6 items-center bg-[#050505] relative">
                {/* Background Glow */}
                <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/[0.05] blur-[100px] rounded-full pointer-events-none" />

                <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10">
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/10 flex items-center justify-center mb-6 relative shadow-[0_8px_32px_-8px_rgba(99,102,241,0.3)]">
                        <Send size={32} className="text-indigo-400 relative z-10" strokeWidth={1.5} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Review Transaction</h2>
                    <p className="text-zinc-500 text-center mb-8 text-sm max-w-[240px]">
                        Confirm the details below
                    </p>

                    <div className="w-full max-w-sm">
                        <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl p-5 space-y-4 border border-white/[0.04] relative overflow-hidden">
                            {/* Glass shine effect */}
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

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
        )}
      </div>
    </Modal>
  );
}