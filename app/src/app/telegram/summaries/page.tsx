"use client";

import { hapticFeedback, themeParams } from "@telegram-apps/sdk-react";
import { CircleHelp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Mock chat data - matches the summaries in SummaryFeed.tsx
const MOCK_CHATS = [
  {
    id: "1",
    title: "The Loyal Community",
    subtitle:
      "Blockchain technology offers a way to coordinate many independent actors around a single, append-only record of events.",
  },
  {
    id: "2",
    title: "X Live classic",
    subtitle: "Latest updates and discussions about live performances",
  },
  {
    id: "3",
    title: "Gift Concepts",
    subtitle: "Creative ideas for digital gifts and collectibles",
  },
  {
    id: "4",
    title: "TON Community",
    subtitle: "The Open Network community discussions and updates",
  },
  {
    id: "5",
    title: "Solana Developers",
    subtitle: "Building on Solana blockchain",
  },
];

// Generate a consistent color based on the chat title
function getAvatarColor(title: string): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#96CEB4", // Green
    "#FFEAA7", // Yellow
    "#DDA0DD", // Plum
    "#98D8C8", // Mint
    "#F7DC6F", // Gold
    "#BB8FCE", // Purple
    "#85C1E9", // Light Blue
  ];

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Get the first letter of the title (skip emojis)
function getFirstLetter(title: string): string {
  // Remove emojis and get first alphanumeric character
  const cleaned = title
    .replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ""
    )
    .trim();
  return cleaned.charAt(0).toUpperCase() || title.charAt(0).toUpperCase();
}

interface ChatItemProps {
  chat: { id: string; title: string; subtitle?: string };
  onClick: () => void;
  showDivider?: boolean;
}

function ChatItem({ chat, onClick, showDivider = true }: ChatItemProps) {
  const avatarColor = getAvatarColor(chat.title);
  const firstLetter = getFirstLetter(chat.title);

  return (
    <div className="px-4">
      <button
        onClick={onClick}
        className="flex items-center w-full py-2 active:opacity-80 transition-opacity text-left"
      >
        {/* Avatar */}
        <div className="pr-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: avatarColor }}
          >
            <span className="text-xl font-medium text-white">{firstLetter}</span>
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <p className="text-base text-white leading-5 truncate">{chat.title}</p>
          {chat.subtitle && (
            <p className="text-[13px] text-white/60 leading-4 truncate">
              {chat.subtitle}
            </p>
          )}
        </div>
      </button>
      {showDivider && <div className="h-px bg-white/10 ml-[68px]" />}
    </div>
  );
}

// Tab types
type TabId = "groups" | "direct" | "personal" | "work";

interface Tab {
  id: TabId;
  label: string;
  count: number;
}

const TABS: Tab[] = [
  { id: "groups", label: "Groups", count: 19 },
  { id: "direct", label: "Direct", count: 4 },
  { id: "personal", label: "Personal", count: 8 },
  { id: "work", label: "Work", count: 0 },
];

interface EmptyStateBannerProps {
  onClose: () => void;
  onConnectChats: () => void;
}

function EmptyStateBanner({ onClose, onConnectChats }: EmptyStateBannerProps) {
  return (
    <div className="px-3 pt-1 pb-2">
      <div className="relative bg-white/[0.06] rounded-2xl overflow-hidden pl-4 pr-11 py-4">
        <div className="flex flex-col gap-3">
          {/* Text Content */}
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-medium text-white leading-5 tracking-[-0.18px]">
              No summarized chats yet
            </p>
            <p className="text-[13px] text-white/60 leading-[18px] tracking-[-0.08px]">
              Connect your Telegram groups to start getting summaries here.
            </p>
          </div>

          {/* Connect Button */}
          <div>
            <button
              onClick={onConnectChats}
              className="bg-white/[0.06] backdrop-blur-xl rounded-full px-4 py-2 active:opacity-80 transition-opacity"
            >
              <span className="text-sm font-medium text-white leading-5">
                Connect Chats
              </span>
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 active:opacity-80 transition-opacity"
        >
          <X size={24} strokeWidth={1.5} className="text-white/60" />
        </button>
      </div>
    </div>
  );
}

