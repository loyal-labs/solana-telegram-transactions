"use client";

import { hapticFeedback } from "@telegram-apps/sdk-react";
import { CloudOff, DatabaseBackup } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConnectBotBannerProps {
  onConnectBot: () => void;
}

/**
 * Banner prompting users to connect the Loyal Bot to their Telegram account.
 * Shown on Direct and Spam tabs when the bot is not connected yet.
 */
export function ConnectBotBanner({ onConnectBot }: ConnectBotBannerProps) {
  return (
    <div className="px-3 py-2">
      <div className="bg-white/[0.06] rounded-2xl pl-3 pr-11 py-1">
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-medium text-white leading-5 tracking-[-0.176px]">
              Connect Loyal Bot to Your Account
            </p>
            <p className="text-[13px] text-white/60 leading-4">
              Loyal private AI will summarize, prioritize, and filter your Telegram chats so you can review what matters in this app
            </p>
          </div>
          <div>
            <button
              onClick={onConnectBot}
              className="bg-white/[0.06] rounded-full px-4 py-2 active:opacity-80 transition-opacity"
            >
              <span className="text-sm font-medium text-white leading-5">
                Connect Loyal Bot
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BotDisconnectedBannerProps {
  onReconnect: () => void;
}

/**
 * Banner shown when the Loyal Bot has been disconnected from Telegram Business settings.
 * Has a red/error background styling to indicate the problem.
 */
export function BotDisconnectedBanner({ onReconnect }: BotDisconnectedBannerProps) {
  const handleReconnect = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("medium");
    }
    onReconnect();
  };

  return (
    <div className="px-3 py-2">
      <div
        className="flex items-start px-3 py-1 rounded-2xl"
        style={{ backgroundColor: "rgba(255, 51, 71, 0.14)" }}
      >
        {/* Left - Icon */}
        <div className="flex items-center pl-0 pr-3 py-2">
          <CloudOff size={24} strokeWidth={1.5} className="text-white" />
        </div>

        {/* Content Middle */}
        <div className="flex-1 flex flex-col gap-3 items-start justify-center py-2.5">
          {/* Text Layout */}
          <div className="flex flex-col gap-0.5 w-full">
            <p className="text-base font-medium text-white leading-5 tracking-[-0.176px]">
              Loyal Bot is Disconnected
            </p>
            <p className="text-[13px] text-white/60 leading-4">
              The bot was turned off in your Telegram Business settings, so we&apos;ve stopped processing your messages and updating summaries. Turn it back on to keep using Loyal private AI for your chats.
            </p>
          </div>

          {/* Button */}
          <div>
            <button
              onClick={handleReconnect}
              className="bg-white/[0.06] mix-blend-lighten rounded-full px-4 py-2 active:opacity-80 transition-opacity"
            >
              <span className="text-sm font-medium text-white leading-5">
                Reconnect Loyal Bot
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Banner shown when Cloud Storage permission is required.
 * Links to the Settings page with a highlight parameter to show which setting needs attention.
 */
export function PermissionRequiredBanner() {
  const router = useRouter();

  const handleGoToSettings = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("medium");
    }
    // Navigate to settings with highlight parameter
    router.push("/telegram/profile?highlight=cloud-storage");
  };

  return (
    <div className="px-3 py-2">
      <div
        className="flex items-start px-3 py-1 rounded-2xl"
        style={{ backgroundColor: "rgba(255, 165, 0, 0.14)" }}
      >
        {/* Left - Icon */}
        <div className="flex items-center pl-0 pr-3 py-2">
          <DatabaseBackup size={24} strokeWidth={1.5} className="text-white" />
        </div>

        {/* Content Middle */}
        <div className="flex-1 flex flex-col gap-3 items-start justify-center py-2.5">
          {/* Text Layout */}
          <div className="flex flex-col gap-0.5 w-full">
            <p className="text-base font-medium text-white leading-5 tracking-[-0.176px]">
              Permission required
            </p>
            <p className="text-[13px] text-white/60 leading-4">
              Cloud Storage permission is turned off, please enable it in Settings so Loyal bot can process your messages and update summaries.
            </p>
          </div>

          {/* Button */}
          <div>
            <button
              onClick={handleGoToSettings}
              className="bg-white/[0.06] mix-blend-lighten rounded-full px-4 py-2 active:opacity-80 transition-opacity"
            >
              <span className="text-sm font-medium text-white leading-5">
                Go to Settings
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
