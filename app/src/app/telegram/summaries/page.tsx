"use client";

import { hapticFeedback, themeParams } from "@telegram-apps/sdk-react";
import { motion, type PanInfo } from "framer-motion";
import { CircleHelp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ConnectBotBanner } from "@/components/telegram/ChatBanners";
import ConnectBotModal from "@/components/telegram/ConnectBotModal";

// Mock chat data for Groups tab - matches the summaries in SummaryFeed.tsx
const MOCK_GROUP_CHATS = [
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

// Mock chat data for Direct tab - personal conversations
const MOCK_DIRECT_CHATS = [
  {
    id: "d1",
    title: "Alice Johnson",
    subtitle: "Hey! Did you see the latest update on the project?",
    messageCount: 47,
  },
  {
    id: "d2",
    title: "Bob Smith",
    subtitle: "Thanks for helping with that bug yesterday",
    messageCount: 23,
  },
  {
    id: "d3",
    title: "Charlie Davis",
    subtitle: "Can we schedule a call for tomorrow?",
    messageCount: 156,
  },
  {
    id: "d4",
    title: "Diana Wilson",
    subtitle: "The design looks great! Just a few small tweaks...",
    messageCount: 89,
  },
];

// Mock chat data for Spam tab
const MOCK_SPAM_CHATS = [
  {
    id: "s1",
    title: "Crypto Giveaway Bot",
    subtitle: "Congratulations! You've won 10 ETH! Click here to claim...",
    messageCount: 12,
  },
  {
    id: "s2",
    title: "Investment Guru",
    subtitle: "Make $10,000 daily with this secret trading strategy!",
    messageCount: 34,
  },
  {
    id: "s3",
    title: "Lucky Winner",
    subtitle: "You have been selected for an exclusive NFT airdrop...",
    messageCount: 8,
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

interface ChatItemSkeletonProps {
  showDivider?: boolean;
  titleWidth?: string;
  subtitleWidth?: string;
}

function ChatItemSkeleton({
  showDivider = true,
  titleWidth = "w-32",
  subtitleWidth = "w-48",
}: ChatItemSkeletonProps) {
  return (
    <div className="px-4">
      <div className="flex items-center w-full py-2">
        {/* Avatar Skeleton */}
        <div className="pr-3">
          <div className="w-14 h-14 rounded-full bg-white/5 animate-pulse" />
        </div>

        {/* Title and Subtitle Skeleton */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className={`${titleWidth} h-5 bg-white/5 animate-pulse rounded`} />
          <div className={`${subtitleWidth} h-4 bg-white/5 animate-pulse rounded`} />
        </div>
      </div>
      {showDivider && <div className="h-px bg-white/10 ml-[68px]" />}
    </div>
  );
}

// Skeleton configurations for visual variety
const SKELETON_CONFIGS = [
  { titleWidth: "w-36", subtitleWidth: "w-52" },
  { titleWidth: "w-28", subtitleWidth: "w-44" },
  { titleWidth: "w-32", subtitleWidth: "w-56" },
  { titleWidth: "w-24", subtitleWidth: "w-40" },
  { titleWidth: "w-40", subtitleWidth: "w-48" },
];

function ChatListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ChatItemSkeleton
          key={index}
          showDivider={index < count - 1}
          titleWidth={SKELETON_CONFIGS[index % SKELETON_CONFIGS.length].titleWidth}
          subtitleWidth={SKELETON_CONFIGS[index % SKELETON_CONFIGS.length].subtitleWidth}
        />
      ))}
    </>
  );
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
type TabId = "groups" | "direct" | "spam";

interface Tab {
  id: TabId;
  label: string;
  count: number;
  hasDividerBefore?: boolean;
}

