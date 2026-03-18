import { ArrowDownUp, ChevronRight, Globe, Share, Shield } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  FormButtonProps,
  SubView,
  SwapMode,
  SwapToken,
} from "@loyal-labs/wallet-core/types";
import { useShield } from "@loyal-labs/wallet-core/hooks";

import { useWalletContext } from "~/src/components/wallet/wallet-provider";

// ---------------------------------------------------------------------------
// Helpers / constants
// ---------------------------------------------------------------------------

const red = "#F9363C";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ShieldContentProps {
  token: SwapToken;
  onTokenChange: (token: SwapToken) => void;
  onNavigate: (view: SubView) => void;
  onDone: () => void;
  securedBalance: number;
  swapMode: SwapMode;
  onSwapModeChange: (mode: SwapMode) => void;
  onFormActiveChange?: (active: boolean) => void;
  onFormButtonChange?: (props: FormButtonProps | null) => void;
  hideFormChrome?: boolean;
}

// ---------------------------------------------------------------------------
// SwapShieldTabs — exported for use by parent WalletApp
// ---------------------------------------------------------------------------

export function SwapShieldTabs({
  mode,
  onModeChange,
}: {
  mode: SwapMode;
  onModeChange: (mode: SwapMode) => void;
}) {
  return (
    <div className="flex items-center p-2">
      <div className="flex items-center overflow-hidden rounded-full bg-white/[0.06] p-1">
        <button
          className={`flex items-center justify-center gap-1.5 rounded-full border-none px-4 py-2 font-sans text-[15px] leading-5 transition-colors ${
            mode === "swap"
              ? "bg-white/[0.12] font-medium text-white"
              : "cursor-pointer bg-transparent font-normal text-gray-400"
          }`}
          onClick={() => onModeChange("swap")}
          type="button"
        >
          Swap
        </button>
        <button
          className={`flex items-center justify-center gap-1.5 rounded-full border-none py-2 pl-2 pr-4 font-sans text-[15px] leading-5 transition-colors ${
            mode === "shield"
              ? "bg-white/[0.12] font-medium text-white"
              : "cursor-pointer bg-transparent font-normal text-gray-400"
          }`}
          onClick={() => onModeChange("shield")}
          type="button"
        >
          <Shield className="h-5 w-5" />
          Shield
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Token pills
// ---------------------------------------------------------------------------

function ShieldedTokenPill({ token }: { token: SwapToken }) {
  return (
    <div className="flex shrink-0 items-center px-1">
      <div className="relative flex items-center px-1 py-1 pr-3.5">
        <div className="mr-[-8px] h-7 w-7 overflow-hidden rounded-full">
          <img
            alt={token.symbol}
            className="h-full w-full object-cover"
            height={28}
            src={token.icon}
            width={28}
          />
        </div>
        <Shield className="absolute bottom-0.5 right-0.5 h-4 w-4 text-purple-400" />
      </div>
      <span className="whitespace-nowrap py-2 font-sans text-base font-medium leading-5 text-white">
        {token.symbol}
      </span>
    </div>
  );
}

function SelectableTokenPill({
  token,
  onClick,
}: {
  token: SwapToken;
  onClick: () => void;
}) {
  return (
    <button
      className="flex shrink-0 cursor-pointer items-center rounded-full border-none bg-white/[0.08] px-1"
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

function ShieldedSelectableTokenPill({
  token,
  onClick,
}: {
  token: SwapToken;
  onClick: () => void;
}) {
  return (
    <button
      className="flex shrink-0 cursor-pointer items-center rounded-full border-none bg-white/[0.08] px-1"
      onClick={onClick}
      type="button"
    >
      <div className="relative flex items-center px-1 py-1 pr-3.5">
        <div className="mr-[-8px] h-7 w-7 overflow-hidden rounded-full">
          <img
            alt={token.symbol}
            className="h-full w-full object-cover"
            height={28}
            src={token.icon}
            width={28}
          />
        </div>
        <Shield className="absolute bottom-0.5 right-0.5 h-4 w-4 text-purple-400" />
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
// Phase types
// ---------------------------------------------------------------------------

type ShieldPhase = "form" | "processing" | "success" | "error" | "details";

// ---------------------------------------------------------------------------
// Processing state
// ---------------------------------------------------------------------------

function ShieldProcessing({
  token,
  direction,
}: {
  token: SwapToken;
  direction: "shield" | "unshield";
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 py-2">
        <span className="font-sans text-lg font-semibold leading-7 text-white">
          {direction === "shield" ? "Shield" : "Unshield"}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-5 px-8 py-6">
          <div className="flex items-center gap-4 py-2">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full">
              <img
                alt={token.symbol}
                className="h-full w-full object-cover"
                height={64}
                src={token.icon}
                width={64}
              />
            </div>
            <ChevronRight
              className="animate-bounce-x text-gray-400"
              size={16}
            />
            <div className="flex h-16 w-16 shrink-0 items-center justify-center">
              <Shield className="h-12 w-12 text-purple-400" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-sans text-xl font-semibold leading-6 text-white">
              {direction === "shield" ? "Shielding..." : "Unshielding..."}
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

function ShieldResultView({
  variant,
  token,
  direction,
  resultAmount,
  errorMessage,
  onDone,
  onDetails,
}: {
  variant: "success" | "error";
  token: SwapToken;
  direction: "shield" | "unshield";
  resultAmount: string;
  errorMessage?: string;
  onDone: () => void;
  onDetails: () => void;
}) {
  const isSuccess = variant === "success";

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 py-2">
        <span className="font-sans text-lg font-semibold leading-7 text-white">
          {isSuccess
            ? direction === "shield"
              ? "Shield"
              : "Unshield"
            : "Shield/Unshield"}
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
              {isSuccess
                ? `${token.symbol} ${direction === "shield" ? "Shielded" : "Unshielded"}`
                : direction === "shield"
                  ? "Shielding Failed"
                  : "Unshielding Failed"}
            </span>
            {isSuccess ? (
              <span className="max-w-[255px] font-sans text-base font-normal leading-5 text-gray-400">
                <span className="text-white">
                  {resultAmount} {token.symbol}
                </span>
                {` moved to your ${direction === "shield" ? "secure" : "main"} balance`}
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

function ShieldTransactionDetail({
  token,
  direction,
  resultAmount,
  usdValue,
  onDone,
}: {
  token: SwapToken;
  direction: "shield" | "unshield";
  resultAmount: string;
  usdValue: string;
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
          {direction === "shield" ? "Shielded" : "Unshielded"}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center overflow-y-auto p-2">
        {/* Token icon with badge */}
        <div className="w-full px-3 pt-2">
          <div className="relative h-14 w-12">
            <div className="h-12 w-12 overflow-hidden rounded-full">
              <img
                alt={token.symbol}
                className="h-full w-full object-cover"
                height={48}
                src={token.icon}
                width={48}
              />
            </div>
            <Shield className="absolute bottom-0 left-4 h-6 w-6 text-purple-400" />
          </div>
        </div>

        {/* Amount hero */}
        <div className="flex w-full flex-col px-3 pb-6 pt-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2 whitespace-nowrap font-sans font-semibold">
              <span className="text-[40px] leading-[48px] text-white">
                {resultAmount}
              </span>
              <span className="text-[28px] leading-8 text-gray-500">
                {token.symbol}
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
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex w-full items-center pb-4 pt-5">
          <div className="flex flex-1 flex-col items-center gap-2">
            <button
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-purple-600/20 transition-colors hover:bg-purple-600/30"
              onClick={() =>
                void navigator.clipboard.writeText(
                  `${direction} ${resultAmount} ${token.symbol}`,
                )
              }
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
// Main ShieldContent
// ---------------------------------------------------------------------------

export function ShieldContent({
  onDone,
  onNavigate,
  token: tokenProp,
  onTokenChange: _onTokenChange,
  securedBalance,
  swapMode: _swapMode,
  onSwapModeChange: _onSwapModeChange,
  hideFormChrome,
  onFormActiveChange,
  onFormButtonChange,
}: ShieldContentProps) {
  const { signer, connection, network } = useWalletContext();

  // Map extension network to SolanaEnv expected by hooks
  const solanaEnv = network === "mainnet" ? "mainnet" : "devnet";

  const {
    executeShield: shieldFn,
    executeUnshield: unshieldFn,
  } = useShield(signer, connection, solanaEnv);

  const [direction, setDirection] = useState<"shield" | "unshield">("shield");
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<ShieldPhase>("form");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [resultAmount, setResultAmount] = useState("");
  const [resultUsd, setResultUsd] = useState("");

  useEffect(() => {
    onFormActiveChange?.(phase === "form");
  }, [phase, onFormActiveChange]);

  const token = tokenProp;
  const numericAmount = Number.parseFloat(amount) || 0;
  const hasAmount = numericAmount > 0;

  const sourceBalance =
    direction === "shield" ? token.balance : securedBalance;
  const destBalance =
    direction === "shield" ? securedBalance : token.balance;
  const insufficientFunds = numericAmount > sourceBalance;

  const usdValue = useMemo(
    () =>
      (numericAmount * token.price).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [numericAmount, token.price],
  );

  const exchangeRate = useMemo(
    () =>
      `1 ${token.symbol} ~ $${token.price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })}`,
    [token.symbol, token.price],
  );

  const buttonLabel = !hasAmount
    ? "Enter Amount"
    : insufficientFunds
      ? "Insufficient Funds"
      : direction === "shield"
        ? "Confirm and Shield"
        : "Confirm and Unshield";
  const buttonDisabled = !hasAmount || insufficientFunds;

  const handleToggleDirection = useCallback(() => {
    setDirection((d) => (d === "shield" ? "unshield" : "shield"));
  }, []);

  const handlePercentage = useCallback(
    (pct: number) => {
      const bal = sourceBalance;
      const val = pct === 100 ? bal : bal * (pct / 100);
      setAmount(val > 0 ? String(Number(val.toFixed(6))) : "");
    },
    [sourceBalance],
  );

  const handleConfirm = useCallback(async () => {
    if (!hasAmount || insufficientFunds) return;

    setResultAmount(String(numericAmount));
    setResultUsd(
      `$${(numericAmount * token.price).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    );
    setErrorMessage(undefined);
    setPhase("processing");

    const params = {
      tokenSymbol: token.symbol,
      amount: numericAmount,
      tokenMint: token.mint,
    };

    const result =
      direction === "shield"
        ? await shieldFn(params)
        : await unshieldFn(params);

    if (result.success) {
      setPhase("success");
      setAmount("");
    } else {
      setErrorMessage(result.error);
      setPhase("error");
    }
  }, [
    hasAmount,
    insufficientFunds,
    numericAmount,
    token.price,
    token.symbol,
    token.mint,
    direction,
    shieldFn,
    unshieldFn,
  ]);

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
  const [displayPhase, setDisplayPhase] = useState<ShieldPhase>(phase);
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

  // ---------------------------------------------------------------------------
  // Phase renderer
  // ---------------------------------------------------------------------------

  const renderPhaseContent = (p: ShieldPhase) => {
    if (p === "processing") {
      return <ShieldProcessing direction={direction} token={token} />;
    }
    if (p === "success" || p === "error") {
      return (
        <ShieldResultView
          direction={direction}
          errorMessage={errorMessage}
          onDetails={() => setPhase("details")}
          onDone={() => {
            setPhase("form");
            onDone();
          }}
          resultAmount={resultAmount}
          token={token}
          variant={p}
        />
      );
    }
    if (p === "details") {
      return (
        <ShieldTransactionDetail
          direction={direction}
          onDone={() => {
            setPhase("form");
            onDone();
          }}
          resultAmount={resultAmount}
          token={token}
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
        <div className="flex flex-1 flex-col gap-0 overflow-auto px-2 pb-4 pt-2">
          {/* Input cards container */}
          <div className="relative isolate flex flex-col gap-2 overflow-visible">
            {/* From card */}
            <div className="relative z-[2] rounded-2xl bg-white/[0.06] px-3 py-2.5">
              <div className="flex items-center justify-between whitespace-nowrap font-sans font-normal leading-5">
                <span className="text-base text-gray-400">
                  {direction === "shield" ? "You shield" : "You unshield"}
                </span>
                <div
                  className="flex items-center gap-4 text-sm"
                  style={{ color: red }}
                >
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
                    if (v === "" || /^\d*\.?\d*$/.test(v)) setAmount(v);
                  }}
                  placeholder="0"
                  type="text"
                  value={amount}
                />
                {direction === "shield" ? (
                  <SelectableTokenPill
                    onClick={() =>
                      onNavigate({ type: "shieldTokenSelect" })
                    }
                    token={token}
                  />
                ) : (
                  <ShieldedSelectableTokenPill
                    onClick={() =>
                      onNavigate({ type: "shieldTokenSelect" })
                    }
                    token={token}
                  />
                )}
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
                    {exchangeRate}
                  </span>
                </div>
                <span className="font-sans text-sm font-normal leading-5 text-gray-400">
                  Balance: {sourceBalance.toLocaleString()}
                </span>
              </div>

              {/* Swap circle — toggles shield/unshield */}
              <button
                className="absolute -bottom-[18px] left-[calc(50%+4px)] z-[3] flex h-7 w-7 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-purple-600 transition-colors hover:bg-purple-700"
                onClick={handleToggleDirection}
                type="button"
              >
                <ArrowDownUp className="text-white" size={16} />
              </button>
            </div>

            {/* To card */}
            <div className="z-[1] rounded-2xl border border-white/[0.08] p-3">
              <div className="flex items-center">
                <span className="font-sans text-base font-normal leading-5 text-gray-400">
                  You receive
                </span>
              </div>
              <div className="flex h-12 items-center gap-1">
                <span
                  className={`min-w-0 flex-1 font-sans text-[32px] font-semibold leading-9 ${toAmountColor}`}
                >
                  {hasAmount ? amount : "0"}
                </span>
                {direction === "shield" ? (
                  <ShieldedTokenPill token={token} />
                ) : (
                  <div className="flex shrink-0 items-center px-1">
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
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm font-normal leading-5 text-gray-400">
                  ${hasAmount ? usdValue : "0"}
                </span>
                <span className="font-sans text-sm font-normal leading-5 text-gray-400">
                  Balance: {destBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Info card about shielded assets */}
          <div className="px-3">
            <div className="flex items-center overflow-hidden rounded-2xl bg-white/[0.06] px-3">
              <div className="shrink-0 py-1 pr-3">
                <Shield className="h-10 w-10 text-purple-400" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5 py-2.5">
                <span className="font-sans text-base font-normal leading-5 text-white">
                  What are Shielded Assets?
                </span>
                <span className="font-sans text-[13px] font-normal leading-4 text-gray-400">
                  When you shield assets, they move to your private balance.
                  This enables private transactions without revealing your
                  address or sensitive data on-chain.
                </span>
              </div>
            </div>
          </div>
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
