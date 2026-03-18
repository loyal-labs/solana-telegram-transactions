import { Check, Globe, Share } from "lucide-react";
import { useState } from "react";

import type { TransactionDetail } from "@loyal-labs/wallet-core/types";

import { SubViewHeader } from "~/src/components/wallet/shared";

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function TransactionDetailView({
  detail,
  onBack,
}: {
  detail: TransactionDetail;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [explorerHovered, setExplorerHovered] = useState(false);
  const [shareHovered, setShareHovered] = useState(false);

  const isSent = detail.activity.type === "sent";
  const isShielded = detail.activity.type === "shielded";
  const isUnshielded = detail.activity.type === "unshielded";
  const isPrivate = detail.isPrivate || detail.activity.isPrivate;
  const isShieldType = isShielded || isUnshielded;
  const title = isShielded
    ? "Shielded"
    : isUnshielded
      ? "Unshielded"
      : isSent
        ? "Sent"
        : "Received";

  // Strip the +/- prefix for the large display
  const rawAmount = detail.activity.amount.replace(/^[+\u2212-]/, "");
  const parts = rawAmount.split(" ");
  const amountNum = parts[0];
  const amountToken = parts[1] || "";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <SubViewHeader onBack={onBack} title={title} />

      {/* Content */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto p-2">
        {/* Amount hero */}
        <div className="flex w-full flex-col items-center justify-center px-3 pt-8 pb-6">
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-baseline gap-2 whitespace-nowrap font-sans font-semibold">
              <span
                className="text-[40px] leading-[48px]"
                style={{
                  color:
                    isSent || isShieldType ? "#fff" : "#34C759",
                }}
              >
                {isShieldType ? "" : isSent ? "\u2212" : "+"}
                {amountNum}
              </span>
              <span className="text-[28px] leading-8 tracking-wide text-gray-500">
                {amountToken}
              </span>
            </div>
            <span className="font-sans text-base leading-5 text-gray-400">
              ≈{detail.usdValue}
            </span>
            <span className="font-sans text-base leading-5 text-gray-400">
              {detail.activity.date}, {detail.activity.timestamp}
            </span>
          </div>
        </div>

        {/* Details card */}
        <div className="w-full">
          <div className="flex flex-col rounded-2xl bg-white/[0.06] py-1">
            {/* Status */}
            <div className="px-3 py-2.5">
              <span className="block font-sans text-[13px] leading-4 text-gray-400">
                Status
              </span>
              <span className="mt-0.5 block font-sans text-base leading-5 text-white">
                {detail.status}
              </span>
            </div>

            {/* Sender / Recipient */}
            <div className="px-3 py-2.5">
              <span className="block font-sans text-[13px] leading-4 text-gray-400">
                {isShielded
                  ? "Moved to"
                  : isUnshielded
                    ? "Moved from"
                    : isSent
                      ? "Recipient"
                      : "Sender"}
              </span>
              <span className="mt-0.5 block font-sans text-base leading-5 text-white">
                {isShielded
                  ? "Secure balance"
                  : isUnshielded
                    ? "Secure balance"
                    : truncateAddress(detail.activity.counterparty)}
              </span>
            </div>

            {/* Network Fee */}
            <div className="px-3 py-2.5">
              <span className="block font-sans text-[13px] leading-4 text-gray-400">
                Network Fee
              </span>
              <div className="mt-0.5 flex items-center gap-1 font-sans text-base leading-5">
                <span className="text-white">{detail.networkFee}</span>
                <span className="text-gray-400">
                  ≈ {detail.networkFeeUsd}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex w-full items-center pt-5 pb-4">
          {/* View in explorer */}
          {!isPrivate && (
            <div className="flex flex-1 flex-col items-center gap-2">
              <button
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-none transition-colors"
                onClick={() =>
                  window.open(
                    `https://explorer.solana.com/tx/${detail.activity.id}`,
                    "_blank",
                  )
                }
                onMouseEnter={() => setExplorerHovered(true)}
                onMouseLeave={() => setExplorerHovered(false)}
                style={{
                  background: explorerHovered
                    ? "rgba(147, 51, 234, 0.25)"
                    : "rgba(147, 51, 234, 0.15)",
                }}
                type="button"
              >
                <Globe className="text-gray-300" size={24} />
              </button>
              <span className="text-center font-sans text-[13px] leading-4 text-gray-400">
                View in explorer
              </span>
            </div>
          )}

          {/* Share */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <button
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-none transition-colors"
              onClick={() => {
                const text = isPrivate
                  ? `Sent ${rawAmount} ${amountToken} (${detail.usdValue}) to ${truncateAddress(detail.activity.counterparty)}`
                  : isShieldType
                    ? `${title} ${rawAmount} ${amountToken} (${detail.usdValue})\nhttps://explorer.solana.com/tx/${detail.activity.id}`
                    : `${title} ${rawAmount} ${amountToken} (${detail.usdValue}) ${isSent ? "to" : "from"} ${truncateAddress(detail.activity.counterparty)}\nhttps://explorer.solana.com/tx/${detail.activity.id}`;
                void navigator.clipboard.writeText(text).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              onMouseEnter={() => setShareHovered(true)}
              onMouseLeave={() => setShareHovered(false)}
              style={{
                background: shareHovered
                  ? "rgba(147, 51, 234, 0.25)"
                  : "rgba(147, 51, 234, 0.15)",
              }}
              type="button"
            >
              {copied ? (
                <Check size={24} style={{ color: "#34C759" }} />
              ) : (
                <Share className="text-gray-300" size={24} />
              )}
            </button>
            <span
              className="text-center font-sans text-[13px] leading-4 transition-colors"
              style={{
                color: copied ? "#34C759" : "rgb(156, 163, 175)",
              }}
            >
              {copied ? "Copied" : "Share"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
