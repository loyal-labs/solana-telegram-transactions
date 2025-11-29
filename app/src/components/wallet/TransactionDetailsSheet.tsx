"use client";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { hapticFeedback, shareURL } from "@telegram-apps/sdk-react";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import { Check, Globe, Share, ShieldAlert, X } from "lucide-react";
import Image from "next/image";
import {
  type CSSProperties,
  type ReactNode,
  useMemo,
} from "react";

const SOL_PRICE_USD = 180;
const SOLANA_FEE_SOL = 0.000005;

export type TransactionStatus = "pending" | "completed" | "error";

export type TransactionDetailsData = {
  id: string;
  type: "incoming" | "outgoing";
  amountLamports: number;
  // For outgoing transactions
  recipient?: string;
  recipientUsername?: string;
  recipientAvatar?: string;
  // For incoming transactions
  sender?: string;
  senderUsername?: string;
  senderAvatar?: string;
  // Metadata
  status: TransactionStatus;
  timestamp: number;
  networkFeeLamports?: number;
  comment?: string;
  signature?: string; // Transaction signature for explorer link
};

export type TransactionDetailsSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  transaction: TransactionDetailsData | null;
  showSuccess?: boolean; // Show success state after claiming
  showError?: string | null; // Show error state with message after failed claim
};

