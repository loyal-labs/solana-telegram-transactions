"use client";

import { hapticFeedback, themeParams } from "@telegram-apps/sdk-react";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import type { RGB } from "@telegram-apps/types";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import { ChevronRight, X } from "lucide-react";
import Image from "next/image";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useModalSnapPoint, useTelegramSafeArea } from "@/hooks/useTelegramSafeArea";
import {
  hideMainButton,
  showMainButton,
} from "@/lib/telegram/mini-app/buttons";
import { openLoyalTgLink } from "@/lib/telegram/mini-app/open-telegram-link";

export type GaslessBannerProps = {
  onHaptic?: () => void;
};

export default function GaslessBanner({ onHaptic }: GaslessBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const triggerHaptic = useCallback(() => {
    if (onHaptic) {
      onHaptic();
    } else if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
  }, [onHaptic]);

  const handleBannerClick = useCallback(() => {
    triggerHaptic();
    setIsModalOpen(true);
  }, [triggerHaptic]);

  const handleJoinLinkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    setIsModalOpen(true);
  }, [triggerHaptic]);

  const handleJoinButton = useCallback(() => {
    triggerHaptic();
    void openLoyalTgLink();
  }, [triggerHaptic]);

  const handleModalOpenChange = useCallback((open: boolean) => {
    setIsModalOpen(open);
  }, []);

  // Setup Telegram native button when modal is open
  useEffect(() => {
    if (!isModalOpen) {
      hideMainButton();
      return;
    }

    const shown = showMainButton({
      text: "Join",
      onClick: handleJoinButton,
      backgroundColor: buttonColors.background,
      textColor: buttonColors.text,
    });

    if (!shown) {
      hideMainButton();
    }

    return () => {
      hideMainButton();
    };
  }, [isModalOpen, handleJoinButton, buttonColors.background, buttonColors.text]);

  return (
    <>
      {/* Banner */}
      <div className="px-4 pb-4">
        <button
          onClick={handleBannerClick}
          className="flex gap-4 items-start pl-4 pr-[120px] py-3 rounded-2xl w-full relative text-left active:opacity-80 transition-opacity"
          style={{
            backgroundImage:
              "linear-gradient(70.22deg, rgba(0, 177, 251, 0) 0%, rgba(0, 177, 251, 0.08) 65%, rgba(0, 177, 251, 0.2) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.06) 100%)",
          }}
        >
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-base leading-5 text-white tracking-[-0.176px]">
                Gasless transactions for joining the Loyal Community
              </p>
              <div
                className="flex items-center"
                onClick={handleJoinLinkClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleJoinLinkClick(e as unknown as React.MouseEvent);
                  }
                }}
              >
                <span className="text-sm leading-5 text-white/60">Join</span>
                <ChevronRight
                  size={12}
                  strokeWidth={1.5}
                  className="text-white/60 mt-0.5"
                />
              </div>
            </div>
          </div>

          {/* Lightning SVG */}
          <div className="absolute right-[16px] top-[-12px] w-[100px] h-[100px] overflow-hidden">
            <Image
              src="/icons/molnia.svg"
              alt=""
              width={100}
              height={100}
              className="w-full h-full object-contain"
            />
          </div>
        </button>
      </div>

      {/* Modal */}
      <Modal
        aria-label="Gasless transactions"
        trigger={<button style={{ display: "none" }} />}
        open={isModalOpen}
        onOpenChange={handleModalOpenChange}
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
            <VisuallyHidden>Gasless transactions</VisuallyHidden>
          </Drawer.Title>

          {/* Close Button */}
          <Modal.Close>
            <div
              onClick={() => triggerHaptic()}
              className="absolute right-2 top-2 p-1.5 rounded-full flex items-center justify-center active:scale-95 active:bg-white/10 transition-all duration-150 cursor-pointer z-10"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
              }}
            >
              <X size={24} strokeWidth={1.5} className="text-white/60" />
            </div>
          </Modal.Close>

          {/* Content */}
          <div className="flex flex-col items-center p-8 gap-5">
            {/* Lightning GIF */}
            <div className="w-[124px] h-[124px] relative">
              <Image
                src="/icons/molnia.gif"
                alt=""
                width={124}
                height={124}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>

            {/* Text Content */}
            <div className="flex flex-col gap-3 items-center text-center w-full">
              <h2 className="text-2xl font-semibold leading-7 text-white">
                We Cover Your Gas Fees
              </h2>
              <p className="text-base leading-5 text-white/60">
                Join the Loyal community to have gas fees on your transactions
                covered
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
