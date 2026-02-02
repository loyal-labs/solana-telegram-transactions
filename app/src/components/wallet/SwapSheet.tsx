"use client";

import { hapticFeedback, themeParams } from "@telegram-apps/sdk-react";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import {
  ArrowDownUp,
  ArrowLeft,
  Check,
  ChevronRight,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useModalSnapPoint, useTelegramSafeArea } from "@/hooks/useTelegramSafeArea";
import { SOL_PRICE_USD } from "@/lib/constants";
import { fetchSolUsdPrice } from "@/lib/solana/fetch-sol-price";

// Token type definition
export type Token = {
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
  balance: number;
  priceUsd: number;
};

// Default tokens
const TOKENS: Token[] = [
  {
    symbol: "USDT",
    name: "Tether USD",
    icon: "/USDT.png",
    decimals: 6,
    balance: 0,
    priceUsd: 1,
  },
  {
    symbol: "SOL",
    name: "Solana",
    icon: "/solana-sol-logo.png",
    decimals: 9,
    balance: 0,
    priceUsd: SOL_PRICE_USD,
  },
];

export type SwapSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  balanceSol?: number; // Balance in SOL
  balanceUsdt?: number; // Balance in USDT
  solPriceUsd?: number | null;
  onValidationChange?: (isValid: boolean) => void;
  // Tab control
  activeTab?: "swap" | "secure";
  onTabChange?: (tab: "swap" | "secure") => void;
  // Result state props
  view?: "main" | "selectFrom" | "selectTo" | "selectSecure" | "result";
  onViewChange?: (view: "main" | "selectFrom" | "selectTo" | "selectSecure" | "result") => void;
  swapError?: string | null;
  swappedFromAmount?: number;
  swappedFromSymbol?: string;
  swappedToAmount?: number;
  swappedToSymbol?: string;
};

