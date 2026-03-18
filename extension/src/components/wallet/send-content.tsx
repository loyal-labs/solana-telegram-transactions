import {
  ArrowDownUp,
  ChevronRight,
  Globe,
  Send,
  Share,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ActivityRow,
  SubView,
  SwapToken,
  TransactionDetail,
} from "@loyal-labs/wallet-core/types";
import { useSend } from "@loyal-labs/wallet-core/hooks";
import { usePrivateSend } from "@loyal-labs/wallet-core/hooks";

import { useWalletContext } from "~/src/components/wallet/wallet-provider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const red = "#F9363C";

function isValidSolanaAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function isTelegramUsername(value: string): boolean {
  return value.startsWith("@") && value.length >= 5;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

type SendPhase = "form" | "processing" | "success" | "error" | "details";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SendContentProps {
  token: SwapToken;
  onNavigate: (view: SubView) => void;
  onDone: () => void;
  addLocalActivity?: (row: ActivityRow, detail: TransactionDetail) => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SendProcessing({ token }: { token: SwapToken }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-5 px-8 py-6">
          <div className="flex h-20 w-20 items-center justify-center">
            <div
              className="h-12 w-12 animate-spin rounded-full border-4 border-transparent"
              style={{ borderTopColor: red, borderRightColor: red }}
            />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-sans text-xl font-semibold leading-6 text-white">
              {token.symbol} is on its way
            </span>
            <span className="max-w-[285px] font-sans text-base font-normal leading-5 text-gray-400">
              Your transaction is being processed and will be completed shortly
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

function SendResult({
  variant,
  token,
  amount,
  recipient,
  isTgRecipient,
  errorMessage,
  onDone,
  onDetails,
}: {
  variant: "success" | "error";
  token: SwapToken;
  amount: string;
  recipient: string;
  isTgRecipient: boolean;
  errorMessage?: string;
  onDone: () => void;
  onDetails: () => void;
}) {
  const isSuccess = variant === "success";
  const displayRecipient = isTgRecipient
    ? recipient
    : truncateAddress(recipient);

  return (
    <div className="flex flex-1 flex-col">
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
              {isSuccess ? `${token.symbol} sent` : "Send failed"}
            </span>
            {isSuccess ? (
              <span className="max-w-[255px] font-sans text-base font-normal leading-5 text-gray-400">
                <span className="text-white">
                  {amount} {token.symbol}
                </span>
                {" successfully sent to "}
                <span className="text-white">{displayRecipient}</span>
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

function SendTransactionDetail({
  token,
  amount,
  recipient,
  isTgRecipient,
  usdValue,
  signature,
  isPrivate,
  onDone,
}: {
  token: SwapToken;
  amount: string;
  recipient: string;
  isTgRecipient: boolean;
  usdValue: string;
  signature?: string;
  isPrivate?: boolean;
  onDone: () => void;
}) {
  const displayRecipient = isTgRecipient
    ? recipient
    : truncateAddress(recipient);
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
          Send to {displayRecipient}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center overflow-y-auto p-2">
        {/* Amount hero */}
        <div className="flex w-full flex-col px-3 pb-6 pt-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2 whitespace-nowrap font-sans font-semibold">
              <span className="text-[40px] leading-[48px]" style={{ color: red }}>
                -{amount}
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
                Recipient
              </span>
              <span className="mt-0.5 block break-all font-sans text-base font-normal leading-5 text-white">
                {recipient}
              </span>
            </div>
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
          {!isPrivate && (
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
          )}
          <div className="flex flex-1 flex-col items-center gap-2">
            <button
              className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600/20 transition-colors hover:bg-purple-600/30"
              onClick={() => {
                if (isPrivate) {
                  void navigator.clipboard.writeText(
                    `Sent ${amount} ${token.symbol} to ${displayRecipient} (${usdValue})`,
                  );
                } else if (signature) {
                  void navigator.clipboard.writeText(
                    `https://explorer.solana.com/tx/${signature}`,
                  );
                }
              }}
              style={{ opacity: isPrivate || signature ? 1 : 0.5 }}
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
// Main SendContent
// ---------------------------------------------------------------------------

export function SendContent({
  onDone,
  onNavigate,
  token,
  addLocalActivity,
}: SendContentProps) {
  const { signer, connection, network } = useWalletContext();

  // Map extension network to SolanaEnv expected by hooks
  const solanaEnv = network === "mainnet" ? "mainnet" : "devnet";

  const { executeSend } = useSend(signer, connection);
  const { executePrivateSend } = usePrivateSend(signer, connection, solanaEnv);

  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [phase, setPhase] = useState<SendPhase>("form");
  const [resultAmount, setResultAmount] = useState("");
  const [resultUsd, setResultUsd] = useState("");
  const [resultRecipient, setResultRecipient] = useState("");
  const [resultIsTg, setResultIsTg] = useState(false);
  const [resultSignature, setResultSignature] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const numericAmount = Number.parseFloat(amount) || 0;
  const hasAmount = numericAmount > 0;
  const insufficientFunds = numericAmount > token.balance;
  const amountTextColor = insufficientFunds && hasAmount ? "text-red-400" : "text-white";

  const usdValue = useMemo(
    () => (numericAmount * token.price).toFixed(2),
    [numericAmount, token.price],
  );

  const recipientTrimmed = recipient.trim();
  const hasRecipient = recipientTrimmed.length > 0;
  const startsWithAt = recipientTrimmed.startsWith("@");
  const isTg = isTelegramUsername(recipientTrimmed);
  const isWallet = isValidSolanaAddress(recipientTrimmed);
  const isValidRecipient = isTg || isWallet;
  const showInvalidHint = hasRecipient && !isValidRecipient && !startsWithAt;
  const isTgNonSol = isTg && token.symbol.toUpperCase() !== "SOL";

  const buttonLabel = !hasAmount
    ? "Enter Amount"
    : insufficientFunds
      ? "Insufficient Funds"
      : !hasRecipient
        ? "Enter Recipient"
        : !isValidRecipient
          ? "Invalid Address"
          : isTgNonSol
            ? "Only SOL for Telegram"
            : "Send";
  const buttonDisabled =
    !hasAmount || insufficientFunds || !isValidRecipient || isTgNonSol;

  const handlePercentage = useCallback(
    (pct: number) => {
      const val = pct === 100 ? token.balance : token.balance * (pct / 100);
      setAmount(val > 0 ? String(Number(val.toFixed(6))) : "");
    },
    [token.balance],
  );

  const handleConfirm = useCallback(async () => {
    const currentAmount = hasAmount ? String(numericAmount) : "0";
    const currentUsd = `$${
      hasAmount
        ? (numericAmount * token.price).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "0"
    }`;
    setResultAmount(currentAmount);
    setResultUsd(currentUsd);
    setResultRecipient(recipientTrimmed);
    setResultIsTg(isTg);
    setResultSignature(undefined);
    setErrorMessage(undefined);
    setPhase("processing");

    const destinationType = isTg ? "telegram" : "wallet";
    const cleanRecipient = isTg
      ? recipientTrimmed.replace(/^@/, "")
      : recipientTrimmed;

    let result: { success: boolean; signature?: string; error?: string };

    if (isPrivate) {
      result = await executePrivateSend({
        tokenSymbol: token.symbol,
        amount: numericAmount,
        recipient: cleanRecipient,
        recipientType: destinationType,
        tokenMint: token.mint,
      });
    } else {
      result = await executeSend(
        token.symbol,
        currentAmount,
        cleanRecipient,
        destinationType,
        token.mint,
      );
    }

    if (result.success) {
      setResultSignature(result.signature);
      setPhase("success");
      setAmount("");
      setRecipient("");

      if (isPrivate && addLocalActivity) {
        const now = new Date();
        const syntheticRow: ActivityRow = {
          id: result.signature ?? `private-${Date.now()}`,
          type: "sent",
          counterparty: cleanRecipient,
          amount: `-${currentAmount} ${token.symbol}`,
          timestamp: now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          date: now.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          }),
          icon: "",
          isPrivate: true,
          rawTimestamp: now.getTime(),
        };
        const syntheticDetail: TransactionDetail = {
          activity: syntheticRow,
          usdValue: currentUsd,
          status: "Completed",
          networkFee: "0.00005 SOL",
          networkFeeUsd: "$0.00",
          isPrivate: true,
        };
        addLocalActivity(syntheticRow, syntheticDetail);
      }
    } else {
      setErrorMessage(result.error);
      setPhase("error");
    }
  }, [
    hasAmount,
    numericAmount,
    token.price,
    token.symbol,
    token.mint,
    recipientTrimmed,
    isTg,
    isPrivate,
    executeSend,
    executePrivateSend,
    addLocalActivity,
  ]);

  // Cross-fade between phases
  const [phaseOpacity, setPhaseOpacity] = useState(1);
  const [displayPhase, setDisplayPhase] = useState<SendPhase>(phase);
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

  const renderPhaseContent = (p: SendPhase) => {
    if (p === "processing") {
      return <SendProcessing token={token} />;
    }
    if (p === "success" || p === "error") {
      return (
        <SendResult
          amount={resultAmount}
          errorMessage={errorMessage}
          isTgRecipient={resultIsTg}
          onDetails={() => setPhase("details")}
          onDone={onDone}
          recipient={resultRecipient}
          token={token}
          variant={p}
        />
      );
    }
    if (p === "details") {
      return (
        <SendTransactionDetail
          amount={resultAmount}
          isPrivate={isPrivate}
          isTgRecipient={resultIsTg}
          onDone={onDone}
          recipient={resultRecipient}
          signature={resultSignature}
          token={token}
          usdValue={resultUsd}
        />
      );
    }

    // ----- Form phase -----
    return (
      <div className="flex flex-1 flex-col">
        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-2 pb-4">
          {/* Amount card */}
          <div className="flex flex-col">
            <div className="rounded-2xl bg-white/[0.06] px-3 py-2.5">
              <div className="flex items-center justify-between whitespace-nowrap font-sans font-normal leading-5">
                <span className="text-base text-gray-400">Amount</span>
                <div className="flex items-center gap-4 text-sm">
                  <button
                    className="border-none bg-transparent p-0 font-sans text-sm font-normal text-purple-400 hover:opacity-70"
                    onClick={() => handlePercentage(25)}
                    type="button"
                  >
                    25%
                  </button>
                  <button
                    className="border-none bg-transparent p-0 font-sans text-sm font-normal text-purple-400 hover:opacity-70"
                    onClick={() => handlePercentage(50)}
                    type="button"
                  >
                    50%
                  </button>
                  <button
                    className="border-none bg-transparent p-0 font-sans text-sm font-normal text-purple-400 hover:opacity-70"
                    onClick={() => handlePercentage(100)}
                    type="button"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="flex h-12 items-center gap-1">
                <input
                  className={`min-w-0 flex-1 border-none bg-transparent p-0 font-sans text-[32px] font-semibold leading-9 outline-none ${amountTextColor} placeholder:text-gray-600`}
                  inputMode="decimal"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d*$/.test(v)) setAmount(v);
                  }}
                  placeholder="0"
                  type="text"
                  value={amount}
                />
                <button
                  className="flex shrink-0 cursor-pointer items-center rounded-full border-none bg-white/[0.08] px-1"
                  onClick={() => onNavigate({ type: "sendTokenSelect" })}
                  type="button"
                >
                  <div className="flex items-center p-1 pr-1.5">
                    <div className="h-7 w-7 overflow-hidden rounded-full">
                      <img
                        alt={token.symbol}
                        className="h-full w-full object-cover"
                        src={token.icon}
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
                    {hasAmount
                      ? `~$${Number(usdValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `1 ${token.symbol} ~ $${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}
                  </span>
                </div>
                <span className="font-sans text-sm font-normal leading-5 text-gray-400">
                  Balance: {token.balance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Recipient section */}
            <div className="px-3 pb-2 pt-3">
              <span className="font-sans text-base font-normal leading-5 text-gray-400">
                Recipient
              </span>
            </div>
            <div className="flex items-start overflow-hidden rounded-2xl bg-white/[0.06] px-3">
              {hasRecipient && (
                <div className="flex shrink-0 items-center pr-3 pt-[15px] text-gray-300">
                  {startsWithAt ? <Send size={20} /> : <Wallet size={20} />}
                </div>
              )}
              <textarea
                className="min-w-0 flex-1 resize-none overflow-hidden border-none bg-transparent py-[15px] font-sans text-base font-normal leading-5 text-white outline-none placeholder:text-gray-500"
                onChange={(e) => setRecipient(e.target.value.replace(/\n/g, ""))}
                placeholder="Address or Telegram username"
                rows={1}
                style={{ wordBreak: "break-all", fieldSizing: "content" } as React.CSSProperties}
                value={recipient}
              />
              {hasRecipient && (
                <button
                  className="flex shrink-0 cursor-pointer items-center justify-center border-none bg-transparent py-[15px] pl-3 text-gray-300 hover:opacity-70"
                  onClick={() => setRecipient("")}
                  type="button"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {showInvalidHint && (
              <div className="px-3 pt-1">
                <span className="font-sans text-sm font-normal leading-5 text-red-400">
                  Invalid address
                </span>
              </div>
            )}
          </div>

          {/* Private Send toggle */}
          <button
            className="flex cursor-pointer items-center rounded-2xl border-none px-3 transition-colors hover:bg-white/[0.06]"
            onClick={() => setIsPrivate(!isPrivate)}
            style={{
              background: isPrivate ? "rgba(255,255,255,0.06)" : "transparent",
            }}
            type="button"
          >
            <div className="flex shrink-0 items-center py-1 pr-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/20">
                <span className="text-lg text-purple-400">&#9881;</span>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-2.5">
              <span className="text-left font-sans text-base font-normal leading-5 text-white">
                Private Send
              </span>
              <span className="text-left font-sans text-[13px] font-normal leading-4 text-gray-400">
                Prevents the recipient from seeing which wallet sent the funds
              </span>
            </div>
            <div className="shrink-0 pl-3">
              <div
                className="relative h-[31px] w-[51px] rounded-full transition-colors"
                style={{
                  background: isPrivate ? "rgb(147, 51, 234)" : "rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="absolute top-1/2 h-[27px] w-[27px] -translate-y-1/2 rounded-full bg-white shadow-md transition-[left]"
                  style={{ left: isPrivate ? "22px" : "2px" }}
                />
              </div>
            </div>
          </button>
        </div>

        {/* Bottom button */}
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