interface TooltipProps {
  text: string;
  color: string;
}

function Tooltip({ text, color }: TooltipProps) {
  return (
    <div className="absolute top-full right-0 mt-2.5 z-20">
      {/* Tail/Arrow - centered under the ? icon (button is ~48px, center at 24px) */}
      <div className="absolute -top-2 right-[18px] w-4 h-2 overflow-hidden">
        <div
          className="w-4 h-4 rotate-45 origin-bottom-left"
          style={{ backgroundColor: color }}
        />
      </div>
      {/* Tooltip Body */}
      <div
        className="rounded-xl p-2.5 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.04),0px_4px_32px_0px_rgba(0,0,0,0.16)]"
        style={{ backgroundColor: color }}
      >
        <p className="text-[13px] text-white leading-4 text-center whitespace-nowrap">{text}</p>
      </div>
    </div>
  );
}

export default function SummariesPage() {
  const router = useRouter();
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("groups");
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [buttonColor] = useState(() => {
    try {
      return themeParams.buttonColor() || "#2990ff";
    } catch {
      return "#2990ff";
    }
  });

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!isTooltipVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setIsTooltipVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isTooltipVisible]);

  const handleHelpClick = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setIsTooltipVisible((prev) => !prev);
  };

  const handleChatClick = (chat: (typeof MOCK_CHATS)[0]) => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    router.push(`/telegram/summaries/feed?chatId=${chat.id}`);
  };

  const handleBannerClose = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    setIsBannerDismissed(true);
  };

  const handleConnectChats = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("medium");
    }
    // TODO: Navigate to connect chats flow
  };

  return (
    <main
      className="h-screen text-white font-sans overflow-y-auto relative flex flex-col"
      style={{ background: "#16161a" }}
    >
      {/* Header - fixed at top */}
      <div
        className="sticky top-0 z-10"
        style={{
          paddingTop: "calc(var(--app-safe-top, 20px) + 4px)",
          background: "#16161a",
        }}
      >
        <div className="flex items-center pl-4 pr-1.5">
          <div className="flex-1 py-3 pr-3">
            <h1 className="text-xl font-semibold text-white leading-6">Chat Highlights</h1>
          </div>
          <div className="h-12 flex items-center relative" ref={tooltipRef}>
            <button className="p-2.5" onClick={handleHelpClick}>
              <CircleHelp
                size={28}
                strokeWidth={1.5}
                className="text-white opacity-40"
              />
            </button>
            {isTooltipVisible && (
              <Tooltip
                text="These are your Telegram chats that have summaries available."
                color={buttonColor}
              />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex pl-4 gap-4 border-b border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (hapticFeedback.impactOccurred.isAvailable()) {
                  hapticFeedback.impactOccurred("light");
                }
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-1.5 pb-2.5 pt-1 relative transition-colors ${
                activeTab === tab.id ? "text-white" : "text-white/60"
              }`}
            >
              <span className="text-[15px] font-medium leading-5">{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className="text-xs font-medium leading-4 px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: buttonColor }}
                >
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List or Empty State */}
      {MOCK_CHATS.length === 0 ? (
        <div className="flex-1 flex flex-col pt-1">
          {!isBannerDismissed && (
            <EmptyStateBanner
              onClose={handleBannerClose}
              onConnectChats={handleConnectChats}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col pt-2 pb-4">
          {MOCK_CHATS.map((chat, index) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              onClick={() => handleChatClick(chat)}
              showDivider={index < MOCK_CHATS.length - 1}
            />
          ))}

          {/* Bottom padding for navigation */}
          <div className="h-32 shrink-0" />
        </div>
      )}
    </main>
  );
}
