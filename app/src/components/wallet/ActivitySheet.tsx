"use client";

import { hapticFeedback } from "@telegram-apps/sdk-react";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import { ArrowDown, ArrowUp, Clock, TriangleAlert, X } from "lucide-react";
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
import {
  formatSenderAddress,
  formatTransactionAmount,
} from "@/lib/solana/wallet/formatters";
import type { IncomingTransaction, Transaction } from "@/types/wallet";

const ITEMS_PER_PAGE = 10;

export type ActivitySheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  walletTransactions: Transaction[];
  incomingTransactions: IncomingTransaction[];
  onTransactionClick: (transaction: Transaction) => void;
  onIncomingTransactionClick: (transaction: IncomingTransaction) => void;
  claimingTransactionId?: string | null;
  balance?: number | null;
  starsBalance?: number;
  isLoading?: boolean;
};

type GroupedTransactions = {
  label: string;
  items: Array<
    | { type: "wallet"; transaction: Transaction }
    | { type: "incoming"; transaction: IncomingTransaction }
  >;
};

function getDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time portion for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Today";
  }
  if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupTransactionsByDay(
  walletTransactions: Transaction[],
  incomingTransactions: IncomingTransaction[]
): GroupedTransactions[] {
  // Combine all transactions with unified structure
  const allTransactions: Array<{
    timestamp: number;
    item:
      | { type: "wallet"; transaction: Transaction }
      | { type: "incoming"; transaction: IncomingTransaction };
  }> = [];

  // Add wallet transactions
  for (const tx of walletTransactions) {
    allTransactions.push({
      timestamp: tx.timestamp,
      item: { type: "wallet", transaction: tx },
    });
  }

  // Add incoming transactions (use current time as they don't have timestamps)
  for (const tx of incomingTransactions) {
    allTransactions.push({
      timestamp: Date.now(), // Incoming claimable transactions are current
      item: { type: "incoming", transaction: tx },
    });
  }

  // Sort by timestamp descending
  allTransactions.sort((a, b) => b.timestamp - a.timestamp);

  // Group by date label
  const groups = new Map<string, GroupedTransactions>();

  for (const { timestamp, item } of allTransactions) {
    const label = getDateLabel(timestamp);
    if (!groups.has(label)) {
      groups.set(label, { label, items: [] });
    }
    groups.get(label)!.items.push(item);
  }

  // Convert to array preserving order
  return Array.from(groups.values());
}

