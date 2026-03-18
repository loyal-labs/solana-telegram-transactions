import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useCallback, useState } from "react";

import type {
  ActivityRow,
  SubView,
  TokenRow,
  TransactionDetail,
} from "@loyal-labs/wallet-core/types";

import { ActivityRowItem } from "./activity-row-item";
import { TokenRowItem } from "./token-row-item";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PortfolioContentProps {
  tokenRows: TokenRow[];
  allTokenRows?: TokenRow[];
  activityRows: ActivityRow[];
  transactionDetails: Record<string, TransactionDetail>;
  balanceWhole: string;
  balanceFraction: string;
  balanceSolLabel: string;
  walletLabel: string;
  walletAddress: string | null;
  isLoading: boolean;
  isBalanceHidden: boolean;
  onBalanceHiddenChange: (hidden: boolean) => void;
  onNavigate: (view: SubView) => void;
}

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------

function SkeletonBar({ width, height }: { width: string; height: string }) {
  return (
    <div
      className="animate-pulse rounded-md bg-gray-700"
      style={{ width, height }}
    />
  );
}

function SkeletonCircle({ size }: { size: string }) {
  return (
    <div
      className="shrink-0 animate-pulse rounded-full bg-gray-700"
      style={{ width: size, height: size }}
    />
  );
}

function SkeletonTokenRow() {
  return (
    <div className="flex w-full items-center gap-3 px-3 py-2.5">
      <SkeletonCircle size="40px" />
      <div className="flex flex-1 flex-col gap-1.5">
        <SkeletonBar width="80px" height="14px" />
        <SkeletonBar width="50px" height="12px" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <SkeletonBar width="60px" height="14px" />
        <SkeletonBar width="40px" height="12px" />
      </div>
    </div>
  );
}

