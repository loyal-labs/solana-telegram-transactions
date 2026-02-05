"use client";

import { addToHomeScreen, postEvent } from "@telegram-apps/sdk";
import {
  hapticFeedback,
  openTelegramLink,
  retrieveLaunchParams,
} from "@telegram-apps/sdk-react";
import {
  ArrowUpRight,
  ChevronRight,
  CircleHelp,
  CirclePlus,
  Globe,
  Network,
  Smile,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTelegramUser } from "@/components/telegram/TelegramProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { setLoyalEmojiStatus } from "@/lib/telegram/mini-app/emoji-status";
import { cn } from "@/lib/utils";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
};

function Toggle({
  checked,
  onChange,
  disabled = false,
  activeColor = "#34c759",
}: ToggleProps) {
  const handleClick = () => {
    if (disabled) return;
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    onChange(!checked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      disabled={disabled}
      className={`relative h-[31px] w-[51px] rounded-full transition-colors duration-200 ease-in-out ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{
        backgroundColor: checked
          ? activeColor
          : "rgba(120, 120, 128, 0.16)",
      }}
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 h-[27px] w-[27px] rounded-full bg-white transition-all duration-200 ease-in-out"
        style={{
          left: checked ? "calc(100% - 29px)" : "2px",
          boxShadow:
            "0px 0px 0px 1px rgba(0, 0, 0, 0.04), 0px 3px 8px 0px rgba(0, 0, 0, 0.15), 0px 3px 1px 0px rgba(0, 0, 0, 0.06)",
        }}
      />
    </button>
  );
}

type ProfileCellProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  rightDetail?: string;
  showChevron?: boolean;
  showArrow?: boolean;
  toggle?: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    activeColor?: string;
  };
  onClick?: () => void;
  disabled?: boolean;
};

function ProfileCell({
  icon,
  title,
  subtitle,
  rightDetail,
  showChevron = false,
  showArrow = false,
  toggle,
  onClick,
  disabled = false,
}: ProfileCellProps) {
  const content = (
    <div
      className={`flex items-center w-full overflow-hidden px-4 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      {/* Left - Icon */}
      <div className="flex items-center pr-3 py-1.5">
        <div className="flex items-center justify-center pr-1 py-2.5">
          <div className="text-black/60">{icon}</div>
        </div>
      </div>

      {/* Middle - Text */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${subtitle ? "py-[9px]" : "py-[13px]"}`}
      >
        <p className="text-[17px] font-medium leading-[22px] tracking-[-0.187px] text-black">
          {title}
        </p>
        {subtitle && (
          <p className="text-[15px] font-normal leading-5 text-[rgba(60,60,67,0.6)]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right - Detail, Toggle, Arrow, or Chevron */}
      {rightDetail && (
        <div className="pl-3 flex items-center py-[13px]">
          <p className="text-[17px] font-normal leading-[22px] text-[rgba(60,60,67,0.6)] text-right">
            {rightDetail}
          </p>
        </div>
      )}
      {toggle && (
        <div className="pl-3">
          <Toggle
            checked={toggle.checked}
            onChange={toggle.onChange}
            disabled={disabled}
            activeColor={toggle.activeColor}
          />
        </div>
      )}
      {showArrow && (
        <div className="pl-3 flex items-center justify-center h-10 py-2">
          <ArrowUpRight size={24} className="text-[rgba(60,60,67,0.3)]" />
        </div>
      )}
      {showChevron && (
        <div className="pl-3 flex items-center justify-center h-10 py-2">
          <ChevronRight size={16} className="text-[rgba(60,60,67,0.3)]" />
        </div>
      )}
    </div>
  );

  if (onClick && !disabled) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left active:opacity-80 transition-opacity"
      >
        {content}
      </button>
    );
  }

  return content;
}

function SettingsSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f2f2f7] rounded-[20px] py-1">{children}</div>
  );
}

export default function ProfilePage() {
  const { userData, cachedAvatar, isAvatarLoading } = useTelegramUser();

  const [isMobilePlatform, setIsMobilePlatform] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);
  const [isMainnet, setIsMainnet] = useState(() => {
    if (typeof window !== "undefined") {
      const override = localStorage.getItem("solana-env-override");
      if (override) return override === "mainnet";
    }
    return process.env.NEXT_PUBLIC_SOLANA_ENV === "mainnet";
  });

  // Detect platform on mount
  useEffect(() => {
    let platform: string | undefined;
    try {
      const launchParams = retrieveLaunchParams();
      platform = launchParams.tgWebAppPlatform;
    } catch {
      if (typeof window !== "undefined") {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        platform = params.get("tgWebAppPlatform") || undefined;
      }
    }

    const isMobile = platform === "ios" || platform === "android";
    setIsMobilePlatform(isMobile);
  }, []);

  const fullName = useMemo(() => {
    if (!userData) return "User";
    return userData.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : userData.firstName;
  }, [userData]);

  const displayUsername = useMemo(() => {
    if (!userData?.username) return null;
    return `@${userData.username}`;
  }, [userData]);

  const avatarLetter = useMemo(() => {
    return fullName.charAt(0).toUpperCase();
  }, [fullName]);

  const addToHomeScreenDisabled = !isMobilePlatform;
  const addToHomeScreenTitle = isMobilePlatform
    ? "Add App to Home Screen"
    : "Add App to Home Screen (Mobile only)";

  const handleAddToHomeScreen = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    if (addToHomeScreen.isAvailable()) {
      addToHomeScreen();
    } else {
      postEvent("web_app_add_to_home_screen");
    }
  }, []);

  const handleSetCustomEmoji = useCallback(async () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    await setLoyalEmojiStatus();
  }, []);

  const handleSupport = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    if (openTelegramLink.isAvailable()) {
      openTelegramLink("https://t.me/spacesymmetry");
    }
  }, []);

  const handleMainnetToggle = useCallback((checked: boolean) => {
    setIsMainnet(checked);
    const newEnv = checked ? "mainnet" : "devnet";
    localStorage.setItem("solana-env-override", newEnv);
    setTimeout(() => window.location.reload(), 300);
  }, []);

  return (
    <main className="min-h-screen bg-white font-sans overflow-hidden relative">
      <div className="pb-32 max-w-md mx-auto flex flex-col min-h-screen">
        {/* Avatar and Name Section */}
        <div className="flex flex-col gap-4 items-center justify-center pt-8 pb-6 px-8">
          {/* Avatar */}
          {userData?.photoUrl && !isImageError ? (
            <div className="relative w-24 h-24">
              {(!isImageLoaded || isAvatarLoading) && (
                <Skeleton className="absolute inset-0 w-24 h-24 rounded-full z-10" />
              )}
              <Image
                src={cachedAvatar || userData.photoUrl}
                alt={fullName}
                width={96}
                height={96}
                className={cn(
                  "w-24 h-24 rounded-full object-cover transition-opacity duration-300",
                  !isImageLoaded || isAvatarLoading
                    ? "opacity-0"
                    : "opacity-100",
                )}
                priority
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setIsImageError(true)}
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl font-semibold text-white">
                {avatarLetter}
              </span>
            </div>
          )}

          {/* Name and Username */}
          <div className="flex flex-col gap-1 items-center text-center w-full">
            <p className="text-2xl font-semibold leading-7 text-black">
              {fullName}
            </p>
            {displayUsername && (
              <p className="text-[17px] leading-[22px] text-[rgba(60,60,67,0.6)]">
                {displayUsername}
              </p>
            )}
          </div>
        </div>

        {/* Settings Sections */}
        <div className="flex flex-col gap-4 px-4 pb-4">
          {/* Section 1: Language */}
          <SettingsSection>
            <ProfileCell
              icon={<Globe size={28} strokeWidth={1.5} />}
              title="Language"
              rightDetail="English"
              disabled
            />
          </SettingsSection>

          {/* Section 2: Actions */}
          <SettingsSection>
            <ProfileCell
              icon={<CirclePlus size={28} strokeWidth={1.5} />}
              title={addToHomeScreenTitle}
              showArrow
              onClick={handleAddToHomeScreen}
              disabled={addToHomeScreenDisabled}
            />
            <ProfileCell
              icon={<Smile size={28} strokeWidth={1.5} />}
              title="Set Custom Emoji"
              showArrow
              onClick={handleSetCustomEmoji}
            />
          </SettingsSection>

          {/* Section 3: Network */}
          <SettingsSection>
            <ProfileCell
              icon={<Network size={28} strokeWidth={1.5} />}
              title="Mainnet"
              toggle={{
                checked: isMainnet,
                onChange: handleMainnetToggle,
                activeColor: "#f9363c",
              }}
            />
          </SettingsSection>

          {/* Section 4: Support */}
          <SettingsSection>
            <ProfileCell
              icon={<CircleHelp size={28} strokeWidth={1.5} />}
              title="Support"
              subtitle="Report a bug or ask any question"
              showChevron
              onClick={handleSupport}
            />
          </SettingsSection>
        </div>
      </div>
    </main>
  );
}