// Wallet icon SVG component
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M15.8333 5.83333V3.33333C15.8333 3.11232 15.7455 2.90036 15.5893 2.74408C15.433 2.5878 15.221 2.5 15 2.5H4.16667C3.72464 2.5 3.30072 2.67559 2.98816 2.98816C2.67559 3.30072 2.5 3.72464 2.5 4.16667C2.5 4.60869 2.67559 5.03262 2.98816 5.34518C3.30072 5.65774 3.72464 5.83333 4.16667 5.83333H16.6667C16.8877 5.83333 17.0996 5.92113 17.2559 6.07741C17.4122 6.23369 17.5 6.44565 17.5 6.66667V10M17.5 10H15C14.558 10 14.1341 10.1756 13.8215 10.4882C13.5089 10.8007 13.3333 11.2246 13.3333 11.6667C13.3333 12.1087 13.5089 12.5326 13.8215 12.8452C14.1341 13.1577 14.558 13.3333 15 13.3333H17.5C17.721 13.3333 17.933 13.2455 18.0893 13.0893C18.2455 12.933 18.3333 12.721 18.3333 12.5V10.8333C18.3333 10.6123 18.2455 10.4004 18.0893 10.2441C17.933 10.0878 17.721 10 17.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 4.16656V15.8332C2.5 16.2753 2.67559 16.6992 2.98816 17.0117C3.30072 17.3243 3.72464 17.4999 4.16667 17.4999H16.6667C16.8877 17.4999 17.0996 17.4121 17.2559 17.2558C17.4122 17.0995 17.5 16.8876 17.5 16.6666V13.3332" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function TransactionDetailsSheet({
  trigger,
  open,
  onOpenChange,
  transaction,
  showSuccess = false,
  showError = null,
}: TransactionDetailsSheetProps) {
  const modalStyle = useMemo(
    () =>
      ({
        "--tgui--bg_color": "transparent",
        "--tgui--divider": "rgba(255, 255, 255, 0.05)",
      }) as CSSProperties,
    [],
  );

  if (!transaction) {
    return null;
  }

  const isIncoming = transaction.type === "incoming";
  const amountSol = transaction.amountLamports / LAMPORTS_PER_SOL;
  const amountUsd = amountSol * SOL_PRICE_USD;
  const networkFeeSol = transaction.networkFeeLamports
    ? transaction.networkFeeLamports / LAMPORTS_PER_SOL
    : SOLANA_FEE_SOL;
  const networkFeeUsd = networkFeeSol * SOL_PRICE_USD;

  // Format amount for display
  const formattedAmount = amountSol.toFixed(4).replace(/\.?0+$/, '');

  // Determine the address/username to show in the header pill
  const displayAddress = isIncoming
    ? (transaction.senderUsername || transaction.sender || "Unknown")
    : (transaction.recipientUsername || transaction.recipient || "Unknown");

  const hasAvatar = isIncoming
    ? !!transaction.senderAvatar || !!transaction.senderUsername
    : !!transaction.recipientAvatar || !!transaction.recipientUsername;

  const avatarUrl = isIncoming ? transaction.senderAvatar : transaction.recipientAvatar;
  const isUsername = displayAddress.startsWith("@");

  // Abbreviated address for pill
  const abbreviatedAddress = isUsername
    ? displayAddress
    : `${displayAddress.slice(0, 4)}…${displayAddress.slice(-4)}`;

  // Full address for details
  const fullAddress = isIncoming
    ? (transaction.sender || "Unknown")
    : (transaction.recipient || "Unknown");

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      ", " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get status text
  const getStatusText = (status: TransactionStatus) => {
    // For incoming pending transactions, show "Ready to claim"
    if (isIncoming && status === "pending") {
      return "Ready to claim";
    }
    switch (status) {
      case "completed": return "Completed";
      case "pending": return "Pending";
      case "error": return "Failed";
      default: return status;
    }
  };

  // Handle view in explorer
  const handleViewInExplorer = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    if (transaction.signature) {
      const explorerUrl = `https://explorer.solana.com/tx/${transaction.signature}?cluster=devnet`;
      window.open(explorerUrl, "_blank");
    }
  };

  // Handle share
  const handleShare = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }

    const shareText = `Transaction: ${isIncoming ? "+" : "-"}${formattedAmount} SOL`;

    // Use Telegram native share
    if (shareURL.isAvailable()) {
      const explorerUrl = transaction.signature
        ? `https://explorer.solana.com/tx/${transaction.signature}?cluster=devnet`
        : `https://solscan.io/account/${fullAddress}`;
      shareURL(explorerUrl, shareText);
    } else if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(shareText);
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("success");
      }
    }
  };

  return (
    <Modal
      aria-label="Transaction details"
      trigger={trigger || <button style={{ display: 'none' }} />}
      open={open}
      onOpenChange={onOpenChange}
      style={modalStyle}
      snapPoints={[1]}
    >
      <div
        style={{
          background: "rgba(38, 38, 38, 0.55)",
          backgroundBlendMode: "luminosity",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
        className="flex flex-col text-white relative overflow-hidden min-h-[500px] rounded-t-3xl"
      >
        <Drawer.Title asChild>
          <VisuallyHidden>Transaction details</VisuallyHidden>
        </Drawer.Title>

        {/* Custom Header */}
        <div className="relative h-[52px] flex items-center justify-center shrink-0">
          {/* Header Pill */}
          <div
            className="flex items-center pl-1 pr-3 py-1 rounded-[54px]"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              mixBlendMode: "lighten",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div className="pr-1.5">
              {hasAvatar && avatarUrl ? (
                <div className="w-7 h-7 rounded-full overflow-hidden relative">
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-[16.8px] flex items-center justify-center text-white">
                  <WalletIcon className="opacity-60" />
                </div>
              )}
            </div>
            <span className="text-sm leading-5">
              <span className="text-white/60">
                {showSuccess ? "Claimed from " : showError ? "Claim from " : (isIncoming ? "Sent from " : "Sent to ")}
              </span>
              <span className="text-white">{abbreviatedAddress}</span>
            </span>
          </div>

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

        {/* Content - error view, success view, or details view */}
        {showError ? (
          /* Error View */
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
            {/* Animated Error Icon */}
            <div className="relative mb-5">
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                style={{
                  background: "#FF4D4D",
                  animation: "result-pulse 0.6s ease-out"
                }}
              >
                <ShieldAlert
                  className="text-white"
                  size={40}
                  strokeWidth={2}
                  style={{
                    animation: "result-icon 0.4s ease-out 0.2s both"
                  }}
                />
              </div>
            </div>

            {/* Error Text */}
            <div className="flex flex-col gap-3 items-center text-center max-w-[280px]">
              <h2 className="text-2xl font-semibold text-white leading-7">
                Claim failed
              </h2>
              <p className="text-base leading-5 text-white/60">
                {showError}
              </p>
            </div>

            {/* Animation keyframes */}
            <style jsx>{`
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
        ) : showSuccess ? (
          /* Success View */
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
            {/* Animated Success Icon */}
            <div className="relative mb-5">
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                style={{
                  background: "#2990ff",
                  animation: "result-pulse 0.6s ease-out"
                }}
              >
                <Check
                  className="text-white"
                  size={40}
                  strokeWidth={2.5}
                  style={{
                    animation: "result-icon 0.4s ease-out 0.2s both"
                  }}
                />
              </div>
            </div>

            {/* Success Text */}
            <div className="flex flex-col gap-3 items-center text-center max-w-[280px]">
              <h2 className="text-2xl font-semibold text-white leading-7">
                SOL claimed
              </h2>
              <p className="text-base leading-5 text-white/60">
                <span className="text-white">{formattedAmount} SOL</span>
                {" "}successfully claimed from{" "}
                <span className="text-white">{abbreviatedAddress}</span>
              </p>
            </div>

            {/* Animation keyframes */}
            <style jsx>{`
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
        ) : (
          /* Details View */
          <>
            {/* Amount Section */}
            <div className="flex flex-col items-center justify-center px-4 pt-8 pb-6">
              <div className="flex flex-col items-center gap-1">
                {/* Amount */}
                <div className="flex items-baseline gap-2">
                  <p className="text-[40px] font-semibold leading-[48px] text-white">
                    {isIncoming ? "+" : "−"}{formattedAmount}
                  </p>
                  <p className="text-[28px] font-semibold leading-8 text-white/40 tracking-[0.4px]">
                    SOL
                  </p>
                </div>
                {/* USD Value */}
                <p className="text-base leading-[22px] text-white/40 text-center">
                  ≈${amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {/* Date */}
                <p className="text-base leading-[22px] text-white/40 text-center">
                  {formatDate(transaction.timestamp)}
                </p>
              </div>
            </div>

            {/* Details Card */}
            <div className="px-4">
              <div
                className="flex flex-col rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  mixBlendMode: "lighten",
                }}
              >
                {/* Status */}
                <div className="flex flex-col gap-0.5 px-4 py-2.5">
                  <p className="text-[13px] leading-4 text-white/60">Status</p>
                  <p className="text-base leading-5 text-white">{getStatusText(transaction.status)}</p>
                </div>

                {/* Recipient/Sender */}
                <div className="flex flex-col gap-0.5 px-4 py-2.5">
                  <p className="text-[13px] leading-4 text-white/60">
                    {isIncoming ? "Sender" : "Recipient"}
                  </p>
                  <p className="text-base leading-5 text-white break-all">{fullAddress}</p>
                </div>

                {/* Network Fee (only for outgoing) */}
                {!isIncoming && (
                  <div className="flex flex-col gap-0.5 px-4 py-2.5">
                    <p className="text-[13px] leading-4 text-white/60">Network fee</p>
                    <p className="text-base leading-5">
                      <span className="text-white">{networkFeeSol} SOL</span>
                      <span className="text-white/60"> ≈ ${networkFeeUsd.toFixed(2)}</span>
                    </p>
                  </div>
                )}

                {/* Comment (only for incoming) */}
                {isIncoming && transaction.comment && (
                  <div className="flex flex-col gap-0.5 px-4 py-2.5">
                    <p className="text-[13px] leading-4 text-white/60">Comment</p>
                    <p className="text-base leading-5 text-white">{transaction.comment}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-2 px-6 pt-8 pb-4">
              {/* View in Explorer */}
              <button
                onClick={handleViewInExplorer}
                className="flex-1 flex flex-col items-center gap-2 rounded-2xl overflow-hidden group"
              >
                <div
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-150 group-active:scale-95 group-active:bg-white/10"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    mixBlendMode: "lighten"
                  }}
                >
                  <Globe className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <span className="text-[13px] text-white/60 leading-4">View in explorer</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex-1 flex flex-col items-center gap-2 rounded-2xl overflow-hidden group"
              >
                <div
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-150 group-active:scale-95 group-active:bg-white/10"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    mixBlendMode: "lighten"
                  }}
                >
                  <Share className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <span className="text-[13px] text-white/60 leading-4">Share</span>
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