export default function SwapSheet({
  trigger,
  open,
  onOpenChange,
  balanceSol = 0,
  balanceUsdt = 0,
  solPriceUsd: solPriceUsdProp,
  onValidationChange,
  activeTab: activeTabProp,
  onTabChange,
  view: viewProp,
  onViewChange,
  swapError,
  swappedFromAmount,
  swappedFromSymbol,
  swappedToAmount,
  swappedToSymbol,
}: SwapSheetProps) {
  const snapPoint = useModalSnapPoint();
  const { bottom: safeBottom } = useTelegramSafeArea();

  // Get Telegram theme button color
  const [buttonColor] = useState(() => {
    try {
      return themeParams.buttonColor() || "#2990ff";
    } catch {
      return "#2990ff";
    }
  });

  // State
  const [internalActiveTab, setInternalActiveTab] = useState<"swap" | "secure">("swap");
  const [internalView, setInternalView] = useState<"main" | "selectFrom" | "selectTo" | "selectSecure" | "result">("main");

  // Use controlled tab if provided, otherwise internal
  const activeTab = activeTabProp ?? internalActiveTab;
  const setActiveTab = useCallback(
    (newTab: "swap" | "secure") => {
      hapticFeedback.impactOccurred("light");
      if (onTabChange) {
        onTabChange(newTab);
      } else {
        setInternalActiveTab(newTab);
      }
    },
    [onTabChange]
  );

  // Use controlled view if provided, otherwise internal
  const view = viewProp ?? internalView;
  const setView = useCallback(
    (newView: "main" | "selectFrom" | "selectTo" | "selectSecure" | "result") => {
      if (onViewChange) {
        onViewChange(newView);
      } else {
        setInternalView(newView);
      }
    },
    [onViewChange]
  );

  // Secure mode state - token to secure
  const [secureToken, setSecureToken] = useState<Token>({
    ...TOKENS[0],
    balance: balanceUsdt,
  });
  const [secureAmountStr, setSecureAmountStr] = useState("");
  const secureAmountInputRef = useRef<HTMLInputElement>(null);
  const secureAmountTextRef = useRef<HTMLParagraphElement>(null);
  const [secureCaretLeft, setSecureCaretLeft] = useState(0);
  const [fromToken, setFromToken] = useState<Token>({
    ...TOKENS[0],
    balance: balanceUsdt,
  });
  const [toToken, setToToken] = useState<Token>({
    ...TOKENS[1],
    balance: balanceSol,
  });
  const [amountStr, setAmountStr] = useState("");
  const [solPriceUsdState, setSolPriceUsdState] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const amountInputRef = useRef<HTMLInputElement>(null);
  const amountTextRef = useRef<HTMLParagraphElement>(null);
  const [caretLeft, setCaretLeft] = useState(0);

  // Use prop price or fetch
  const solPriceUsd = solPriceUsdProp ?? solPriceUsdState;

  // Update token balances when props change
  useEffect(() => {
    setFromToken((prev) =>
      prev.symbol === "USDT"
        ? { ...prev, balance: balanceUsdt }
        : { ...prev, balance: balanceSol }
    );
    setToToken((prev) =>
      prev.symbol === "SOL"
        ? { ...prev, balance: balanceSol }
        : { ...prev, balance: balanceUsdt }
    );
  }, [balanceSol, balanceUsdt]);

  // Update SOL price in tokens when available
  useEffect(() => {
    if (solPriceUsd) {
      setFromToken((prev) =>
        prev.symbol === "SOL" ? { ...prev, priceUsd: solPriceUsd } : prev
      );
      setToToken((prev) =>
        prev.symbol === "SOL" ? { ...prev, priceUsd: solPriceUsd } : prev
      );
    }
  }, [solPriceUsd]);

  // Fetch SOL price if not provided
  useEffect(() => {
    if (solPriceUsdProp !== undefined) return;

    let isMounted = true;
    const loadPrice = async () => {
      try {
        const price = await fetchSolUsdPrice();
        if (isMounted) setSolPriceUsdState(price);
      } catch {
        if (isMounted) setSolPriceUsdState(SOL_PRICE_USD);
      }
    };
    void loadPrice();
    return () => {
      isMounted = false;
    };
  }, [solPriceUsdProp]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setAmountStr("");
      setSecureAmountStr("");
      setSearchQuery("");
      setInternalView("main");
      setInternalActiveTab("swap");
      // Reset to default tokens with updated balances
      setFromToken({ ...TOKENS[0], balance: balanceUsdt });
      setToToken({
        ...TOKENS[1],
        balance: balanceSol,
        priceUsd: solPriceUsd ?? SOL_PRICE_USD,
      });
      setSecureToken({ ...TOKENS[0], balance: balanceUsdt });
    }
  }, [open, balanceSol, balanceUsdt, solPriceUsd]);

  // Update secure token balance when props change
  useEffect(() => {
    setSecureToken((prev) =>
      prev.symbol === "USDT"
        ? { ...prev, balance: balanceUsdt }
        : prev.symbol === "SOL"
          ? { ...prev, balance: balanceSol, priceUsd: solPriceUsd ?? SOL_PRICE_USD }
          : prev
    );
  }, [balanceSol, balanceUsdt, solPriceUsd]);

  // Focus amount input when sheet opens or returns to main view
  useEffect(() => {
    if (open && view === "main") {
      const timer = setTimeout(() => {
        if (activeTab === "swap") {
          amountInputRef.current?.focus({ preventScroll: true });
        } else {
          secureAmountInputRef.current?.focus({ preventScroll: true });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, view, activeTab]);

  // Update caret position for swap
  useEffect(() => {
    if (amountTextRef.current) {
      setCaretLeft(amountTextRef.current.offsetWidth);
    } else {
      setCaretLeft(0);
    }
  }, [amountStr]);

  // Update caret position for secure
  useEffect(() => {
    if (secureAmountTextRef.current) {
      setSecureCaretLeft(secureAmountTextRef.current.offsetWidth);
    } else {
      setSecureCaretLeft(0);
    }
  }, [secureAmountStr]);

  // Calculate receive amount
  const receiveAmount = useMemo(() => {
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) return 0;

    const fromValueUsd = val * fromToken.priceUsd;
    const toAmount = fromValueUsd / toToken.priceUsd;
    return toAmount;
  }, [amountStr, fromToken.priceUsd, toToken.priceUsd]);

  // Format receive amount for display
  const receiveAmountDisplay = useMemo(() => {
    if (receiveAmount === 0) return "0";
    // Show more decimals for SOL
    const decimals = toToken.symbol === "SOL" ? 6 : 2;
    return receiveAmount.toFixed(decimals).replace(/\.?0+$/, "") || "0";
  }, [receiveAmount, toToken.symbol]);

  // Calculate USD value of receive amount
  const receiveUsdValue = useMemo(() => {
    return receiveAmount * toToken.priceUsd;
  }, [receiveAmount, toToken.priceUsd]);

  // Check if swap is valid
  const isSwapValid = useMemo(() => {
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) return false;
    if (val > fromToken.balance) return false;
    return true;
  }, [amountStr, fromToken.balance]);

  // Check if secure is valid
  const isSecureValid = useMemo(() => {
    const val = parseFloat(secureAmountStr);
    if (isNaN(val) || val <= 0) return false;
    if (val > secureToken.balance) return false;
    return true;
  }, [secureAmountStr, secureToken.balance]);

  // Calculate secure USD value
  const secureUsdValue = useMemo(() => {
    const val = parseFloat(secureAmountStr);
    if (isNaN(val) || val <= 0) return 0;
    return val * secureToken.priceUsd;
  }, [secureAmountStr, secureToken.priceUsd]);

  // Report validation state to parent
  useEffect(() => {
    if (open && view === "main") {
      const isValid = activeTab === "swap" ? isSwapValid : isSecureValid;
      onValidationChange?.(isValid);
    } else {
      onValidationChange?.(false);
    }
  }, [open, view, activeTab, isSwapValid, isSecureValid, onValidationChange]);

  // Determine if in result view (for hiding main view during result)
  const isResultView = view === "result";

  // Swap from/to tokens
  const handleSwapTokens = useCallback(() => {
    hapticFeedback.impactOccurred("light");
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    // Also convert the amount
    if (amountStr) {
      const val = parseFloat(amountStr);
      if (!isNaN(val) && val > 0) {
        // Convert using the exchange rate
        const fromValueUsd = val * fromToken.priceUsd;
        const newAmount = fromValueUsd / toToken.priceUsd;
        const decimals = toToken.symbol === "SOL" ? 6 : 2;
        setAmountStr(newAmount.toFixed(decimals).replace(/\.?0+$/, "") || "0");
      }
    }
  }, [fromToken, toToken, amountStr]);

  // Open token selector
  const handleOpenTokenSelect = useCallback((type: "from" | "to") => {
    hapticFeedback.impactOccurred("light");
    setSearchQuery("");
    setView(type === "from" ? "selectFrom" : "selectTo");
  }, [setView]);

  // Select token
  const handleSelectToken = useCallback(
    (token: Token, type: "from" | "to") => {
      hapticFeedback.impactOccurred("light");

      const currentFrom = fromToken;
      const currentTo = toToken;

      if (type === "from") {
        // If selecting same as "to", swap them
        if (token.symbol === currentTo.symbol) {
          setToToken(currentFrom);
        }
        setFromToken({
          ...token,
          balance:
            token.symbol === "USDT"
              ? balanceUsdt
              : token.symbol === "SOL"
                ? balanceSol
                : 0,
          priceUsd:
            token.symbol === "SOL" ? solPriceUsd ?? SOL_PRICE_USD : token.priceUsd,
        });
      } else {
        // If selecting same as "from", swap them
        if (token.symbol === currentFrom.symbol) {
          setFromToken(currentTo);
        }
        setToToken({
          ...token,
          balance:
            token.symbol === "USDT"
              ? balanceUsdt
              : token.symbol === "SOL"
                ? balanceSol
                : 0,
          priceUsd:
            token.symbol === "SOL" ? solPriceUsd ?? SOL_PRICE_USD : token.priceUsd,
        });
      }

      // Go back to main view
      setView("main");
    },
    [fromToken, toToken, balanceUsdt, balanceSol, solPriceUsd, setView]
  );

  // Handle preset percentage
  const handlePresetPercentage = useCallback(
    (percentage: number) => {
      hapticFeedback.impactOccurred("light");
      const maxAmount = fromToken.balance;
      const amount = maxAmount * (percentage / 100);
      const decimals = fromToken.symbol === "SOL" ? 6 : 2;
      setAmountStr(amount.toFixed(decimals).replace(/\.?0+$/, "") || "0");
      amountInputRef.current?.focus({ preventScroll: true });
    },
    [fromToken.balance, fromToken.symbol]
  );

  // Open secure token selector
  const handleOpenSecureTokenSelect = useCallback(() => {
    hapticFeedback.impactOccurred("light");
    setSearchQuery("");
    setView("selectSecure");
  }, [setView]);

  // Select secure token
  const handleSelectSecureToken = useCallback(
    (token: Token) => {
      hapticFeedback.impactOccurred("light");
      setSecureToken({
        ...token,
        balance:
          token.symbol === "USDT"
            ? balanceUsdt
            : token.symbol === "SOL"
              ? balanceSol
              : 0,
        priceUsd:
          token.symbol === "SOL" ? solPriceUsd ?? SOL_PRICE_USD : token.priceUsd,
      });
      setView("main");
    },
    [balanceUsdt, balanceSol, solPriceUsd, setView]
  );

  // Handle secure preset percentage
  const handleSecurePresetPercentage = useCallback(
    (percentage: number) => {
      hapticFeedback.impactOccurred("light");
      const maxAmount = secureToken.balance;
      const amount = maxAmount * (percentage / 100);
      const decimals = secureToken.symbol === "SOL" ? 6 : 2;
      setSecureAmountStr(amount.toFixed(decimals).replace(/\.?0+$/, "") || "0");
      secureAmountInputRef.current?.focus({ preventScroll: true });
    },
    [secureToken.balance, secureToken.symbol]
  );

  // Filter tokens based on search
  const filteredTokens = useMemo(() => {
    if (!searchQuery) return TOKENS;
    const query = searchQuery.toLowerCase();
    return TOKENS.filter(
      (t) =>
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const modalStyle = useMemo(
    () =>
      ({
        "--tgui--bg_color": "transparent",
        "--tgui--divider": "rgba(255, 255, 255, 0.05)",
      }) as CSSProperties,
    []
  );

  const [snapPoints] = useState(() => [snapPoint]);

  return (
    <Modal
      aria-label="Swap tokens"
      trigger={trigger || <button style={{ display: "none" }} />}
      open={open}
      onOpenChange={onOpenChange}
      style={modalStyle}
      snapPoints={snapPoints}
    >
      <div
        style={{
          background: "#1c1c1e",
          paddingBottom: Math.max(safeBottom, 80),
        }}
        className="flex flex-col text-white relative overflow-hidden min-h-[500px] rounded-t-3xl"
      >
        <Drawer.Title asChild>
          <VisuallyHidden>Swap tokens</VisuallyHidden>
        </Drawer.Title>

        {/* Header with Tabs */}
        <div className="relative h-[52px] flex items-center justify-center shrink-0">
          {/* Tabs */}
          <div
            className="flex items-center p-0.5 rounded-full"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
            }}
          >
            <button
              onClick={() => setActiveTab("swap")}
              className={`px-4 py-2 rounded-full text-[13px] leading-4 transition-all ${
                activeTab === "swap"
                  ? "bg-white/[0.06] text-white"
                  : "text-white/60"
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActiveTab("secure")}
              className={`px-4 py-2 rounded-full text-[13px] leading-4 transition-all ${
                activeTab === "secure"
                  ? "bg-white/[0.06] text-white"
                  : "text-white/60"
              }`}
            >
              Secure
            </button>
          </div>

          {/* Close Button */}
          <Modal.Close>
            <div
              onClick={() => hapticFeedback.impactOccurred("light")}
              className="absolute right-2 p-1.5 rounded-full flex items-center justify-center active:scale-95 active:bg-white/10 transition-all duration-150 cursor-pointer"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
              }}
            >
              <X size={24} strokeWidth={1.5} className="text-white/60" />
            </div>
          </Modal.Close>
        </div>

        {/* Content Container */}
        <div className="relative flex-1 overflow-hidden">
          {/* MAIN VIEW - in normal flow */}
          <div
            className="flex flex-col transition-all duration-300 ease-out"
            style={{
              transform: `translateX(${view === "main" ? 0 : -100}%)`,
              opacity: view === "main" ? 1 : 0,
              pointerEvents: view === "main" ? "auto" : "none",
            }}
          >
            {/* SWAP TAB CONTENT */}
            {activeTab === "swap" && (
              <div className="flex flex-col px-4 pt-2 pb-4 gap-2">
                {/* You Swap Card */}
                <div
                  className="flex flex-col px-4 py-3 rounded-[20px] relative"
                  style={{ background: "#2c2c2e" }}
                >
                  <p className="text-base leading-5 text-white/60">You swap</p>

                  <div className="flex gap-1 items-center h-12">
                    {/* Amount Input */}
                    <div className="flex-1 flex items-baseline relative">
                      <input
                        ref={amountInputRef}
                        type="text"
                        inputMode="decimal"
                        value={amountStr}
                        onChange={(e) => {
                          const val = e.target.value.replace(",", ".");
                          if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                            const decimals = fromToken.symbol === "SOL" ? 6 : 2;
                            if (val.includes(".")) {
                              const [, dec] = val.split(".");
                              if (dec && dec.length > decimals) return;
                            }
                            setAmountStr(val);
                          }
                        }}
                        placeholder="0"
                        className="absolute inset-0 opacity-0 z-10"
                        autoComplete="off"
                      />
                      <p
                        ref={amountTextRef}
                        className="text-[28px] font-semibold leading-8 text-white"
                      >
                        {amountStr || ""}
                      </p>
                      {!amountStr && (
                        <p className="text-[28px] font-semibold leading-8 text-white/40">
                          0
                        </p>
                      )}
                      {/* Caret */}
                      <div
                        className="absolute w-0.5 h-8 bg-white top-1/2 -translate-y-1/2"
                        style={{
                          left: `${caretLeft}px`,
                          animation: "blink 1s step-end infinite",
                        }}
                      />
                    </div>

                    {/* Token Selector */}
                    <button
                      onClick={() => handleOpenTokenSelect("from")}
                      className="flex items-center px-1 rounded-[54px] active:scale-95 transition-transform"
                      style={{ background: "rgba(255, 255, 255, 0.06)" }}
                    >
                      <div className="pr-1.5">
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                          <Image
                            src={fromToken.icon}
                            alt={fromToken.symbol}
                            width={28}
                            height={28}
                          />
                        </div>
                      </div>
                      <span className="text-base leading-5 text-white py-2.5 pr-1">
                        {fromToken.symbol}
                      </span>
                      <ChevronRight
                        size={16}
                        strokeWidth={1.5}
                        className="text-white/40"
                      />
                    </button>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {/* Small swap icon */}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255, 255, 255, 0.1)" }}
                      >
                        <ArrowDownUp size={12} strokeWidth={2} className="text-white/60" />
                      </div>
                      <p className="text-base leading-5 text-white/60">
                        1 {fromToken.symbol} ≈ ${fromToken.priceUsd.toFixed(4)}
                      </p>
                    </div>
                    <p className="text-base leading-5 text-white/60">
                      {fromToken.balance.toLocaleString("en-US", {
                        maximumFractionDigits: fromToken.symbol === "SOL" ? 4 : 2,
                      })}
                    </p>
                  </div>

                  {/* Swap Button - positioned at bottom of card */}
                  <button
                    onClick={handleSwapTokens}
                    className="absolute -bottom-[18px] left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform z-10"
                  >
                    <ArrowDownUp size={20} strokeWidth={2} className="text-black" />
                  </button>
                </div>

                {/* You Receive Card */}
                <div
                  className="flex flex-col px-4 py-3 rounded-[20px]"
                  style={{ background: "#2c2c2e" }}
                >
                  <p className="text-base leading-5 text-white/60">You receive</p>

                  <div className="flex gap-1 items-center h-12">
                    {/* Amount Display */}
                    <div className="flex-1 flex items-baseline">
                      <p className="text-[28px] font-semibold leading-8 text-white/40">
                        {receiveAmountDisplay}
                      </p>
                    </div>

                    {/* Token Selector */}
                    <button
                      onClick={() => handleOpenTokenSelect("to")}
                      className="flex items-center px-1 rounded-[54px] active:scale-95 transition-transform"
                      style={{ background: "rgba(255, 255, 255, 0.06)" }}
                    >
                      <div className="pr-1.5">
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                          <Image
                            src={toToken.icon}
                            alt={toToken.symbol}
                            width={28}
                            height={28}
                          />
                        </div>
                      </div>
                      <span className="text-base leading-5 text-white py-2.5 pr-1">
                        {toToken.symbol}
                      </span>
                      <ChevronRight
                        size={16}
                        strokeWidth={1.5}
                        className="text-white/40"
                      />
                    </button>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between">
                    <p className="text-base leading-5 text-white/60">
                      ${receiveUsdValue.toFixed(2)}
                    </p>
                    <p className="text-base leading-5 text-white/60">
                      {toToken.balance.toLocaleString("en-US", {
                        maximumFractionDigits: toToken.symbol === "SOL" ? 4 : 2,
                      })}{" "}
                      {toToken.symbol}
                    </p>
                  </div>
                </div>

                {/* Percentage Buttons */}
                <div className="flex gap-2">
                  {[25, 50].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePresetPercentage(pct)}
                      className="flex-1 min-w-[64px] px-4 py-2 rounded-[40px] text-sm leading-5 text-white text-center active:opacity-70 transition-opacity"
                      style={{ background: "#2c2c2e" }}
                    >
                      {pct}%
                    </button>
                  ))}
                  <button
                    onClick={() => handlePresetPercentage(100)}
                    className="flex-1 min-w-[64px] px-4 py-2 rounded-[40px] text-sm leading-5 text-white text-center active:opacity-70 transition-opacity"
                    style={{ background: "#2c2c2e" }}
                  >
                    Max
                  </button>
                </div>

                {/* Insufficient balance error */}
                {(() => {
                  const val = parseFloat(amountStr);
                  if (isNaN(val) || val <= 0) return null;
                  if (val > fromToken.balance) {
                    return (
                      <p className="text-[13px] text-red-400 leading-4 px-1">
                        Insufficient balance
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* SECURE TAB CONTENT */}
            {activeTab === "secure" && (
              <div className="flex flex-col px-4 pt-2 pb-4 gap-2">
                {/* You Secure Card */}
                <div
                  className="flex flex-col px-4 py-3 rounded-[20px] relative"
                  style={{ background: "#2c2c2e" }}
                >
                  <p className="text-base leading-5 text-white/60">You secure</p>

                  <div className="flex gap-1 items-center h-12">
                    {/* Amount Input */}
                    <div className="flex-1 flex items-baseline relative">
                      <input
                        ref={secureAmountInputRef}
                        type="text"
                        inputMode="decimal"
                        value={secureAmountStr}
                        onChange={(e) => {
                          const val = e.target.value.replace(",", ".");
                          if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                            const decimals = secureToken.symbol === "SOL" ? 6 : 2;
                            if (val.includes(".")) {
                              const [, dec] = val.split(".");
                              if (dec && dec.length > decimals) return;
                            }
                            setSecureAmountStr(val);
                          }
                        }}
                        placeholder="0"
                        className="absolute inset-0 opacity-0 z-10"
                        autoComplete="off"
                      />
                      <p
                        ref={secureAmountTextRef}
                        className="text-[28px] font-semibold leading-8 text-white"
                      >
                        {secureAmountStr || ""}
                      </p>
                      {!secureAmountStr && (
                        <p className="text-[28px] font-semibold leading-8 text-white/40">
                          0
                        </p>
                      )}
                      {/* Caret */}
                      <div
                        className="absolute w-0.5 h-8 bg-white top-1/2 -translate-y-1/2"
                        style={{
                          left: `${secureCaretLeft}px`,
                          animation: "blink 1s step-end infinite",
                        }}
                      />
                    </div>

                    {/* Token Selector */}
                    <button
                      onClick={handleOpenSecureTokenSelect}
                      className="flex items-center px-1 rounded-[54px] active:scale-95 transition-transform"
                      style={{ background: "rgba(255, 255, 255, 0.06)" }}
                    >
                      <div className="pr-1.5">
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                          <Image
                            src={secureToken.icon}
                            alt={secureToken.symbol}
                            width={28}
                            height={28}
                          />
                        </div>
                      </div>
                      <span className="text-base leading-5 text-white py-2.5 pr-1">
                        {secureToken.symbol}
                      </span>
                      <ChevronRight
                        size={16}
                        strokeWidth={1.5}
                        className="text-white/40"
                      />
                    </button>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {/* Small swap icon */}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255, 255, 255, 0.1)" }}
                      >
                        <ArrowDownUp size={12} strokeWidth={2} className="text-white/60" />
                      </div>
                      <p className="text-base leading-5 text-white/60">
                        ${secureUsdValue.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-base leading-5 text-white/60">
                      {secureToken.balance.toLocaleString("en-US", {
                        maximumFractionDigits: secureToken.symbol === "SOL" ? 4 : 2,
                      })}
                    </p>
                  </div>

                  {/* Arrow Down Icon - positioned at bottom of card */}
                  <div className="absolute -bottom-[18px] left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white flex items-center justify-center z-10">
                    <ArrowDownUp size={20} strokeWidth={2} className="text-black" />
                  </div>
                </div>

                {/* You Receive Card (Secured Token) */}
                <div
                  className="flex flex-col px-4 py-3 rounded-[20px]"
                  style={{ background: "#2c2c2e" }}
                >
                  <p className="text-base leading-5 text-white/60">You receive</p>

                  <div className="flex gap-1 items-center h-12">
                    {/* Amount Display - same as input (1:1) */}
                    <div className="flex-1 flex items-baseline">
                      <p className="text-[28px] font-semibold leading-8 text-white">
                        {secureAmountStr || "0"}
                      </p>
                    </div>

                    {/* Token Display (not selectable) - token + shield badge */}
                    <div className="flex items-center px-1 pr-3.5">
                      <div className="flex items-center pr-1.5">
                        {/* Token icon */}
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                          <Image
                            src={secureToken.icon}
                            alt={secureToken.symbol}
                            width={28}
                            height={28}
                          />
                        </div>
                        {/* Shield badge overlapping */}
                        <div className="w-7 h-7 rounded-full overflow-hidden -ml-2 bg-[#f9363c] flex items-center justify-center">
                          <Image
                            src="/loyal-shield.png"
                            alt="Secured"
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        </div>
                      </div>
                      <span className="text-base leading-5 text-white py-2.5">
                        {secureToken.symbol}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between">
                    <p className="text-base leading-5 text-white/60">
                      ${secureUsdValue.toFixed(2)}
                    </p>
                    <p className="text-base leading-5 text-white/60">
                      0 {secureToken.symbol}
                    </p>
                  </div>
                </div>

                {/* Percentage Buttons */}
                <div className="flex gap-2">
                  {[25, 50].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handleSecurePresetPercentage(pct)}
                      className="flex-1 min-w-[64px] px-4 py-2 rounded-[40px] text-sm leading-5 text-white text-center active:opacity-70 transition-opacity"
                      style={{ background: "#2c2c2e" }}
                    >
                      {pct}%
                    </button>
                  ))}
                  <button
                    onClick={() => handleSecurePresetPercentage(100)}
                    className="flex-1 min-w-[64px] px-4 py-2 rounded-[40px] text-sm leading-5 text-white text-center active:opacity-70 transition-opacity"
                    style={{ background: "#2c2c2e" }}
                  >
                    Max
                  </button>
                </div>

                {/* Insufficient balance error */}
                {(() => {
                  const val = parseFloat(secureAmountStr);
                  if (isNaN(val) || val <= 0) return null;
                  if (val > secureToken.balance) {
                    return (
                      <p className="text-[13px] text-red-400 leading-4 px-1">
                        Insufficient balance
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>

          {/* TOKEN SELECT VIEW (FROM) */}
          <div
            className="absolute inset-0 flex flex-col transition-all duration-300 ease-out"
            style={{
              background: "#1c1c1e",
              transform: `translateX(${view === "selectFrom" ? 0 : 100}%)`,
              opacity: view === "selectFrom" ? 1 : 0,
              pointerEvents: view === "selectFrom" ? "auto" : "none",
            }}
          >
            {/* Header */}
            <div className="relative h-[52px] flex items-center justify-center shrink-0">
              {/* Back Button */}
              <button
                onClick={() => {
                  hapticFeedback.impactOccurred("light");
                  setView("main");
                }}
                className="absolute left-2 p-1.5 rounded-full flex items-center justify-center active:scale-95 active:bg-white/10 transition-all duration-150"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                }}
              >
                <ArrowLeft size={22} strokeWidth={1.5} className="text-white/60" />
              </button>

              <span className="text-base font-medium text-white tracking-[-0.176px]">
                You swap
              </span>
            </div>

            {/* Search Input */}
            <div className="px-4 py-2">
              <div
                className="flex items-center rounded-[75px] overflow-hidden px-3"
                style={{ background: "rgba(255, 255, 255, 0.06)" }}
              >
                <div className="pr-3 py-3 flex items-center justify-center">
                  <Search size={24} strokeWidth={1.5} className="text-white/40" />
                </div>
                <input
                  type="text"
                  placeholder="Search token"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 py-3.5 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto">
              {filteredTokens.map((token) => {
                const tokenBalance =
                  token.symbol === "USDT"
                    ? balanceUsdt
                    : token.symbol === "SOL"
                      ? balanceSol
                      : 0;
                const tokenPrice =
                  token.symbol === "SOL"
                    ? solPriceUsd ?? SOL_PRICE_USD
                    : token.priceUsd;
                const balanceUsd = tokenBalance * tokenPrice;

                return (
                  <button
                    key={token.symbol}
                    onClick={() =>
                      handleSelectToken(
                        {
                          ...token,
                          balance: tokenBalance,
                          priceUsd: tokenPrice,
                        },
                        "from"
                      )
                    }
                    className="w-full flex items-center px-3 rounded-2xl active:bg-white/[0.03] transition-colors"
                  >
                    <div className="py-1.5 pr-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={token.icon}
                          alt={token.symbol}
                          width={48}
                          height={48}
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 py-2.5">
                      <p className="text-base text-white text-left leading-5">
                        {token.symbol}
                      </p>
                      <p className="text-[13px] text-white/60 text-left leading-4">
                        {token.name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 items-end py-2.5 pl-3">
                      <p className="text-base leading-5 text-white/60 text-right">
                        {tokenBalance.toLocaleString("en-US", {
                          maximumFractionDigits: token.symbol === "SOL" ? 4 : 2,
                        })}
                      </p>
                      <p className="text-[13px] leading-4 text-white/60 text-right">
                        ${balanceUsd.toFixed(2)}
                      </p>
                    </div>
                    <div className="pl-3 py-2 flex items-center justify-center h-10">
                      <ChevronRight
                        size={16}
                        strokeWidth={1.5}
                        className="text-white/40"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TOKEN SELECT VIEW (TO) */}
          <div
            className="absolute inset-0 flex flex-col transition-all duration-300 ease-out"
            style={{
              background: "#1c1c1e",
              transform: `translateX(${view === "selectTo" ? 0 : 100}%)`,
              opacity: view === "selectTo" ? 1 : 0,
              pointerEvents: view === "selectTo" ? "auto" : "none",
            }}
          >
            {/* Header */}
            <div className="relative h-[52px] flex items-center justify-center shrink-0">
              {/* Back Button */}
              <button
                onClick={() => {
                  hapticFeedback.impactOccurred("light");
                  setView("main");
                }}
                className="absolute left-2 p-1.5 rounded-full flex items-center justify-center active:scale-95 active:bg-white/10 transition-all duration-150"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                }}
              >
                <ArrowLeft size={22} strokeWidth={1.5} className="text-white/60" />
              </button>

              <span className="text-base font-medium text-white tracking-[-0.176px]">
                You receive
              </span>
            </div>

            {/* Search Input */}
            <div className="px-4 py-2">
              <div
                className="flex items-center rounded-[75px] overflow-hidden px-3"
                style={{ background: "rgba(255, 255, 255, 0.06)" }}
              >
                <div className="pr-3 py-3 flex items-center justify-center">
                  <Search size={24} strokeWidth={1.5} className="text-white/40" />
                </div>
                <input
                  type="text"
                  placeholder="Search token"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 py-3.5 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto">
              {filteredTokens.map((token) => {
                const tokenBalance =
                  token.symbol === "USDT"
                    ? balanceUsdt
                    : token.symbol === "SOL"
                      ? balanceSol
                      : 0;
                const tokenPrice =
                  token.symbol === "SOL"
                    ? solPriceUsd ?? SOL_PRICE_USD
                    : token.priceUsd;
                const balanceUsd = tokenBalance * tokenPrice;

                return (
                  <button
                    key={token.symbol}
                    onClick={() =>
                      handleSelectToken(
                        {
                          ...token,
                          balance: tokenBalance,
                          priceUsd: tokenPrice,
                        },
                        "to"
                      )
                    }
                    className="w-full flex items-center px-3 rounded-2xl active:bg-white/[0.03] transition-colors"
                  >
                    <div className="py-1.5 pr-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={token.icon}
                          alt={token.symbol}
                          width={48}
                          height={48}
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 py-2.5">
                      <p className="text-base text-white text-left leading-5">
                        {token.symbol}
                      </p>
                      <p className="text-[13px] text-white/60 text-left leading-4">
                        {token.name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 items-end py-2.5 pl-3">
                      <p className="text-base leading-5 text-white/60 text-right">
                        {tokenBalance.toLocaleString("en-US", {
                          maximumFractionDigits: token.symbol === "SOL" ? 4 : 2,
                        })}
                      </p>
                      <p className="text-[13px] leading-4 text-white/60 text-right">
                        ${balanceUsd.toFixed(2)}
                      </p>
                    </div>
                    <div className="pl-3 py-2 flex items-center justify-center h-10">
                      <ChevronRight
                        size={16}
                        strokeWidth={1.5}
                        className="text-white/40"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TOKEN SELECT VIEW (SECURE) */}
          <div
            className="absolute inset-0 flex flex-col transition-all duration-300 ease-out"
            style={{
              background: "#1c1c1e",
              transform: `translateX(${view === "selectSecure" ? 0 : 100}%)`,
              opacity: view === "selectSecure" ? 1 : 0,
              pointerEvents: view === "selectSecure" ? "auto" : "none",
            }}
          >
            {/* Header */}
            <div className="relative h-[52px] flex items-center justify-center shrink-0">
              {/* Back Button */}
              <button
                onClick={() => {
                  hapticFeedback.impactOccurred("light");
                  setView("main");
                }}
                className="absolute left-2 p-1.5 rounded-full flex items-center justify-center active:scale-95 active:bg-white/10 transition-all duration-150"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                }}
              >
                <ArrowLeft size={22} strokeWidth={1.5} className="text-white/60" />
              </button>

              <span className="text-base font-medium text-white tracking-[-0.176px]">
                You secure
              </span>
            </div>

            {/* Search Input */}
            <div className="px-4 py-2">
              <div
                className="flex items-center rounded-[75px] overflow-hidden px-3"
                style={{ background: "rgba(255, 255, 255, 0.06)" }}
              >
                <div className="pr-3 py-3 flex items-center justify-center">
                  <Search size={24} strokeWidth={1.5} className="text-white/40" />
                </div>
                <input
                  type="text"
                  placeholder="Search token"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 py-3.5 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto">
              {filteredTokens.map((token) => {
                const tokenBalance =
                  token.symbol === "USDT"
                    ? balanceUsdt
                    : token.symbol === "SOL"
                      ? balanceSol
                      : 0;
                const tokenPrice =
                  token.symbol === "SOL"
                    ? solPriceUsd ?? SOL_PRICE_USD
                    : token.priceUsd;
                const balanceUsd = tokenBalance * tokenPrice;

                return (
                  <button
                    key={token.symbol}
                    onClick={() =>
                      handleSelectSecureToken({
                        ...token,
                        balance: tokenBalance,
                        priceUsd: tokenPrice,
                      })
                    }
                    className="w-full flex items-center px-3 rounded-2xl active:bg-white/[0.03] transition-colors"
                  >
                    <div className="py-1.5 pr-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={token.icon}
                          alt={token.symbol}
                          width={48}
                          height={48}
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 py-2.5">
                      <p className="text-base text-white text-left leading-5">
                        {token.symbol}
                      </p>
                      <p className="text-[13px] text-white/60 text-left leading-4">
                        {token.name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 items-end py-2.5 pl-3">
                      <p className="text-base leading-5 text-white/60 text-right">
                        {tokenBalance.toLocaleString("en-US", {
                          maximumFractionDigits: token.symbol === "SOL" ? 4 : 2,
                        })}
                      </p>
                      <p className="text-[13px] leading-4 text-white/60 text-right">
                        ${balanceUsd.toFixed(2)}
                      </p>
                    </div>
                    <div className="pl-3 py-2 flex items-center justify-center h-10">
                      <ChevronRight
                        size={16}
                        strokeWidth={1.5}
                        className="text-white/40"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RESULT VIEW (SUCCESS or ERROR) */}
          <div
            className="absolute inset-0 flex flex-col transition-all duration-300 ease-out"
            style={{
              background: "#1c1c1e",
              transform: `translateX(${isResultView ? 0 : 100}%)`,
              opacity: isResultView ? 1 : 0,
              pointerEvents: isResultView ? "auto" : "none",
            }}
          >
            {swapError ? (
              /* Error Content */
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
                {/* Animated Error Icon */}
                <div className="relative mb-5">
                  <div
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                    style={{
                      background: "#FF4D4D",
                      animation: isResultView ? "result-pulse 0.6s ease-out" : "none",
                    }}
                  >
                    <ShieldAlert
                      className="text-white"
                      size={40}
                      strokeWidth={2}
                      style={{
                        animation: isResultView
                          ? "result-icon 0.4s ease-out 0.2s both"
                          : "none",
                      }}
                    />
                  </div>
                </div>

                {/* Error Text */}
                <div className="flex flex-col gap-3 items-center text-center max-w-[280px]">
                  <h2 className="text-2xl font-semibold text-white leading-7">
                    Swap failed
                  </h2>
                  <p className="text-base leading-5 text-white/60">{swapError}</p>
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
                      background: buttonColor,
                      animation: isResultView ? "result-pulse 0.6s ease-out" : "none",
                    }}
                  >
                    <Check
                      className="text-white"
                      size={40}
                      strokeWidth={2.5}
                      style={{
                        animation: isResultView
                          ? "result-icon 0.4s ease-out 0.2s both"
                          : "none",
                      }}
                    />
                  </div>
                </div>

                {/* Success Text */}
                <div className="flex flex-col gap-3 items-center text-center max-w-[280px]">
                  <h2 className="text-2xl font-semibold text-white leading-7">
                    Swap complete
                  </h2>
                  <p className="text-base leading-5 text-white/60">
                    <span className="text-white">
                      {swappedFromAmount?.toFixed(4).replace(/\.?0+$/, "") || "0"}{" "}
                      {swappedFromSymbol || ""}
                    </span>{" "}
                    swapped to{" "}
                    <span className="text-white">
                      {swappedToAmount?.toFixed(6).replace(/\.?0+$/, "") || "0"}{" "}
                      {swappedToSymbol || ""}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Animation styles */}
        <style jsx>{`
          @keyframes blink {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0;
            }
          }
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
    </Modal>
  );
}