function SkeletonActivityRow() {
  return (
    <div className="flex w-full items-center gap-3 px-3 py-2.5">
      <SkeletonCircle size="36px" />
      <div className="flex flex-1 flex-col gap-1.5">
        <SkeletonBar width="100px" height="14px" />
        <SkeletonBar width="60px" height="12px" />
      </div>
      <SkeletonBar width="50px" height="14px" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// PortfolioContent
// ---------------------------------------------------------------------------

export function PortfolioContent({
  activityRows,
  balanceFraction,
  balanceSolLabel,
  balanceWhole,
  isBalanceHidden,
  isLoading,
  onBalanceHiddenChange,
  onNavigate,
  tokenRows,
  transactionDetails,
  walletAddress,
  walletLabel,
}: PortfolioContentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!walletAddress) return;
      void navigator.clipboard.writeText(walletAddress).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [walletAddress],
  );

  // -------------------------------------------------------------------------
  // Loading skeleton
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <>
        {/* Balance skeleton */}
        <div className="flex w-full items-start gap-4 px-5 pb-3 pt-5">
          <SkeletonCircle size="64px" />
          <div className="flex flex-1 flex-col gap-2">
            <SkeletonBar width="100px" height="16px" />
            <SkeletonBar width="140px" height="28px" />
            <SkeletonBar width="70px" height="14px" />
          </div>
        </div>

        {/* Tokens skeleton */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex w-full flex-col p-2">
            <div className="px-3 pb-2 pt-3">
              <SkeletonBar width="60px" height="16px" />
            </div>
            <SkeletonTokenRow />
            <SkeletonTokenRow />
            <SkeletonTokenRow />
          </div>

          {/* Activity skeleton */}
          <div className="flex w-full flex-col p-2">
            <div className="px-3 pb-2 pt-3">
              <SkeletonBar width="70px" height="16px" />
            </div>
            <SkeletonActivityRow />
            <SkeletonActivityRow />
          </div>
        </div>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Main content
  // -------------------------------------------------------------------------

  return (
    <>
      {/* Balance section */}
      <div className="flex w-full items-start gap-4 rounded-2xl px-5 pb-3 pt-5">
        {/* Wallet avatar — purple circle placeholder */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/10 bg-purple-600" />

        <div className="flex flex-1 flex-col gap-2">
          {/* Wallet label + copy address */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-sans text-sm leading-5 text-gray-400">
              {walletLabel}
              {walletAddress && (
                <button
                  className="inline-flex shrink-0 cursor-pointer items-center border-none bg-transparent p-px transition-colors"
                  onClick={handleCopyAddress}
                  style={{
                    color: copied ? "#34C759" : "rgb(107, 114, 128)",
                  }}
                  type="button"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              )}
            </span>
          </div>

          {/* Balance amount */}
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-lg">
              <span
                className="block font-sans text-[28px] font-semibold leading-8"
                style={{
                  color: isBalanceHidden ? "#6b7280" : "#fff",
                  filter: isBalanceHidden ? "blur(6px)" : "none",
                  transition: "filter 0.15s ease, color 0.15s ease",
                  userSelect: isBalanceHidden ? "none" : "auto",
                }}
              >
                {balanceWhole}
                <span
                  style={{
                    color: isBalanceHidden ? "#6b7280" : "rgb(156, 163, 175)",
                    transition: "color 0.15s ease",
                  }}
                >
                  {balanceFraction}
                </span>
              </span>
            </div>

            <button
              className="flex shrink-0 cursor-pointer items-center border-none bg-transparent p-0"
              onClick={() => onBalanceHiddenChange(!isBalanceHidden)}
              type="button"
            >
              {isBalanceHidden ? (
                <EyeOff
                  className="text-gray-500"
                  size={22}
                  strokeWidth={1.5}
                />
              ) : (
                <Eye
                  className="text-gray-500"
                  size={22}
                  strokeWidth={1.5}
                />
              )}
            </button>
          </div>

          {/* SOL sub-label */}
          <div className="overflow-hidden rounded-md">
            <span
              className="block font-sans text-sm leading-5"
              style={{
                color: isBalanceHidden ? "#6b7280" : "rgb(156, 163, 175)",
                filter: isBalanceHidden ? "blur(6px)" : "none",
                transition: "filter 0.15s ease, color 0.15s ease",
                userSelect: isBalanceHidden ? "none" : "auto",
              }}
            >
              {balanceSolLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Tokens section */}
        <div className="flex w-full flex-col items-center p-2">
          <div className="w-full px-3 pb-2 pt-3">
            <span className="font-sans text-base font-medium leading-5 tracking-tight text-white">
              Tokens
            </span>
          </div>

          {tokenRows.map((token) => (
            <TokenRowItem
              isBalanceHidden={isBalanceHidden}
              key={token.id ?? token.symbol}
              token={token}
            />
          ))}

          <div className="flex w-full flex-col items-center justify-center pt-2">
            <button
              className="cursor-pointer rounded-full border-none bg-purple-600/20 px-4 py-2 font-sans text-[15px] leading-5 text-white transition-colors hover:bg-purple-600/30"
              onClick={() => onNavigate("allTokens")}
              type="button"
            >
              Show All
            </button>
          </div>
        </div>

        {/* Activity section */}
        <div className="flex w-full flex-col items-center p-2">
          <div className="w-full px-3 pb-2 pt-3">
            <span className="font-sans text-base font-medium leading-5 tracking-tight text-white">
              Activity
            </span>
          </div>

          {activityRows.map((activity) => (
            <ActivityRowItem
              activity={activity}
              isBalanceHidden={isBalanceHidden}
              key={activity.id}
              onClick={() =>
                onNavigate({
                  type: "transaction",
                  detail: transactionDetails[activity.id],
                  from: "portfolio",
                })
              }
            />
          ))}

          {!isLoading && activityRows.length === 0 && (
            <div className="px-5 py-3 text-center font-sans text-sm text-gray-400">
              No activity yet
            </div>
          )}

          <div className="flex w-full flex-col items-center justify-center pt-2">
            <button
              className="cursor-pointer rounded-full border-none bg-purple-600/20 px-4 py-2 font-sans text-[15px] leading-5 text-white transition-colors hover:bg-purple-600/30"
              onClick={() => onNavigate("allActivity")}
              type="button"
            >
              Show All
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
