"use client";

import { hapticFeedback, themeParams, useRawInitData } from "@telegram-apps/sdk-react";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import type { RGB } from "@telegram-apps/types";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import { X } from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useModalSnapPoint, useTelegramSafeArea } from "@/hooks/useTelegramSafeArea";
import {
  hideMainButton,
  hideSecondaryButton,
  showMainButton,
  showSecondaryButton,
} from "@/lib/telegram/mini-app/buttons";
import { setCloudValue } from "@/lib/telegram/mini-app/cloud-storage";
import { setLoyalEmojiStatus } from "@/lib/telegram/mini-app/emoji-status";
import { openLoyalTgLink } from "@/lib/telegram/mini-app/open-telegram-link";

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
  const rawInitData = useRawInitData();
  const snapPoint = useModalSnapPoint();
  const { bottom: safeBottom } = useTelegramSafeArea();
  const [selectedAction, setSelectedAction] = useState<"join-channel" | "custom-emoji" | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
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

  const resolveEndpoint = useCallback((path: string): string => {
    const serverHost = process.env.NEXT_PUBLIC_SERVER_HOST;

    if (typeof window !== "undefined") {
      if (!serverHost) return path;
      try {
        const configured = new URL(serverHost);
        const current = new URL(window.location.origin);
        const hostsMatch =
          configured.protocol === current.protocol &&
          configured.host === current.host;
        return hostsMatch
          ? new URL(path, configured).toString()
          : path;
      } catch {
        return path;
      }
    }

    return serverHost
      ? new URL(path, serverHost).toString()
      : path;
  }, []);

  const handleJoinChannel = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setSelectedAction("join-channel");
    void openLoyalTgLink();
  }, []);

  const handleSetCustomEmoji = useCallback(async () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setSelectedAction("custom-emoji");
    const success = await setLoyalEmojiStatus();
    if (!success) {
      console.warn("Failed to set custom emoji status");
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (!selectedAction) return;
    if (!rawInitData) {
      console.error("Cannot verify: Telegram init data is missing");
      return;
    }
    if (isVerifying) return;

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("medium");
    }

    setIsVerifying(true);

    const path =
      selectedAction === "custom-emoji"
        ? "/api/telegram/verify/emoji"
        : "/api/telegram/verify/join";
    const endpoint = resolveEndpoint(path);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new TextEncoder().encode(rawInitData),
      });

      const payload = await response
        .json()
        .catch(async () => ({ error: await response.text().catch(() => null) }));

      if (!response.ok) {
        console.error("Verification failed", payload);
        return;
      }

      console.log("Verification success", payload);
      void setCloudValue("gassless-action", "true");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("claim-free-verified"));
      }

      if (onOpenChange) {
        onOpenChange(false);
      }
      setSelectedAction(null);
    } catch (error) {
      console.error("Verification request failed", error);
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, onOpenChange, rawInitData, resolveEndpoint, selectedAction]);

  useEffect(() => {
    if (!open) {
      setSelectedAction(null);
      setIsVerifying(false);
      hideMainButton();
      hideSecondaryButton();
      return;
    }

    if (selectedAction) {
      const verifyShown = showMainButton({
        text: "Verify",
        onClick: handleVerify,
        backgroundColor: buttonColors.background,
        textColor: buttonColors.text,
        isEnabled: Boolean(rawInitData) && !isVerifying,
        showLoader: isVerifying,
      });

      hideSecondaryButton();

      if (!verifyShown) {
        hideMainButton();
      }

      return () => {
        hideMainButton();
        hideSecondaryButton();
      };
    }

    const mainShown = showMainButton({
      text: "Join channel",
      onClick: handleJoinChannel,
      backgroundColor: buttonColors.background,
      textColor: buttonColors.text,
    });

    const secondaryShown = showSecondaryButton({
      text: "Set custom emoji",
      position: "left",
      onClick: handleSetCustomEmoji,
      backgroundColor: buttonColors.background,
      textColor: buttonColors.text,
    });

    // If Telegram native buttons are unavailable, fall back to hiding both
    if (!mainShown && !secondaryShown) {
      hideMainButton();
      hideSecondaryButton();
    }

    return () => {
      hideMainButton();
      hideSecondaryButton();
    };
  }, [
    buttonColors.background,
    buttonColors.text,
    handleJoinChannel,
    handleSetCustomEmoji,
    handleVerify,
    isVerifying,
    open,
    rawInitData,
    selectedAction,
  ]);

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
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 text-center gap-6">
          {/* Info Text */}
          <p className="text-base text-white/60 leading-5 px-4">
            Complete either of the following tasks to get gasless transactions.
          </p>
          <p className="text-sm text-white/50 leading-5 px-6">
            Use the Telegram buttons to join the channel or set a custom emoji and unlock free transactions.
          </p>
        </div>
      </div>
    </Modal>
  );
}
