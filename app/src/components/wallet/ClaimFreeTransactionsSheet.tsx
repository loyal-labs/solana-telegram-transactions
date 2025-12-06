"use client";

import { hapticFeedback } from "@telegram-apps/sdk-react";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import { X } from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useMemo,
} from "react";

import { useModalSnapPoint, useTelegramSafeArea } from "@/hooks/useTelegramSafeArea";

export type ClaimFreeTransactionsSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function ClaimFreeTransactionsSheet({
  trigger,
  open,
  onOpenChange,
}: ClaimFreeTransactionsSheetProps) {
  const snapPoint = useModalSnapPoint();
  const { bottom: safeBottom } = useTelegramSafeArea();

  const modalStyle = useMemo(
    () =>
      ({
        "--tgui--bg_color": "transparent",
        "--tgui--divider": "rgba(255, 255, 255, 0.05)",
      }) as CSSProperties,
    [],
  );

  const handleJoinChannel = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    // TODO: Replace with actual channel link
    window.open("https://t.me/+placeholder_channel", "_blank");
  };

  const handleSetCustomEmoji = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    // TODO: Replace with actual custom emoji settings deep link
    window.open("https://t.me/settings/emoji_status", "_blank");
  };

  return (
    <Modal
      aria-label="Claim free transactions"
      trigger={trigger || <button style={{ display: 'none' }} />}
      open={open}
      onOpenChange={onOpenChange}
      style={modalStyle}
      snapPoints={[snapPoint]}
    >
      <div
        style={{
          background: "rgba(38, 38, 38, 0.55)",
          backgroundBlendMode: "luminosity",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          paddingBottom: Math.max(safeBottom, 80),
        }}
        className="flex flex-col text-white relative overflow-hidden min-h-[400px] rounded-t-3xl"
      >
        <Drawer.Title asChild>
          <VisuallyHidden>Claim free transactions</VisuallyHidden>
        </Drawer.Title>

        {/* Header */}
        <div className="relative h-[52px] flex items-center justify-center shrink-0">
          <span className="text-base font-medium text-white tracking-[-0.176px]">
            Claim free transactions
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

        {/* Content */}
        <div className="flex-1 flex flex-col px-4 pt-4 pb-4">
          {/* Info Text */}
          <p className="text-base text-white/60 leading-5 text-center px-4 mb-8">
            You don&apos;t have SOL yet. Network fees (gas) can be
            paid with Telegram Stars, so add a small Stars balance to
            receive tokens.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full">
            <button
              onClick={handleJoinChannel}
              className="flex-1 px-4 py-3 rounded-xl text-sm text-white leading-5 active:opacity-80 transition-opacity"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(50, 229, 94, 0.15) 0%, rgba(50, 229, 94, 0.15) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)",
              }}
            >
              Join channel
            </button>
            <button
              onClick={handleSetCustomEmoji}
              className="flex-1 px-4 py-3 rounded-xl text-sm text-white leading-5 active:opacity-80 transition-opacity"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(50, 229, 94, 0.15) 0%, rgba(50, 229, 94, 0.15) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%)",
              }}
            >
              Set custom emoji
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
