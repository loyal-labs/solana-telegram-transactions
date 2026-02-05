"use client";

import { addToHomeScreen, postEvent } from "@telegram-apps/sdk";
import {
  hapticFeedback,
  openTelegramLink,
  retrieveLaunchParams,
} from "@telegram-apps/sdk-react";
import { ChevronRight, CircleHelp, CirclePlus, Smile } from "lucide-react";
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
};

function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
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
        backgroundColor: checked ? "#2990ff" : "rgba(255, 255, 255, 0.06)",
        mixBlendMode: checked ? "normal" : "lighten",
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
  rightContent?: React.ReactNode;
  showChevron?: boolean;
  toggle?: {
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
  onClick?: () => void;
  disabled?: boolean;
  noBg?: boolean;
};

function ProfileCell({
  icon,
  title,
  subtitle,
  rightContent,
  showChevron = false,
  toggle,
  onClick,
  disabled = false,
  noBg = false,
}: ProfileCellProps) {
  const content = (
    <div
      className={`flex items-center w-full overflow-hidden pl-3 pr-4 py-1 ${
        disabled ? "opacity-50" : ""
      } ${noBg ? "" : "rounded-2xl"}`}
      style={
        noBg
          ? undefined
          : {
              background: "rgba(255, 255, 255, 0.06)",
              mixBlendMode: "lighten",
            }
      }
    >
      {/* Left - Icon */}
      <div className="flex items-center pr-3 py-1.5">
        <div
          className="flex items-center justify-center p-2.5 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            mixBlendMode: "lighten",
          }}
        >
          <div className="opacity-60">{icon}</div>
        </div>
      </div>

      {/* Middle - Text */}
      <div className="flex-1 flex flex-col gap-0.5 py-2.5 min-w-0">
        <p
          className={`text-base leading-5 ${
            disabled ? "text-white/60" : "text-white"
          }`}
        >
          {title}
        </p>
        {subtitle && (
          <p className="text-[13px] leading-4 text-white/60">{subtitle}</p>
        )}
      </div>

      {/* Right - Value, Toggle, or Chevron */}
      {rightContent && (
        <div className="pl-3">
          <p className="text-base leading-5 text-white/60 text-right">
            {rightContent}
          </p>
        </div>
      )}
      {toggle && (
        <div className="pl-3">
          <Toggle
            checked={toggle.checked}
            onChange={toggle.onChange}
            disabled={disabled}
          />
        </div>
      )}
      {showChevron && (
        <div className="pl-3 flex items-center justify-center h-10 py-2">
          <ChevronRight
            size={16}
            className={disabled ? "text-white/60" : "text-white"}
          />
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
    <div
      className="rounded-2xl py-1"
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        mixBlendMode: "lighten",
      }}
    >
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { userData, cachedAvatar, isAvatarLoading } = useTelegramUser();

  const [isMobilePlatform, setIsMobilePlatform] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Detect platform on mount
  useEffect(() => {
    let platform: string | undefined;
    try {
      const launchParams = retrieveLaunchParams();
      platform = launchParams.tgWebAppPlatform;
    } catch {
      // Fallback to hash parsing if SDK fails
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
    // Try SDK method first, fall back to direct postEvent for Android
    if (addToHomeScreen.isAvailable()) {
      addToHomeScreen();
    } else {
      // Direct postEvent as fallback
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

  return (
    <main className="min-h-screen text-white font-sans selection:bg-teal-500/30 overflow-hidden relative">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "#16161a",
        }}
      />

      <div className="relative z-10 pb-32 max-w-md mx-auto flex flex-col min-h-screen">
        {/* Avatar and Name Section */}
        <div className="flex flex-col gap-4 items-center justify-center pt-8 pb-6 px-8">
          {/* Avatar */}
          {userData?.photoUrl ? (
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
                  !isImageLoaded || isAvatarLoading ? "opacity-0" : "opacity-100"
                )}
                priority
                onLoad={() => setIsImageLoaded(true)}
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
            <p className="text-2xl font-semibold leading-7 text-white">
              {fullName}
            </p>
            {displayUsername && (
              <p className="text-base leading-5 text-white/60">
                {displayUsername}
              </p>
            )}
          </div>
        </div>

        {/* Settings Sections */}
        <div className="flex flex-col gap-4 px-4 pb-4">
          {/* Section 1: Settings */}
          <SettingsSection>
            {/* Language */}
            <ProfileCell
              icon={
                <Image
                  src="/globe.svg"
                  alt="Language"
                  width={28}
                  height={28}
                  className="opacity-60"
                />
              }
              title="Language"
              rightContent="English"
              disabled
              noBg
            />
          </SettingsSection>

          {/* Section 2: Actions */}
          <SettingsSection>
            {/* Add to Home Screen */}
            <ProfileCell
              icon={<CirclePlus size={28} strokeWidth={1.5} />}
              title={addToHomeScreenTitle}
              showChevron
              onClick={handleAddToHomeScreen}
              disabled={addToHomeScreenDisabled}
              noBg
            />

            {/* Set Custom Emoji */}
            <ProfileCell
              icon={<Smile size={28} strokeWidth={1.5} />}
              title="Set Custom Emoji"
              showChevron
              onClick={handleSetCustomEmoji}
              noBg
            />
          </SettingsSection>

          {/* Section 3: Help */}
          <SettingsSection>
            {/* Support */}
            <ProfileCell
              icon={<CircleHelp size={28} strokeWidth={1.5} />}
              title="Support"
              subtitle="Report a bug or ask any question"
              showChevron
              onClick={handleSupport}
              noBg
            />
          </SettingsSection>
        </div>
      </div>
    </main>
  );
}
