"use client";

import { addToHomeScreen, postEvent } from "@telegram-apps/sdk";
import {
  hapticFeedback,
  openTelegramLink,
  retrieveLaunchParams,
  useRawInitData,
  useSignal,
  viewport,
} from "@telegram-apps/sdk-react";
import type { Signal } from "@telegram-apps/signals";
import {
  ChevronRight,
  CircleHelp,
  CirclePlus,
  Database,
  Smile,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { setLoyalEmojiStatus } from "@/lib/telegram/mini-app/emoji-status";
import { cleanInitData } from "@/lib/telegram/mini-app/init-data-transform";

type UserData = {
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
};

function parseUserFromInitData(
  rawInitData: string | undefined
): UserData | null {
  if (!rawInitData) return null;

  try {
    const cleanData = cleanInitData(rawInitData);
    const userField = cleanData["user"];

    if (typeof userField === "string") {
      const parsedUser = JSON.parse(userField);
      return {
        firstName: parsedUser.first_name || "User",
        lastName: parsedUser.last_name,
        username: parsedUser.username,
        photoUrl: parsedUser.photo_url,
      };
    } else if (typeof userField === "object" && userField !== null) {
      const user = userField as Record<string, unknown>;
      return {
        firstName: (user.first_name as string) || "User",
        lastName: user.last_name as string | undefined,
        username: user.username as string | undefined,
        photoUrl: user.photo_url as string | undefined,
      };
    }
  } catch (error) {
    console.warn("Failed to parse user data from initData", error);
  }

  return null;
}

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
  cellRef?: React.RefObject<HTMLDivElement | null>;
  highlight?: boolean;
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
  cellRef,
  highlight = false,
}: ProfileCellProps) {
  const content = (
    <div
      ref={cellRef}
      className={`flex items-center w-full overflow-hidden pl-3 pr-4 py-1 ${
        disabled ? "opacity-50" : ""
      } ${noBg ? "" : "rounded-2xl"} ${highlight ? "animate-highlight-border" : ""}`}
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
  const safeAreaInsetTop = useSignal(
    viewport.safeAreaInsetTop as Signal<number>
  );
  const contentSafeAreaInsetTop = useSignal(
    viewport.contentSafeAreaInsetTop as Signal<number>
  );
  const rawInitData = useRawInitData();
  const searchParams = useSearchParams();

  const [isMobilePlatform, setIsMobilePlatform] = useState(false);
  const [isCloudStorageEnabled, setIsCloudStorageEnabled] = useState(false);
  const [highlightCloudStorage, setHighlightCloudStorage] = useState(false);
  const cloudStorageRef = useRef<HTMLDivElement>(null);

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

  // Handle highlight param from URL (e.g., from PermissionRequiredBanner)
  useEffect(() => {
    const highlight = searchParams.get("highlight");
    if (highlight === "cloud-storage") {
      // Small delay to ensure the page has rendered
      const scrollTimer = setTimeout(() => {
        cloudStorageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);

      // Start the highlight animation after scroll
      const highlightTimer = setTimeout(() => {
        setHighlightCloudStorage(true);
        if (hapticFeedback.notificationOccurred.isAvailable()) {
          hapticFeedback.notificationOccurred("warning");
        }
      }, 400);

      // Remove highlight after animation completes (1 cycle = 1s)
      const clearTimer = setTimeout(() => {
        setHighlightCloudStorage(false);
      }, 1400);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(highlightTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [searchParams]);

  const userData = useMemo(
    () => parseUserFromInitData(rawInitData),
    [rawInitData]
  );

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

      <div
        className="relative z-10 pb-32 max-w-md mx-auto flex flex-col min-h-screen"
        style={{
          paddingTop: `${Math.max(
            (safeAreaInsetTop || 0) + (contentSafeAreaInsetTop || 0),
            20
          )}px`,
        }}
      >
        {/* Avatar and Name Section */}
        <div className="flex flex-col gap-4 items-center justify-center pt-8 pb-6 px-8">
          {/* Avatar */}
          {userData?.photoUrl ? (
            <Image
              src={userData.photoUrl}
              alt={fullName}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover"
            />
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

            {/* Cloud Storage */}
            <ProfileCell
              icon={<Database size={28} strokeWidth={1.5} />}
              title="Cloud Storage"
              subtitle="Loyal bot will process your Telegram messages and generate summaries"
              toggle={{
                checked: isCloudStorageEnabled,
                onChange: setIsCloudStorageEnabled,
              }}
              noBg
              cellRef={cloudStorageRef}
              highlight={highlightCloudStorage}
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