// Tab data will be computed dynamically based on mock data
const getTabsData = (): Tab[] => [
  { id: "groups", label: "Groups", count: MOCK_GROUP_CHATS.length },
  { id: "direct", label: "Direct", count: MOCK_DIRECT_CHATS.length, hasDividerBefore: true },
  { id: "spam", label: "Spam", count: MOCK_SPAM_CHATS.length },
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

const ACTIVE_TAB_STORAGE_KEY = "summaries_active_tab";

export default function SummariesPage() {
  const router = useRouter();
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    // Initialize from localStorage, default to "direct"
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
      if (saved === "groups" || saved === "direct" || saved === "spam") {
        return saved;
      }
    }
    return "direct";
  });
  const [isConnectBotModalOpen, setIsConnectBotModalOpen] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<1 | -1>(1); // 1 = from right, -1 = from left
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [buttonColor] = useState(() => {
    try {
      return themeParams.buttonColor() || "#2990ff";
    } catch {
      return "#2990ff";
    }
  });

  // Get tabs data and current chat list based on active tab
  const tabs = getTabsData();
  const currentChatList = activeTab === "groups"
    ? MOCK_GROUP_CHATS
    : activeTab === "direct"
      ? MOCK_DIRECT_CHATS
      : MOCK_SPAM_CHATS;

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  // Simulate loading state when tab changes (replace with real data fetching)
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Simulated loading delay
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Handle swipe to switch tabs
  const handleSwipe = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const SWIPE_THRESHOLD = 50;
      const tabOrder: TabId[] = ["groups", "direct", "spam"];
      const currentIndex = tabOrder.indexOf(activeTab);

      if (info.offset.x < -SWIPE_THRESHOLD && currentIndex < tabOrder.length - 1) {
        // Swipe left - go to next tab (content comes from right)
        if (hapticFeedback.impactOccurred.isAvailable()) {
          hapticFeedback.impactOccurred("light");
        }
        setSwipeDirection(1);
        setActiveTab(tabOrder[currentIndex + 1]);
      } else if (info.offset.x > SWIPE_THRESHOLD && currentIndex > 0) {
        // Swipe right - go to previous tab (content comes from left)
        if (hapticFeedback.impactOccurred.isAvailable()) {
          hapticFeedback.impactOccurred("light");
        }
        setSwipeDirection(-1);
        setActiveTab(tabOrder[currentIndex - 1]);
      }
    },
    [activeTab]
  );

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

  const handleChatClick = (chat: { id: string; title: string; subtitle?: string; messageCount?: number }) => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }

    // Groups tab: navigate to SummaryFeed page (vertical swipe)
    if (activeTab === "groups") {
      router.push(`/telegram/summaries/feed?chatId=${chat.id}`);
      return;
    }

    // Direct and Spam tabs: navigate to DirectFeed page (horizontal swipe)
    router.push(`/telegram/summaries/direct?chatId=${chat.id}&tab=${activeTab}`);
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

  const handleConnectBot = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("medium");
    }
    setIsConnectBotModalOpen(true);
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
        <div className="flex pl-4 border-b border-white/10">
          {tabs.map((tab, index) => (
            <div key={tab.id} className="flex items-center">
              {/* Vertical divider before tab if specified */}
              {tab.hasDividerBefore && (
                <div className="flex items-center self-stretch px-2">
                  <div className="w-px h-5 bg-white/20 rounded-[1px]" />
                </div>
              )}
              <button
                onClick={() => {
                  if (hapticFeedback.impactOccurred.isAvailable()) {
                    hapticFeedback.impactOccurred("light");
                  }
                  const tabOrder: TabId[] = ["groups", "direct", "spam"];
                  const currentIndex = tabOrder.indexOf(activeTab);
                  const targetIndex = tabOrder.indexOf(tab.id);
                  setSwipeDirection(targetIndex > currentIndex ? 1 : -1);
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-1.5 pr-4 pb-2.5 pt-1 relative transition-colors ${
                  index > 0 ? "pl-4" : ""
                } ${activeTab === tab.id ? "text-white" : "text-white/60"}`}
              >
                <span className="text-base font-medium leading-5 tracking-[-0.176px]">{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className="text-xs font-medium leading-4 px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: buttonColor }}
                  >
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div
                    className={`absolute bottom-0 right-3 h-[3px] rounded-t-[4px] rounded-b-[1px] bg-white ${
                      index > 0 ? "left-3" : "left-0"
                    }`}
                  />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat List or Empty State - Swipeable */}
      <motion.div
        className="flex-1 flex flex-col"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleSwipe}
        key={activeTab}
        initial={{ opacity: 0.7, x: swipeDirection * 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {isLoading ? (
          <div className="flex-1 flex flex-col pt-2 pb-4">
            {/* Direct and Spam tab banner skeleton placeholder */}
            {(activeTab === "direct" || activeTab === "spam") && (
              <ConnectBotBanner onConnectBot={handleConnectBot} />
            )}

            <ChatListSkeleton count={5} />

            {/* Bottom padding for navigation */}
            <div className="h-32 shrink-0" />
          </div>
        ) : currentChatList.length === 0 ? (
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
            {/* Direct and Spam tab banner */}
            {(activeTab === "direct" || activeTab === "spam") && (
              <ConnectBotBanner onConnectBot={handleConnectBot} />
            )}

            {currentChatList.map((chat, index) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                onClick={() => handleChatClick(chat)}
                showDivider={index < currentChatList.length - 1}
              />
            ))}

            {/* Bottom padding for navigation */}
            <div className="h-32 shrink-0" />
          </div>
        )}
      </motion.div>

      {/* Connect Bot Modal */}
      <ConnectBotModal
        open={isConnectBotModalOpen}
        onOpenChange={setIsConnectBotModalOpen}
      />
    </main>
  );
}
