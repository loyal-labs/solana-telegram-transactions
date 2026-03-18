import { ArrowDownUp, ChevronRight, Globe, Share } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  FormButtonProps,
  SubView,
  SwapMode,
  SwapToken,
} from "@loyal-labs/wallet-core/types";
import { useSwap } from "@loyal-labs/wallet-core/hooks";
import type { SwapConfig } from "@loyal-labs/wallet-core/hooks";

import { useWalletContext } from "~/src/components/wallet/wallet-provider";

// ---------------------------------------------------------------------------
// Helpers / constants
// ---------------------------------------------------------------------------

const red = "#F9363C";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SwapContentProps {
  fromToken: SwapToken;
  toToken: SwapToken;
  onFromTokenChange: (token: SwapToken) => void;
  onToTokenChange: (token: SwapToken) => void;
  onNavigate: (view: SubView) => void;
  onDone: () => void;
  swapMode: SwapMode;
  onSwapModeChange: (mode: SwapMode) => void;
  onFormActiveChange?: (active: boolean) => void;
  onFormButtonChange?: (props: FormButtonProps | null) => void;
  hideFormChrome?: boolean;
}

// ---------------------------------------------------------------------------
// Token pill
// ---------------------------------------------------------------------------

function TokenPill({
  token,
  variant,
  onClick,
}: {
  token: SwapToken;
  variant: "from" | "to";
  onClick: () => void;
}) {
  return (
    <button
      className={`flex shrink-0 cursor-pointer items-center rounded-full border-none px-1 ${
        variant === "from" ? "bg-white/[0.08]" : "bg-white/[0.12]"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center px-1 py-1 pr-1.5">
        <div className="h-7 w-7 overflow-hidden rounded-full">
          <img
            alt={token.symbol}
            className="h-full w-full object-cover"
            height={28}
            src={token.icon}
            width={28}
          />
        </div>
      </div>
      <span className="whitespace-nowrap py-2 font-sans text-base font-medium leading-5 text-white">
        {token.symbol}
      </span>
      <div className="flex h-9 items-center justify-center py-2">
        <ChevronRight className="text-gray-400" size={16} />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Swap phase types
// ---------------------------------------------------------------------------

type SwapPhase = "form" | "processing" | "success" | "error" | "details";

// ---------------------------------------------------------------------------
// Processing state
// ---------------------------------------------------------------------------

function SwapProcessing({
  fromToken,
  toToken,
}: {
  fromToken: SwapToken;
  toToken: SwapToken;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 py-2">
        <span className="font-sans text-lg font-semibold leading-7 text-white">
          Swap {fromToken.symbol} to {toToken.symbol}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-5 px-8 py-6">
          <div className="flex items-center gap-4 py-2">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full">
              <img
                alt={fromToken.symbol}
                className="h-full w-full object-cover"
                height={64}
                src={fromToken.icon}
                width={64}
              />
            </div>
            <ChevronRight
              className="animate-bounce-x text-gray-400"
              size={16}
            />
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full">
              <img
                alt={toToken.symbol}
                className="h-full w-full object-cover"
                height={64}
                src={toToken.icon}
                width={64}
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-sans text-xl font-semibold leading-6 text-white">
              Swapping...
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <button
          className="w-full cursor-default rounded-full bg-gray-600 px-4 py-3 font-sans text-base font-normal leading-5 text-white"
          disabled
          type="button"
        >
          In progress...
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result (success / error)
// ---------------------------------------------------------------------------

function SwapResultView({
  variant,
  fromToken,
  toToken,
  receivedAmount,
  errorMessage,
  onDone,
  onDetails,
}: {
  variant: "success" | "error";
  fromToken: SwapToken;
  toToken: SwapToken;
  receivedAmount: string;
  errorMessage?: string;
  onDone: () => void;
  onDetails: () => void;
}) {
  const isSuccess = variant === "success";

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 py-2">
        <span className="font-sans text-lg font-semibold leading-7 text-white">
          Swap {fromToken.symbol} to {toToken.symbol}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-5 px-8 py-6">
          {/* Status icon */}
          <div className="flex h-20 w-20 items-center justify-center">
            {isSuccess ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <span className="text-3xl text-green-400">&#10003;</span>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <span className="text-3xl text-red-400">!</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-sans text-xl font-semibold leading-6 text-white">
              {isSuccess ? "Swap Completed" : "Swap Failed"}
            </span>
            {isSuccess ? (
              <span className="max-w-[255px] font-sans text-base font-normal leading-5 text-gray-400">
                <span className="text-white">
                  {receivedAmount} {toToken.symbol}
                </span>
                {" has been deposited to your wallet"}
              </span>
            ) : (
              <span className="max-w-[255px] font-sans text-base font-normal leading-5 text-gray-400">
                {errorMessage || "Something went wrong. Please try again."}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-5 py-4">
        {isSuccess && (
          <button
            className="w-full cursor-pointer rounded-full bg-purple-600 px-4 py-3 font-sans text-base font-normal leading-5 text-white transition-colors hover:bg-purple-700"
            onClick={onDetails}
            type="button"
          >
            Transaction Details
          </button>
        )}
        <button
          className={
            isSuccess
              ? "w-full cursor-pointer rounded-full bg-white/[0.08] px-4 py-3 font-sans text-base font-normal leading-5 text-white transition-colors hover:bg-white/[0.12]"
              : "w-full cursor-pointer rounded-full bg-purple-600 px-4 py-3 font-sans text-base font-normal leading-5 text-white transition-colors hover:bg-purple-700"
          }
          onClick={onDone}
          type="button"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transaction detail view
// ---------------------------------------------------------------------------

function SwapTransactionDetail({
  fromToken,
  toToken,
  receivedAmount,
  usdValue,
  signature,
  onDone,
}: {
  fromToken: SwapToken;
  toToken: SwapToken;
  receivedAmount: string;
  usdValue: string;
  signature?: string;
  onDone: () => void;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="px-4 py-2">
        <span className="font-sans text-lg font-semibold leading-7 text-white">
          Swap {fromToken.symbol} to {toToken.symbol}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center overflow-y-auto p-2">
        {/* Amount hero */}
        <div className="flex w-full flex-col px-3 pb-6 pt-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2 whitespace-nowrap font-sans font-semibold">
              <span className="text-[40px] leading-[48px] text-green-400">
                +{receivedAmount}
              </span>
              <span className="text-[28px] leading-8 text-gray-500">
                {toToken.symbol}
              </span>
            </div>
            <span className="font-sans text-base font-normal leading-5 text-gray-400">
              ~{usdValue}
            </span>
            <span className="font-sans text-base font-normal leading-5 text-gray-400">
              {dateStr}, {timeStr}
            </span>
          </div>
        </div>

        {/* Details card */}
        <div className="w-full">
          <div className="flex flex-col rounded-2xl bg-white/[0.06] py-1">
            <div className="px-3 py-2">
              <span className="block font-sans text-[13px] font-normal leading-4 text-gray-400">
                Status
              </span>
              <span className="mt-0.5 block font-sans text-base font-normal leading-5 text-white">
                Completed
              </span>
            </div>
            <div className="px-3 py-2">
              <span className="block font-sans text-[13px] font-normal leading-4 text-gray-400">
                Network Fee
              </span>
              <div className="mt-0.5 flex items-center gap-1 font-sans text-base font-normal leading-5">
                <span className="text-white">0.00005 SOL</span>
                <span className="text-gray-400">~ $0.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex w-full items-center pb-4 pt-5">
          <div className="flex flex-1 flex-col items-center gap-2">
            <button
              className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600/20 transition-colors hover:bg-purple-600/30"
              onClick={() =>
                signature &&
                window.open(
                  `https://explorer.solana.com/tx/${signature}`,
                  "_blank",
                )
              }
              style={{ opacity: signature ? 1 : 0.5 }}
              type="button"
            >
              <Globe className="text-gray-300" size={24} />
            </button>
            <span className="text-center font-sans text-[13px] font-normal leading-4 text-gray-400">
              View in explorer
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-2">
            <button
              className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600/20 transition-colors hover:bg-purple-600/30"
              onClick={() =>
                signature &&
                void navigator.clipboard.writeText(
                  `https://explorer.solana.com/tx/${signature}`,
                )
              }
              style={{ opacity: signature ? 1 : 0.5 }}
              type="button"
            >
              <Share className="text-gray-300" size={24} />
            </button>
            <span className="text-center font-sans text-[13px] font-normal leading-4 text-gray-400">
              Share
            </span>
          </div>
        </div>
      </div>

      {/* Done button */}
      <div className="px-5 py-4">
        <button
          className="w-full cursor-pointer rounded-full bg-purple-600 px-4 py-3 font-sans text-base font-normal leading-5 text-white transition-colors hover:bg-purple-700"
          onClick={onDone}
          type="button"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SwapContent
// ---------------------------------------------------------------------------

export function SwapContent({
  onDone,
  onNavigate,
  fromToken: fromTokenProp,
  toToken: toTokenProp,
  onFromTokenChange,
  onToTokenChange,
  swapMode: _swapMode,
  onSwapModeChange: _onSwapModeChange,
  hideFormChrome,
  onFormActiveChange,
  onFormButtonChange,
}: SwapContentProps) {
  const { signer, connection } = useWalletContext();

  // Jupiter public API does not require a key for basic operations.
  // The wallet-core useSwap hook accepts SwapConfig; pass enabled with empty
  // key so the hook does not short-circuit with "disabled".
  const swapConfig: SwapConfig = { mode: "enabled", apiKey: "" };

  const {
    getQuote,
    executeSwap,
    resetQuote,
    quote,
    isAvailable,
    unavailableReason,
    error: swapError,
  } = useSwap(signer, connection, swapConfig);

  const [fromAmount, setFromAmount] = useState("");
  const [phase, setPhase] = useState<SwapPhase>("form");
  const [resultAmount, setResultAmount] = useState("");
  const [resultUsd, setResultUsd] = useState("");
  const [resultSignature, setResultSignature] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isQuoting, setIsQuoting] = useState(false);
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onFormActiveChange?.(phase === "form");
  }, [phase, onFormActiveChange]);

  const fromToken = fromTokenProp;
  const toToken = toTokenProp;

  const numericFrom = Number.parseFloat(fromAmount) || 0;

  // Use quote output when available, fall back to price ratio estimate
  const toAmount = useMemo(() => {
    if (numericFrom <= 0) return 0;
    if (quote?.outputAmount) return Number.parseFloat(quote.outputAmount);
    if (toToken.price <= 0) return 0;
    return (numericFrom * fromToken.price) / toToken.price;
  }, [numericFrom, fromToken.price, toToken.price, quote]);

  const toUsd = useMemo(() => {
    const val = toAmount * toToken.price;
    return Number.isFinite(val) ? val.toFixed(2) : "0.00";
  }, [toAmount, toToken.price]);

  const hasAmount = numericFrom > 0;
  const insufficientFunds = numericFrom > fromToken.balance;

  // Debounced quote fetching
  useEffect(() => {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    if (!hasAmount || insufficientFunds || phase !== "form") {
      resetQuote();
      setIsQuoting(false);
      return;
    }
    setIsQuoting(true);
    quoteTimerRef.current = setTimeout(() => {
      void getQuote(
        fromToken.symbol,
        toToken.symbol,
        String(numericFrom),
        fromToken.mint,
      ).finally(() => setIsQuoting(false));
    }, 500);
    return () => {
      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    };
  }, [
    fromAmount,
    fromToken.symbol,
    fromToken.mint,
    toToken.symbol,
    hasAmount,
    insufficientFunds,
    phase,
    getQuote,
    resetQuote,
    numericFrom,
  ]);

  const buttonLabel = !isAvailable
    ? (unavailableReason ?? "Swap unavailable")
    : !hasAmount
      ? "Enter Amount"
      : insufficientFunds
        ? "Insufficient Funds"
        : isQuoting
          ? "Getting quote..."
          : !quote
            ? "Enter Amount"
            : "Confirm and Swap";

  const buttonDisabled =
    !isAvailable || !hasAmount || insufficientFunds || isQuoting || !quote;

  const handleSwapTokens = useCallback(() => {
    const prevFrom = fromToken;
    const prevTo = toToken;
    onFromTokenChange(prevTo);
    onToTokenChange(prevFrom);
    if (numericFrom > 0 && prevTo.price > 0) {
      const usdValue = numericFrom * prevFrom.price;
      const converted = usdValue / prevTo.price;
      setFromAmount(String(Number(converted.toFixed(6))));
    } else if (numericFrom > 0) {
      setFromAmount("");
    }
  }, [fromToken, toToken, onFromTokenChange, onToTokenChange, numericFrom]);

  const handleConfirm = useCallback(async () => {
    if (!quote) return;
    setResultAmount(hasAmount ? Number(toAmount.toFixed(6)).toString() : "0");
    setResultUsd(
      `$${
        hasAmount
          ? (toAmount * toToken.price).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "0"
      }`,
    );
    setResultSignature(undefined);
    setErrorMessage(undefined);
    setPhase("processing");

    const result = await executeSwap();

    if (result.success) {
      setResultSignature(result.signature);
      setPhase("success");
      setFromAmount("");
      resetQuote();
    } else {
      setErrorMessage(result.error);
      setPhase("error");
    }
  }, [hasAmount, toAmount, toToken.price, quote, executeSwap, resetQuote]);

  // Report form button props to parent when chrome is managed externally
  useEffect(() => {
    if (!hideFormChrome || !onFormButtonChange) return;
    if (phase !== "form") {
      onFormButtonChange(null);
      return;
    }
    onFormButtonChange({
      label: buttonLabel,
      disabled: buttonDisabled,
      onClick: handleConfirm,
    });
  });

  // Cross-fade between phases
  const [phaseOpacity, setPhaseOpacity] = useState(1);
  const [displayPhase, setDisplayPhase] = useState<SwapPhase>(phase);
  const prevPhase = useRef(phase);
  useEffect(() => {
    if (phase !== prevPhase.current) {
      setPhaseOpacity(0);
      const t = setTimeout(() => {
        setDisplayPhase(phase);
        setPhaseOpacity(1);
        prevPhase.current = phase;
      }, 200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handlePercentage = useCallback(
    (pct: number) => {
      const val =
        pct === 100 ? fromToken.balance : fromToken.balance * (pct / 100);
      setFromAmount(val > 0 ? String(Number(val.toFixed(6))) : "");
    },
    [fromToken.balance],
  );

  // ---------------------------------------------------------------------------
  // Phase renderer
  // ---------------------------------------------------------------------------

  const renderPhaseContent = (p: SwapPhase) => {
    if (p === "processing") {
      return <SwapProcessing fromToken={fromToken} toToken={toToken} />;
    }
    if (p === "success" || p === "error") {
      return (
        <SwapResultView
          errorMessage={errorMessage}
          fromToken={fromToken}
          onDetails={() => setPhase("details")}
          onDone={onDone}
          receivedAmount={resultAmount}
          toToken={toToken}
          variant={p}
        />
      );
    }
    if (p === "details") {
      return (
        <SwapTransactionDetail
          fromToken={fromToken}
          onDone={onDone}
          receivedAmount={resultAmount}
          signature={resultSignature}
          toToken={toToken}
          usdValue={resultUsd}
        />
      );
    }

    // -----------------------------------------------------------------------
    // Form phase
    // -----------------------------------------------------------------------
    const amountTextColor =
      insufficientFunds && hasAmount ? "text-red-400" : "text-white";
    const toAmountColor =
      insufficientFunds && hasAmount
        ? "text-red-400"
        : hasAmount
          ? "text-white"
          : "text-gray-400";

    return (
      <div className="flex flex-1 flex-col">
        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 overflow-auto px-2 pb-4 pt-2">
          {/* Swap inputs container */}
          <div className="relative isolate flex flex-col gap-2 overflow-visible">
            {/* From card */}
            <div className="relative z-[2] rounded-2xl bg-white/[0.06] px-3 py-2.5">
              <div className="flex items-center justify-between whitespace-nowrap font-sans font-normal leading-5">
                <span className="text-base text-gray-400">You swap</span>
                <div className="flex items-center gap-4 text-sm" style={{ color: red }}>
                  <button
                    className="cursor-pointer border-none bg-transparent p-0 font-sans text-sm font-normal opacity-80 hover:opacity-100"
                    onClick={() => handlePercentage(25)}
                    style={{ color: red }}
                    type="button"
                  >
                    25%
                  </button>
                  <button
                    className="cursor-pointer border-none bg-transparent p-0 font-sans text-sm font-normal opacity-80 hover:opacity-100"
                    onClick={() => handlePercentage(50)}
                    style={{ color: red }}
                    type="button"
                  >
                    50%
                  </button>
                  <button
                    className="cursor-pointer border-none bg-transparent p-0 font-sans text-sm font-normal opacity-80 hover:opacity-100"
                    onClick={() => handlePercentage(100)}
                    style={{ color: red }}
                    type="button"
                  >
                    Max
                  </button>
                </div>
              </div>
              <div className="flex h-12 items-center gap-1">
                <input
                  className={`min-w-0 flex-1 border-none bg-transparent p-0 font-sans text-[32px] font-semibold leading-9 outline-none placeholder:text-gray-500 ${amountTextColor}`}
                  inputMode="decimal"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d*$/.test(v)) setFromAmount(v);
                  }}
                  placeholder="0"
                  type="text"
                  value={fromAmount}
                />
                <TokenPill
                  onClick={() =>
                    onNavigate({ type: "tokenSelect", field: "from" })
                  }
                  token={fromToken}
                  variant="from"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.08]">
                    <ArrowDownUp
                      className="text-gray-400 opacity-40"
                      size={12}
                    />
                  </div>
                  <span className="font-sans text-sm font-normal leading-5 text-gray-400">
                    1 {fromToken.symbol} ~ $
                    {fromToken.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                  </span>
                </div>
                <span className="font-sans text-sm font-normal leading-5 text-gray-400">
                  Balance: {fromToken.balance.toLocaleString()}
                </span>
              </div>

              {/* Swap circle */}
              <button
                className="absolute -bottom-[18px] left-[calc(50%+4px)] z-[3] flex h-7 w-7 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-purple-600 transition-colors hover:bg-purple-700"
                onClick={handleSwapTokens}
                type="button"
              >
                <ArrowDownUp className="text-white" size={16} />
              </button>
            </div>

            {/* To card */}
            <div className="z-[1] rounded-2xl bg-white/[0.06] p-3">
              <div className="flex items-center">
                <span className="font-sans text-base font-normal leading-5 text-gray-400">
                  You receive
                </span>
              </div>
              <div className="flex h-12 items-center gap-1">
                <span
                  className={`min-w-0 flex-1 font-sans text-[32px] font-semibold leading-9 ${toAmountColor}`}
                >
                  {hasAmount ? Number(toAmount.toFixed(6)).toString() : "0"}
                </span>
                <TokenPill
                  onClick={() =>
                    onNavigate({ type: "tokenSelect", field: "to" })
                  }
                  token={toToken}
                  variant="to"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm font-normal leading-5 text-gray-400">
                  $
                  {hasAmount
                    ? Number(toUsd).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0"}
                </span>
                <span className="font-sans text-sm font-normal leading-5 text-gray-400">
                  Balance: {toToken.balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Swap error */}
          {swapError && (
            <div className="rounded-xl bg-red-500/10 px-3 py-2">
              <span className="font-sans text-sm font-normal leading-5 text-red-400">
                {swapError}
              </span>
            </div>
          )}

          {/* Details card */}
          {hasAmount && (
            <div className="flex flex-col rounded-2xl bg-white/[0.06] py-1">
              <div className="px-3 py-2.5">
                <span className="block font-sans text-[13px] font-normal leading-4 text-gray-400">
                  Rate
                </span>
                <div className="mt-0.5 flex items-center gap-1 font-sans text-base font-normal leading-5">
                  <span className="text-white">1 {toToken.symbol}</span>
                  <span className="text-gray-400">
                    ~{" "}
                    {fromToken.price > 0
                      ? (toToken.price / fromToken.price).toFixed(2)
                      : "\u2014"}
                  </span>
                </div>
              </div>
              <div className="px-3 py-2.5">
                <span className="block font-sans text-[13px] font-normal leading-4 text-gray-400">
                  Slippage
                </span>
                <span className="mt-0.5 block font-sans text-base font-normal leading-5 text-white">
                  1%
                </span>
              </div>
              <div className="px-3 py-2.5">
                <span className="block font-sans text-[13px] font-normal leading-4 text-gray-400">
                  Network Fee
                </span>
                <div className="mt-0.5 flex items-center gap-1 font-sans text-base font-normal leading-5">
                  <span className="text-white">0.00005 SOL</span>
                  <span className="text-gray-400">~ $0.00</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom button — hidden when parent owns chrome */}
        {!hideFormChrome && (
          <div className="px-5 py-4">
            <button
              className={`w-full rounded-full px-4 py-3 font-sans text-base font-normal leading-5 text-white transition-colors ${
                buttonDisabled
                  ? "cursor-default bg-gray-600"
                  : "cursor-pointer bg-purple-600 hover:bg-purple-700"
              }`}
              disabled={buttonDisabled}
              onClick={handleConfirm}
              type="button"
            >
              {buttonLabel}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      style={{
        opacity: phaseOpacity,
        transition: "opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {renderPhaseContent(displayPhase)}
    </div>
  );
}
