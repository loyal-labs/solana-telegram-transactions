"use client";

import { hapticFeedback } from "@telegram-apps/sdk-react";
import { ArrowDown, X } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { useTelegramSafeArea } from "@/hooks/useTelegramSafeArea";
import {
  formatSenderAddress,
  formatTransactionAmount,
} from "@/lib/solana/wallet/formatters";
import type { IncomingTransaction, Transaction } from "@/types/wallet";

const ITEMS_PER_PAGE = 10;

export type ActivitySheetProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  walletTransactions: Transaction[];
  incomingTransactions: IncomingTransaction[];
  onTransactionClick: (transaction: Transaction) => void;
  isLoading?: boolean;
};

type GroupedTransactions = {
  label: string;
  items: Array<
    | { type: "wallet"; transaction: Transaction }
    | { type: "incoming"; transaction: IncomingTransaction }
  >;
};

const SHEET_TRANSITION = "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
const OVERLAY_TRANSITION = "opacity 0.3s ease";

function getDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const yesterdayOnly = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate(),
  );

  if (dateOnly.getTime() === todayOnly.getTime()) return "Today";
  if (dateOnly.getTime() === yesterdayOnly.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export default function ActivitySheet({
  open,
  onOpenChange,
  walletTransactions,
  incomingTransactions,
  onTransactionClick,
  isLoading = false,
}: ActivitySheetProps) {
  const { bottom: safeBottom } = useTelegramSafeArea();
  const [mounted, setMounted] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [rendered, setRendered] = useState(false);
  const [show, setShow] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragDelta = useRef(0);
  const isDragging = useRef(false);
  const isClosing = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      isClosing.current = false;
      setVisibleCount(ITEMS_PER_PAGE);
      setRendered(true);
    }
  }, [open]);

  useEffect(() => {
    if (rendered && open && !show && !isClosing.current) {
      sheetRef.current?.getBoundingClientRect();
      setShow(true);
    }
  }, [rendered, open, show]);

  useEffect(() => {
    if (!open) return;
    const header = document.querySelector("header");
    if (header) {
      setHeaderHeight(header.getBoundingClientRect().bottom);
    }
  }, [open]);

  // All sorted transactions
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
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, totalCount));
    }
  }, [hasMore, totalCount]);

  const unmount = useCallback(() => {
    setRendered(false);
    setShow(false);
    onOpenChange?.(false);
    isClosing.current = false;
  }, [onOpenChange]);

  const closeSheet = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }

    if (sheetRef.current) {
      sheetRef.current.style.transition = SHEET_TRANSITION;
      sheetRef.current.style.transform = "translateY(100%)";
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = OVERLAY_TRANSITION;
      overlayRef.current.style.opacity = "0";
    }
  }, []);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName === "transform" && isClosing.current) {
        unmount();
      }
    },
    [unmount],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragDelta.current = 0;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    dragDelta.current = Math.max(0, delta);
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dragDelta.current}px)`;
    }
    if (overlayRef.current) {
      const opacity = Math.max(0.2, 1 - dragDelta.current / 300);
      overlayRef.current.style.opacity = String(opacity);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (dragDelta.current > 120) {
      closeSheet();
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = SHEET_TRANSITION;
        sheetRef.current.style.transform = "translateY(0px)";
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = OVERLAY_TRANSITION;
        overlayRef.current.style.opacity = "1";
      }
    }
    dragDelta.current = 0;
  }, [closeSheet]);

  // Lock body scroll when rendered
  useEffect(() => {
    if (rendered) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [rendered]);

  if (!mounted || !rendered) return null;

  const sheetTopOffset = headerHeight || 56;

  const content = (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={closeSheet}
        className="fixed inset-0 z-[9998]"
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          opacity: show ? 1 : 0,
          transition: OVERLAY_TRANSITION,
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTransitionEnd={handleTransitionEnd}
        className="fixed left-0 right-0 bottom-0 z-[9999] flex flex-col bg-white rounded-t-[38px] font-sans"
        style={{
          top: sheetTopOffset,
          transform: show ? "translateY(0)" : "translateY(100%)",
          transition: SHEET_TRANSITION,
          boxShadow: "0px -4px 40px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Handle bar */}
        <div
          className="flex justify-center pt-2 pb-1 shrink-0 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: "rgba(0, 0, 0, 0.15)" }}
          />
        </div>

        {/* Header */}
        <div
          className="relative h-[44px] flex items-center justify-center shrink-0 px-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <span className="text-[17px] font-semibold text-black leading-[22px]">
            Activity
          </span>

          <button
            onClick={closeSheet}
            className="absolute right-3 w-[30px] h-[30px] rounded-full flex items-center justify-center active:scale-95 transition-all duration-150"
            style={{ background: "rgba(0, 0, 0, 0.06)" }}
          >
            <X
              size={20}
              strokeWidth={2}
              style={{ color: "rgba(60, 60, 67, 0.6)" }}
            />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: Math.max(safeBottom, 24) }}
        >
          {isLoading ? (
            <div className="flex flex-col px-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center px-0">
                  <div className="py-1.5 pr-3">
                    <div className="w-12 h-12 rounded-full bg-black/[0.04] animate-pulse" />
                  </div>
                  <div className="flex-1 py-2.5 flex flex-col gap-1.5">
                    <div className="w-20 h-5 bg-black/[0.04] animate-pulse rounded" />
                    <div className="w-28 h-4 bg-black/[0.04] animate-pulse rounded" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 py-2.5 pl-3">
                    <div className="w-16 h-5 bg-black/[0.04] animate-pulse rounded" />
                    <div className="w-12 h-4 bg-black/[0.04] animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : groupedTransactions.length === 0 ? (
            <div className="flex items-center justify-center px-8 py-6 h-[200px]">
              <p
                className="text-base leading-5 text-center"
                style={{ color: "rgba(60, 60, 67, 0.6)" }}
              >
                No transactions yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {groupedTransactions.map((group) => (
                <div key={group.label} className="flex flex-col">
                  {/* Date Label */}
                  <div className="px-3 pt-3 pb-2">
                    <p className="text-[17px] font-medium text-black leading-[22px] tracking-[-0.187px]">
                      {group.label}
                    </p>
                  </div>

                  {/* Transactions */}
                  {group.items.map((item) => {
                    if (item.type === "incoming") {
                      const transaction = item.transaction;
                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center px-4"
                        >
                          {/* Icon */}
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

                          {/* Text */}
                          <div className="flex-1 py-2.5 flex flex-col gap-0.5 min-w-0">
                            <p className="text-base text-black leading-5">
                              Receiving
                            </p>
                            <p
                              className="text-[13px] leading-4 truncate"
                              style={{ color: "rgba(60, 60, 67, 0.6)" }}
                            >
                              {formatTransactionAmount(
                                transaction.amountLamports,
                              )}{" "}
                              SOL from{" "}
                              {formatSenderAddress(transaction.sender)}
                            </p>
                          </div>

                          {/* Claiming badge */}
                          <div className="py-2.5 pl-3 shrink-0">
                            <div
                              className="flex items-center px-3 py-1.5 rounded-full text-[13px] leading-4 animate-pulse"
                              style={{
                                background: "rgba(50, 229, 94, 0.12)",
                                color: "#32e55e",
                              }}
                            >
                              Claiming...
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Wallet transaction
                    const transaction = item.transaction;
                    const isIncoming = transaction.type === "incoming";
                    const isPending = transaction.type === "pending";
                    const isSecureTransaction = transaction.transferType === "secure";
                    const isUnshieldTransaction = transaction.transferType === "unshield";
                    const isSecureOrUnshield = isSecureTransaction || isUnshieldTransaction;
                    const transferTypeLabel =
                      transaction.transferType === "store"
                        ? "Store data"
                        : transaction.transferType ===
                            "verify_telegram_init_data"
                          ? "Verify data"
                          : null;
                    const counterparty = isIncoming
                      ? transaction.sender || "Unknown sender"
                      : transaction.recipient || "Unknown recipient";
                    const formattedCounterparty = counterparty.startsWith("@")
                      ? counterparty
                      : formatSenderAddress(counterparty);
                    const amountPrefix = isIncoming ? "+" : "\u2212";
                    const amountColor = isIncoming
                      ? "#32e55e"
                      : isPending
                        ? "#f9363c"
                        : "black";
                    const timestamp = new Date(transaction.timestamp);

                    // Compact view for store/verify transactions
                    if (transferTypeLabel !== null) {
                      return (
                        <button
                          key={transaction.id}
                          onClick={() => onTransactionClick(transaction)}
                          className="flex items-center py-2 px-4 w-full text-left active:opacity-70 transition-opacity"
                        >
                          <div className="flex-1 flex items-center">
                            <p
                              className="text-sm leading-5"
                              style={{ color: "rgba(60, 60, 67, 0.6)" }}
                            >
                              {transferTypeLabel}
                            </p>
                          </div>
                          <div className="pl-3">
                            <p
                              className="text-[13px] leading-4"
                              style={{ color: "rgba(60, 60, 67, 0.3)" }}
                            >
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

                    // Secure/Unshield transaction view
                    if (isSecureOrUnshield) {
                      return (
                        <button
                          key={transaction.id}
                          onClick={() => onTransactionClick(transaction)}
                          className="flex items-center px-4 w-full text-left active:opacity-70 transition-opacity"
                        >
                          {/* Icon */}
                          <div className="py-1.5 pr-3">
                            <div className="w-12 h-12 relative">
                              <div className="w-12 h-12 rounded-full overflow-hidden relative bg-[#f2f2f7]">
                                <Image
                                  src={transaction.secureTokenIcon || "/tokens/solana-sol-logo.png"}
                                  alt={transaction.secureTokenSymbol || "Token"}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              {isSecureTransaction && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-[20px] h-[20px]">
                                  <Image
                                    src="/Shield.svg"
                                    alt="Shield"
                                    width={20}
                                    height={20}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Text */}
                          <div className="flex-1 py-2.5 flex flex-col gap-0.5 min-w-0">
                            <p className="text-base text-black leading-5">
                              {isSecureTransaction ? "Secure" : "Unshield"}
                            </p>
                            <p
                              className="text-[13px] leading-4 truncate"
                              style={{ color: "rgba(60, 60, 67, 0.6)" }}
                            >
                              {transaction.secureTokenSymbol || "Token"}
                            </p>
                          </div>

                          {/* Amount + Time */}
                          <div className="flex flex-col items-end gap-0.5 py-2.5 pl-3 shrink-0">
                            <p
                              className="text-base leading-5 text-black"
                            >
                              {transaction.secureAmount
                                ? `${transaction.secureAmount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${transaction.secureTokenSymbol || ""}`
                                : `${formatTransactionAmount(transaction.amountLamports)} SOL`}
                            </p>
                            <p
                              className="text-[13px] leading-4"
                              style={{ color: "rgba(60, 60, 67, 0.6)" }}
                            >
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
                        className="flex items-center px-4 w-full text-left active:opacity-70 transition-opacity"
                      >
                        {/* Icon */}
                        <div className="py-1.5 pr-3">
                          {isPending ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden relative">
                              <Image
                                src="/loyal-shield.png"
                                alt="To be claimed"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full overflow-hidden relative">
                              <Image
                                src="/tokens/solana-sol-logo.png"
                                alt="SOL"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 py-2.5 flex flex-col gap-0.5 min-w-0">
                          <p className="text-base text-black leading-5">
                            {isIncoming
                              ? "Received"
                              : isPending
                                ? "To be claimed"
                                : "Sent"}
                          </p>
                          <p
                            className="text-[13px] leading-4 truncate"
                            style={{ color: "rgba(60, 60, 67, 0.6)" }}
                          >
                            {isIncoming ? "from" : isPending ? "by" : "to"}{" "}
                            {formattedCounterparty}
                          </p>
                        </div>

                        {/* Amount + Time */}
                        <div className="flex flex-col items-end gap-0.5 py-2.5 pl-3 shrink-0">
                          <p
                            className="text-base leading-5"
                            style={{ color: amountColor }}
                          >
                            {amountPrefix}
                            {formatTransactionAmount(
                              transaction.amountLamports,
                            )}{" "}
                            SOL
                          </p>
                          <p
                            className="text-[13px] leading-4"
                            style={{ color: "rgba(60, 60, 67, 0.6)" }}
                          >
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

              {/* Loading indicator for infinite scroll */}
              {hasMore && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
