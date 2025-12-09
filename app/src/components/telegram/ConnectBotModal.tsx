"use client";

import { hapticFeedback, themeParams } from "@telegram-apps/sdk-react";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import type { RGB } from "@telegram-apps/types";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import { X } from "lucide-react";
import Image from "next/image";
import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";

import { useModalSnapPoint, useTelegramSafeArea } from "@/hooks/useTelegramSafeArea";
import {
  hideMainButton,
  hideSecondaryButton,
  showMainButton,
} from "@/lib/telegram/mini-app/buttons";

export type ConnectBotModalProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function ConnectBotModal({
  open,
  onOpenChange,
}: ConnectBotModalProps) {
  const snapPoint = useModalSnapPoint();
  const { bottom: safeBottom } = useTelegramSafeArea();

  const [buttonColors] = useState(() => {
    try {
      const background = (themeParams.buttonColor?.() ?? "#2990ff") as RGB;
      const text = (themeParams.buttonTextColor?.() ?? "#ffffff") as RGB;
      return { background, text };
    } catch {
      return { background: "#2990ff" as RGB, text: "#ffffff" as RGB };
    }
  });

  const modalStyle = useMemo(
    () =>
      ({
        "--tgui--bg_color": "transparent",
        "--tgui--divider": "rgba(255, 255, 255, 0.05)",
      }) as CSSProperties,
    [],
  );

  const handleCopyUsername = useCallback(async () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    try {
      await navigator.clipboard.writeText("askloyal_tgbot");
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred("success");
      }
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = "askloyal_tgbot";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  }, []);

  // Show/hide native Telegram button based on modal open state
  useEffect(() => {
    if (!open) {
      hideMainButton();
      hideSecondaryButton();
      return;
    }

    showMainButton({
      text: "Copy Bot Username",
      onClick: handleCopyUsername,
      backgroundColor: buttonColors.background,
      textColor: buttonColors.text,
    });

    hideSecondaryButton();

    return () => {
      hideMainButton();
      hideSecondaryButton();
    };
  }, [open, handleCopyUsername, buttonColors.background, buttonColors.text]);

  return (
    <Modal
      aria-label="Connect Loyal Bot"
      trigger={<button style={{ display: "none" }} />}
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
        className="flex flex-col text-white relative overflow-hidden min-h-[500px] rounded-t-3xl"
      >
        <Drawer.Title asChild>
          <VisuallyHidden>Connect Loyal Bot</VisuallyHidden>
        </Drawer.Title>

        {/* Close Button */}
        <Modal.Close>
          <div
            onClick={() => {
              if (hapticFeedback.impactOccurred.isAvailable()) {
                hapticFeedback.impactOccurred("light");
              }
            }}
            className="absolute right-2 top-2 p-1.5 rounded-full flex items-center justify-center active:scale-95 active:bg-white/10 transition-all duration-150 cursor-pointer z-10"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
            }}
          >
            <X size={24} strokeWidth={1.5} className="text-white/60" />
          </div>
        </Modal.Close>

        {/* Content */}
        <div className="flex flex-col items-center p-8">
          {/* Page Header */}
          <div className="flex flex-col gap-5 items-center w-full">
            {/* Robot Image */}
            <div className="relative w-[124px] h-[124px]">
              <Image
                src="/icons/robot.gif"
                alt="Loyal Bot"
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Text Layout */}
            <div className="flex flex-col gap-3 items-center text-center w-full">
              <h2 className="text-2xl font-semibold text-white leading-7">
                Connect Loyal Bot to Your Account
              </h2>
              <p className="text-base text-white/60 leading-5">
                Loyal bot will process your Telegram messages and generate short summaries you can review in this app
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col pb-5">
          {/* Step 1 */}
          <div className="flex items-start px-4 py-0">
            <div className="flex items-start pl-0 pr-3 py-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: buttonColors.background }}
              >
                <span className="text-sm font-medium text-white leading-5">1</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-start py-2.5">
              <p className="text-base text-white leading-5">
                Go to Telegram Settings {">"} Telegram Business {">"} Chatbots
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start px-4 py-0">
            <div className="flex items-start pl-0 pr-3 py-2 self-stretch">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: buttonColors.background }}
              >
                <span className="text-sm font-medium text-white leading-5">2</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-0.5 items-start py-2.5">
              <p className="text-base text-white leading-5">Add Loyal bot</p>
              <p className="text-[13px] text-white/60 leading-4">
                Connect <span className="text-white">@askloyal_tgbot</span> to your account and choose which chats the bot can access
              </p>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}