export default function ActivitySheet({
  trigger,
  open,
  onOpenChange,
  walletTransactions,
  incomingTransactions,
  onTransactionClick,
  onIncomingTransactionClick,
  claimingTransactionId,
  balance,
  starsBalance = 0,
  isLoading = false,
}: ActivitySheetProps) {
  const snapPoint = useModalSnapPoint();
  const { bottom: safeBottom } = useTelegramSafeArea();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Reset visible count when sheet opens
  useEffect(() => {
    if (open) {
      setVisibleCount(ITEMS_PER_PAGE);
    }
  }, [open]);

  const modalStyle = useMemo(
    () =>
      ({
        "--tgui--bg_color": "transparent",
        "--tgui--divider": "rgba(255, 255, 255, 0.05)",
      }) as CSSProperties,
    []
  );

  const [snapPoints] = useMemo(() => [[snapPoint]], [snapPoint]);

  // Get all sorted transactions first
  const allSortedTransactions = useMemo(() => {
    const all: Array<{
      timestamp: number;
      item:
        | { type: "wallet"; transaction: Transaction }
        | { type: "incoming"; transaction: IncomingTransaction };
    }> = [];

    for (const tx of walletTransactions) {
      all.push({
        timestamp: tx.timestamp,
        item: { type: "wallet", transaction: tx },
      });
    }

    for (const tx of incomingTransactions) {
      all.push({
        timestamp: Date.now(),
        item: { type: "incoming", transaction: tx },
      });
    }

    return all.sort((a, b) => b.timestamp - a.timestamp);
  }, [walletTransactions, incomingTransactions]);

  const totalCount = allSortedTransactions.length;
  const hasMore = visibleCount < totalCount;

  // Group only the visible transactions
  const groupedTransactions = useMemo(() => {
    const visibleItems = allSortedTransactions.slice(0, visibleCount);
    const groups = new Map<string, GroupedTransactions>();

    for (const { timestamp, item } of visibleItems) {
      const label = getDateLabel(timestamp);
      if (!groups.has(label)) {
        groups.set(label, { label, items: [] });
      }
      groups.get(label)!.items.push(item);
    }

    return Array.from(groups.values());
  }, [allSortedTransactions, visibleCount]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Load more when within 100px of bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, totalCount));
    }
  }, [hasMore, totalCount]);

  return (
    <Modal
      aria-label="Activity"
      trigger={trigger || <button style={{ display: "none" }} />}
      open={open}
      onOpenChange={onOpenChange}
      style={modalStyle}
      snapPoints={snapPoints}
    >
      <div
        style={{
          background: "rgba(38, 38, 38, 0.55)",
          backgroundBlendMode: "luminosity",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          paddingBottom: Math.max(safeBottom, 80),
        }}
        className="flex flex-col text-white relative overflow-hidden min-h-[500px] rounded-t-3xl"
      >
        <Drawer.Title asChild>
          <VisuallyHidden>Activity</VisuallyHidden>
        </Drawer.Title>

        {/* Header */}
        <div className="relative h-[52px] flex items-center justify-center shrink-0">
          <span className="text-base font-medium text-white tracking-[-0.176px]">
            Activity
          </span>

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

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 pb-4"
        >
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    mixBlendMode: "lighten",
                  }}
                >
                  <div className="py-1.5 pr-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                  </div>
                  <div className="flex-1 py-2.5 flex flex-col gap-1.5">
                    <div className="w-20 h-5 bg-white/5 animate-pulse rounded" />
                    <div className="w-28 h-4 bg-white/5 animate-pulse rounded" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 py-2.5 pl-3">
                    <div className="w-16 h-5 bg-white/5 animate-pulse rounded" />
                    <div className="w-12 h-4 bg-white/5 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : groupedTransactions.length === 0 ? (
            <div
              className="flex items-center justify-center px-8 py-6 rounded-2xl h-[200px]"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                mixBlendMode: "lighten",
              }}
            >
              <p className="text-base text-white/60 leading-5 text-center">
                No transactions yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groupedTransactions.map((group) => (
                <div key={group.label} className="flex flex-col gap-2">
                  {/* Date Label */}
                  <p className="text-[13px] text-white/60 leading-4 px-1">
                    {group.label}
                  </p>

                  {/* Transactions */}
                  {group.items.map((item) => {
                    if (item.type === "incoming") {
                      const transaction = item.transaction;
                      const isClaiming = claimingTransactionId === transaction.id;
                      return (
                        <button
                          key={transaction.id}
                          onClick={() =>
                            !isClaiming && onIncomingTransactionClick(transaction)
                          }
                          disabled={isClaiming}
                          className={`flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity ${
                            isClaiming ? "opacity-60" : ""
                          }`}
                          style={{
                            background: "rgba(255, 255, 255, 0.06)",
                            mixBlendMode: "lighten",
                          }}
                        >
                          {/* Left - Icon */}
                          <div className="py-1.5 pr-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{ background: "rgba(50, 229, 94, 0.15)" }}
                            >
                              <ArrowDown
                                className="w-7 h-7"
                                strokeWidth={1.5}
                                style={{ color: "#32e55e" }}
                              />
                            </div>
                          </div>

                          {/* Middle - Text */}
                          <div className="flex-1 py-2.5 flex flex-col gap-0.5">
                            <p className="text-base text-white leading-5">
                              Received
                            </p>
                            <p className="text-[13px] text-white/60 leading-4">
                              from {formatSenderAddress(transaction.sender)}
                            </p>
                          </div>

                          {/* Right - Claim Badge */}
                          <div className="py-2.5 pl-3">
                            {(() => {
                              const userNeedsGas = (balance === null || balance === 0) && starsBalance === 0;
                              return (
                                <div
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-white leading-5"
                                  style={{
                                    background: userNeedsGas
                                      ? "linear-gradient(90deg, rgba(234, 179, 8, 0.15) 0%, rgba(234, 179, 8, 0.15) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)"
                                      : "linear-gradient(90deg, rgba(50, 229, 94, 0.15) 0%, rgba(50, 229, 94, 0.15) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)",
                                  }}
                                >
                                  {userNeedsGas && (
                                    <TriangleAlert className="w-4 h-4" style={{ color: "#eab308" }} strokeWidth={2} />
                                  )}
                                  {isClaiming
                                    ? "Claiming..."
                                    : userNeedsGas
                                      ? "Details"
                                      : `Claim ${formatTransactionAmount(transaction.amountLamports)} SOL`}
                                </div>
                              );
                            })()}
                          </div>
                        </button>
                      );
                    }

                    // Wallet transaction
                    const transaction = item.transaction;
                    const isIncoming = transaction.type === "incoming";
                    const isPending = transaction.type === "pending";
                    const transferTypeLabel =
                      transaction.transferType === "store"
                        ? "Store data"
                        : transaction.transferType === "verify_telegram_init_data"
                          ? "Verify data"
                          : null;
                    const counterparty = isIncoming
                      ? transaction.sender || "Unknown sender"
                      : transaction.recipient || "Unknown recipient";
                    const formattedCounterparty = counterparty.startsWith("@")
                      ? counterparty
                      : formatSenderAddress(counterparty);
                    const amountPrefix = isIncoming ? "+" : "−";
                    const amountColor = isIncoming
                      ? "#32e55e"
                      : isPending
                        ? "#00b1fb"
                        : "white";
                    const timestamp = new Date(transaction.timestamp);

                    // Compact view for store/verify transactions
                    const isCompactTransaction = transferTypeLabel !== null;

                    if (isCompactTransaction) {
                      return (
                        <button
                          key={transaction.id}
                          onClick={() => onTransactionClick(transaction)}
                          className="flex items-center py-2 px-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity"
                          style={{
                            background: "rgba(255, 255, 255, 0.06)",
                            mixBlendMode: "lighten",
                          }}
                        >
                          {/* Left - Text */}
                          <div className="flex-1 flex items-center">
                            <p className="text-sm text-white/60 leading-5">
                              {transferTypeLabel}
                            </p>
                          </div>

                          {/* Right - Date only */}
                          <div className="pl-3">
                            <p className="text-[13px] text-white/40 leading-4">
                              {timestamp.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                              ,{" "}
                              {timestamp.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={transaction.id}
                        onClick={() => onTransactionClick(transaction)}
                        className="flex items-center py-1 pl-3 pr-4 rounded-2xl overflow-hidden w-full text-left active:opacity-80 transition-opacity"
                        style={{
                          background: "rgba(255, 255, 255, 0.06)",
                          mixBlendMode: "lighten",
                        }}
                      >
                        {/* Left - Icon */}
                        <div className="py-1.5 pr-3">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{
                              background: isIncoming
                                ? "rgba(50, 229, 94, 0.15)"
                                : isPending
                                  ? "rgba(0, 177, 251, 0.15)"
                                  : "rgba(255, 255, 255, 0.06)",
                              mixBlendMode:
                                isIncoming || isPending ? "normal" : "lighten",
                            }}
                          >
                            {isIncoming ? (
                              <ArrowDown
                                className="w-7 h-7"
                                strokeWidth={1.5}
                                style={{ color: "#32e55e" }}
                              />
                            ) : isPending ? (
                              <Clock
                                className="w-7 h-7"
                                strokeWidth={1.5}
                                style={{ color: "#00b1fb" }}
                              />
                            ) : (
                              <ArrowUp
                                className="w-7 h-7 text-white/60"
                                strokeWidth={1.5}
                              />
                            )}
                          </div>
                        </div>

                        {/* Middle - Text */}
                        <div className="flex-1 py-2.5 flex flex-col gap-0.5">
                          <p className="text-base text-white leading-5">
                            {isIncoming
                              ? "Received"
                              : isPending
                                ? "To be claimed"
                                : "Sent"}
                          </p>
                          <p className="text-[13px] text-white/60 leading-4">
                            {isIncoming ? "from" : isPending ? "by" : "to"}{" "}
                            {formattedCounterparty}
                          </p>
                        </div>

                        {/* Right - Value */}
                        <div className="flex flex-col items-end gap-0.5 py-2.5 pl-3">
                          <p
                            className="text-base leading-5"
                            style={{ color: amountColor }}
                          >
                            {amountPrefix}
                            {formatTransactionAmount(transaction.amountLamports)}{" "}
                            SOL
                          </p>
                          <p className="text-[13px] text-white/60 leading-4">
                            {timestamp.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                            ,{" "}
                            {timestamp.toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Loading indicator */}
              {hasMore && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
