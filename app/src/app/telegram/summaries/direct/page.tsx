"use client";

import {
  backButton,
  hapticFeedback,
  openTelegramLink,
  swipeBehavior,
  themeParams,
  useSignal,
  viewport,
} from "@telegram-apps/sdk-react";
import type { Signal } from "@telegram-apps/signals";
import { CheckCheck, MessageCircleWarning, Undo2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  hideMainButton,
  showMainButton,
} from "@/lib/telegram/mini-app/buttons";

// Message with timestamp
type Message = {
  text: string;
  date: string; // e.g., "December 10"
  time: string; // e.g., "18:20"
};

// Chat data type - messages from a single person
type DirectChat = {
  id: string;
  title: string;
  username: string;
  messages: Message[];
};

// Mock data for direct chats - messages from each person
const MOCK_DIRECT_SUMMARIES: DirectChat[] = [
  {
    id: "d1",
    title: "Alice Johnson",
    username: "candyflipline",
    messages: [
      { text: "I'll paste some text below — analyze it and suggest how to improve it for the reader", date: "December 10", time: "18:20" },
      { text: "Once your selection is received, we will send you the Renewal Lease Document to be signed by all Parties.", date: "December 10", time: "18:20" },
      { text: "Your current lease is coming to an end, and I just sent you a renewal offer. Please check the Resident Portal for the notice and select the desired term.", date: "December 10", time: "18:20" },
      { text: "The project timeline has been updated. Can you review the new milestones?", date: "December 11", time: "09:15" },
      { text: "Once your selection is received, we will send you the Renewal Lease Document to be signed by all Parties.", date: "December 11", time: "09:30" },
    ],
  },
  {
    id: "d2",
    title: "Bob Smith",
    username: "vlad_arbatov",
    messages: [
      { text: "Thanks for helping with that bug yesterday! The fix is working perfectly in production now.", date: "December 9", time: "14:45" },
    ],
  },
  {
    id: "d3",
    title: "Charlie Davis",
    username: "candyflipline",
    messages: [
      { text: "Can we schedule a call for tomorrow?", date: "December 8", time: "10:00" },
      { text: "I need to discuss the upcoming release timeline with you.", date: "December 8", time: "10:02" },
      { text: "Also, could you review the API documentation before we publish it?", date: "December 9", time: "16:30" },
    ],
  },
  {
    id: "d4",
    title: "Diana Wilson",
    username: "vlad_arbatov",
    messages: [
      { text: "The design looks great! Just a few small tweaks needed for mobile.", date: "December 7", time: "11:20" },
      { text: "I've added the new components to the shared design system.", date: "December 7", time: "11:25" },
      { text: "This will help maintain consistency across all our products.", date: "December 8", time: "09:00" },
      { text: "Let me know if you have any questions about the implementation.", date: "December 8", time: "09:05" },
    ],
  },
];

// Mock data for spam chats
const MOCK_SPAM_SUMMARIES: DirectChat[] = [
  {
    id: "s1",
    title: "Crypto Giveaway Bot",
    username: "cryptogiveaway",
    messages: [
      { text: "Congratulations! You've won 10 ETH!", date: "December 9", time: "03:21" },
      { text: "Click here to claim your prize now!", date: "December 9", time: "03:21" },
      { text: "Limited time offer - act fast!", date: "December 10", time: "03:22" },
      { text: "Send 0.1 ETH to verify your wallet and receive 10 ETH instantly!", date: "December 10", time: "03:22" },
    ],
  },
  {
    id: "s2",
    title: "Investment Guru",
    username: "investguru2024",
    messages: [
      { text: "Make $10,000 daily with this secret trading strategy!", date: "December 8", time: "12:00" },
      { text: "I've helped thousands of people achieve financial freedom.", date: "December 8", time: "12:01" },
      { text: "Join my exclusive VIP group for only $999!", date: "December 9", time: "08:30" },
      { text: "DM me now for a free consultation.", date: "December 9", time: "08:31" },
    ],
  },
  {
    id: "s3",
    title: "Lucky Winner",
    username: "nftairdrop_official",
    messages: [
      { text: "You have been selected for an exclusive NFT airdrop!", date: "December 7", time: "15:45" },
      { text: "Your wallet has been chosen from millions of users.", date: "December 7", time: "15:45" },
      { text: "Connect your wallet to claim your free NFTs worth $50,000!", date: "December 7", time: "15:46" },
    ],
  },
];

// Get summaries based on tab type
function getSummariesForTab(tab: string | null): DirectChat[] {
  if (tab === "spam") {
    return MOCK_SPAM_SUMMARIES;
  }
  return MOCK_DIRECT_SUMMARIES;
}

// Generate a consistent color based on name
function getAvatarColor(name: string): string {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Get first letter of name
function getFirstLetter(name: string): string {
  const cleaned = name
    .replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ""
    )
    .trim();
  return cleaned.charAt(0).toUpperCase() || name.charAt(0).toUpperCase();
}

// Group messages by date
function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  for (const message of messages) {
    if (message.date !== currentDate) {
      currentDate = message.date;
      groups.push({ date: currentDate, messages: [message] });
    } else {
      groups[groups.length - 1].messages.push(message);
    }
  }

  return groups;
}

// Date separator component
function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-3 w-full">
      <div
        className="px-2 py-0.5 rounded-full"
        style={{ background: "rgba(255, 255, 255, 0.06)" }}
      >
        <p className="text-sm text-white leading-5 text-center">{date}</p>
      </div>
    </div>
  );
}

// Message bubble component
function MessageBubble({ message, time, isLast }: { message: string; time: string; isLast: boolean }) {
  return (
    <div
      className="w-full relative"
      style={{
        background: "rgba(255, 255, 255, 0.12)",
        borderRadius: isLast ? "16px 16px 16px 4px" : "16px",
      }}
    >
      <div className="px-3 py-1.5">
        <p className="text-base text-white leading-6">
          {message}
          {/* Invisible spacer to reserve space for timestamp at end of text */}
          <span className="inline-block w-[50px] h-[1px] align-bottom" />
        </p>
      </div>
      {/* Timestamp absolutely positioned at bottom-right, close to edge */}
      <span className="absolute bottom-0.5 right-3 text-xs text-white/40 leading-5">
        {time}
      </span>
    </div>
  );
}

// Swipe threshold to trigger action (in pixels)
const SWIPE_THRESHOLD = 100;
// Max rotation angle in degrees
const MAX_ROTATION = 8;
// Back card rotation
const BACK_CARD_ROTATION = -2;
// Smooth ease-out for animations
const EASE_OUT = "cubic-bezier(0.0, 0.0, 0.2, 1)";

function DirectFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get("chatId");
  const tab = searchParams.get("tab");

  // Get the correct summaries array based on tab
  const summaries = getSummariesForTab(tab);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Find initial index based on chatId
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialChatId) {
      const index = summaries.findIndex(
        (s) => s.id === initialChatId
      );
      return index !== -1 ? index : 0;
    }
    return 0;
  });

  // Swipe state
  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isBackCardTransitioning, setIsBackCardTransitioning] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  // Track card index for animation key
  const [cardKey, setCardKey] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [activeSwipeDirection, setActiveSwipeDirection] = useState<
    "left" | "right" | null
  >(null);

  // Page entrance animation
  const [isPageMounted, setIsPageMounted] = useState(false);

  // Get button color from Telegram theme
  const [buttonColor] = useState(() => {
    try {
      return themeParams.buttonColor() || "#2990ff";
    } catch {
      return "#2990ff";
    }
  });

  // Get safe area inset
  const safeAreaInsetTop = useSignal(
    viewport.safeAreaInsetTop as Signal<number>
  );

  const currentChat = summaries[currentIndex];
  const nextChat = summaries[currentIndex + 1];
  const remainingCount = summaries.length - currentIndex;

  // Reset scroll position when chat changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentIndex]);

  // Trigger entrance animation after mount
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsPageMounted(true);
      });
    });
  }, []);

  // Setup Telegram back button and disable vertical swipe
  useEffect(() => {
    // Disable vertical swipe to close the app
    if (swipeBehavior.disableVertical.isAvailable()) {
      swipeBehavior.disableVertical();
    }

    // Mount and show back button
    try {
      backButton.mount();
    } catch {
      // Mount may not be available in all contexts
    }
    if (backButton.show.isAvailable()) {
      backButton.show();
    }

    const handleBack = () => {
      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("light");
      }
      router.push("/telegram/summaries");
    };

    if (backButton.onClick.isAvailable()) {
      backButton.onClick(handleBack);
    }

    return () => {
      // Re-enable vertical swipe when leaving
      if (swipeBehavior.enableVertical.isAvailable()) {
        swipeBehavior.enableVertical();
      }
      // Hide and unmount back button
      if (backButton.hide.isAvailable()) {
        backButton.hide();
      }
      if (backButton.offClick.isAvailable()) {
        backButton.offClick(handleBack);
      }
      try {
        backButton.unmount();
      } catch {
        // Unmount may not be available in all contexts
      }
    };
  }, [router]);

  // Handler to open Telegram chat
  const handleOpenTelegram = useCallback(() => {
    if (!currentChat) return;
    const telegramUrl = `https://t.me/${currentChat.username}`;
    if (openTelegramLink.isAvailable()) {
      openTelegramLink(telegramUrl);
    }
  }, [currentChat]);

  // Show native Reply button
  useEffect(() => {
    if (!currentChat) return;

    showMainButton({
      text: "Reply",
      onClick: handleOpenTelegram,
      backgroundColor: buttonColor,
    });

    return () => {
      hideMainButton();
    };
  }, [currentChat, handleOpenTelegram, buttonColor]);

  // Calculate rotation based on swipe distance
  const rotation = useMemo(() => {
    const normalizedX = Math.min(Math.abs(swipeX) / 200, 1);
    const angle = normalizedX * MAX_ROTATION;
    return swipeX > 0 ? angle : -angle;
  }, [swipeX]);

  // Calculate overlay opacity based on swipe distance
  const overlayOpacity = useMemo(() => {
    return Math.min(Math.abs(swipeX) / SWIPE_THRESHOLD, 1);
  }, [swipeX]);

  // Swipe direction
  const swipeDirection = swipeX > 0 ? "right" : swipeX < 0 ? "left" : null;

  const handleUndo = useCallback(() => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("light");
    }
    // TODO: Implement undo - go back to previous chat
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || isAnimatingOut) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Determine swipe direction on first significant movement
      if (isHorizontalSwipeRef.current === null) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }

      // Only handle horizontal swipes
      if (isHorizontalSwipeRef.current) {
        e.preventDefault();
        setSwipeX(deltaX);

        // Haptic feedback at threshold
        if (
          Math.abs(deltaX) >= SWIPE_THRESHOLD &&
          Math.abs(swipeX) < SWIPE_THRESHOLD
        ) {
          if (hapticFeedback.impactOccurred.isAvailable()) {
            hapticFeedback.impactOccurred("medium");
          }
        }
      }
    },
    [isAnimatingOut, swipeX]
  );

  // Complete swipe action
  const completeSwipe = useCallback(
    (direction: "left" | "right") => {
      setActiveSwipeDirection(direction);
      setIsAnimatingOut(true);

      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("heavy");
      }

      // Animate card off screen
      const targetX = direction === "right" ? 500 : -500;
      setSwipeX(targetX);

      // After front card flies off, start back card transition
      setTimeout(() => {
        setIsBackCardTransitioning(true);

        setTimeout(() => {
          setIsResetting(true);

          requestAnimationFrame(() => {
            setCardKey((k) => k + 1);
            setSwipeX(0);
            setIsAnimatingOut(false);
            setIsBackCardTransitioning(false);
            setIsDragging(false);
            setActiveSwipeDirection(null);

            // Move to next chat or navigate back if done
            const isLastChat = currentIndex >= summaries.length - 1;
            if (isLastChat) {
              router.push("/telegram/summaries");
            } else {
              setCurrentIndex((prev) => prev + 1);
            }

            requestAnimationFrame(() => {
              setIsResetting(false);
            });
          });
        }, 300);
      }, 300);
    },
    [currentIndex, router, summaries.length]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || isAnimatingOut) return;

    const shouldTriggerAction = Math.abs(swipeX) >= SWIPE_THRESHOLD;

    if (shouldTriggerAction) {
      const direction = swipeX > 0 ? "right" : "left";
      completeSwipe(direction);
    } else {
      // Snap back
      setSwipeX(0);
      setIsDragging(false);
    }

    touchStartRef.current = null;
    isHorizontalSwipeRef.current = null;
  }, [isDragging, isAnimatingOut, swipeX, completeSwipe]);

  if (!currentChat) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#16161a" }}
      >
        <p className="text-white/60">No chats available</p>
      </div>
    );
  }

  const chatFirstLetter = getFirstLetter(currentChat.title);
  const chatAvatarColor = getAvatarColor(currentChat.title);

  return (
    <main
      className="h-screen text-white font-sans overflow-hidden relative flex flex-col"
      style={{ background: "#16161a" }}
    >
      {/* Header */}
      <div
        className="relative flex items-center justify-center shrink-0 z-20 py-3"
        style={{
          paddingTop: `${Math.max(safeAreaInsetTop || 0, 12) + 10}px`,
          opacity: isPageMounted ? 1 : 0,
          transform: isPageMounted ? "translateY(0)" : "translateY(-10px)",
          transition: isPageMounted ? `all 400ms ${EASE_OUT}` : "none",
        }}
      >
        {/* Center - Remaining count */}
        <div className="flex items-center gap-1.5">
          <div
            className="h-6 min-w-6 px-1.5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: buttonColor }}
          >
            <span className="text-sm font-medium text-white">
              {remainingCount}
            </span>
          </div>
          <span className="text-base text-white">Left</span>
        </div>
      </div>

      {/* Card Container */}
      <div
        className="flex-1 flex flex-col mx-4 my-4 min-h-0 overflow-visible relative"
        style={{
          opacity: isPageMounted ? 1 : 0,
          transform: isPageMounted ? "translateY(0)" : "translateY(30px)",
          transition: isPageMounted ? `all 500ms ${EASE_OUT} 100ms` : "none",
        }}
      >
        {/* Back Card */}
        {nextChat && (
          <div
            className="absolute inset-0 flex flex-col rounded-[24px] overflow-hidden pointer-events-none"
            style={{
              background: "#28282c",
              transform: isBackCardTransitioning
                ? "rotate(0deg) translateX(0px)"
                : (() => {
                    const dir =
                      activeSwipeDirection ||
                      (swipeX > 0 ? "right" : swipeX < 0 ? "left" : null);
                    if (dir === "right") {
                      return `rotate(${BACK_CARD_ROTATION}deg) translateX(-8px)`;
                    } else if (dir === "left") {
                      return `rotate(${-BACK_CARD_ROTATION}deg) translateX(8px)`;
                    }
                    return `rotate(${BACK_CARD_ROTATION}deg) translateX(-8px)`;
                  })(),
              transformOrigin: "center bottom",
              opacity: isResetting
                ? 0
                : isBackCardTransitioning
                ? 1
                : swipeX !== 0 || isAnimatingOut
                ? 0.5
                : 0,
              transition: isResetting
                ? "none"
                : "transform 0.3s ease-out, opacity 0.3s ease-out",
              zIndex: 0,
            }}
          >
            {/* Back card header */}
            <div
              className="flex items-center px-3 shrink-0"
              style={{ borderBottom: "0.33px solid rgba(255, 255, 255, 0.1)" }}
            >
              {/* Avatar */}
              <div className="pr-3 py-1.5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-base font-medium text-white"
                  style={{ backgroundColor: getAvatarColor(nextChat.title) }}
                >
                  {getFirstLetter(nextChat.title)}
                </div>
              </div>
              {/* Name and Username */}
              <div className="flex-1 flex flex-col gap-0.5 py-2.5">
                <p className="text-base text-white leading-5">
                  {nextChat.title}
                </p>
                <p className="text-[13px] text-white/60 leading-4">
                  @{nextChat.username}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Front Card with swipe functionality */}
        <div
          key={cardKey}
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 flex flex-col rounded-[24px] overflow-hidden min-h-0 relative"
          style={{
            background: "#28282c",
            transform: `translateX(${swipeX}px) rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
            transformOrigin: "center bottom",
            zIndex: 1,
            opacity: isBackCardTransitioning ? 0 : 1,
          }}
        >
          {/* Chat Header - Fixed */}
          <div
            className="flex items-center px-3 shrink-0"
            style={{ borderBottom: "0.33px solid rgba(255, 255, 255, 0.1)" }}
          >
            {/* Avatar */}
            <div className="pr-3 py-1.5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-base font-medium text-white"
                style={{ backgroundColor: chatAvatarColor }}
              >
                {chatFirstLetter}
              </div>
            </div>
            {/* Name and Username - clickable to open Telegram */}
            <button
              onClick={handleOpenTelegram}
              className="flex-1 flex flex-col gap-0.5 py-2.5 text-left active:opacity-70 transition-opacity"
            >
              <p className="text-base text-white leading-5">
                {currentChat.title}
              </p>
              <p className="text-[13px] text-white/60 leading-4">
                @{currentChat.username}
              </p>
            </button>
            {/* Undo button */}
            <button
              onClick={handleUndo}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-full active:scale-95 transition-transform disabled:opacity-30"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
              }}
            >
              <Undo2 size={24} strokeWidth={1.5} className="text-white" />
            </button>
          </div>

          {/* Messages Content - Scrollable with fixed fade gradient */}
          <div className="flex-1 min-h-0 relative">
            <div
              ref={scrollContainerRef}
              className="absolute inset-0 overflow-y-auto overscroll-contain"
              style={{ touchAction: "pan-y" }}
            >
              <div className="flex flex-col pl-3 pr-6 pb-6">
                {groupMessagesByDate(currentChat.messages).map((group, groupIndex) => (
                  <div key={groupIndex} className="flex flex-col">
                    <DateSeparator date={group.date} />
                    <div className="flex flex-col gap-2">
                      {group.messages.map((message, msgIndex) => (
                        <MessageBubble
                          key={msgIndex}
                          message={message.text}
                          time={message.time}
                          isLast={msgIndex === group.messages.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Fade gradient at bottom - fixed position relative to container */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[76px] pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(40, 40, 44, 0), #28282c)",
              }}
            />
          </div>

          {/* Swipe Overlay */}
          {swipeDirection && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-[24px]"
              style={{
                background:
                  swipeDirection === "right"
                    ? `linear-gradient(to bottom, rgba(41, 144, 255, ${
                        overlayOpacity * 0.2
                      }), rgba(41, 144, 255, ${overlayOpacity}))`
                    : `linear-gradient(to bottom, rgba(40, 40, 44, ${
                        overlayOpacity * 0.2
                      }), rgba(40, 40, 44, ${overlayOpacity}))`,
                opacity: overlayOpacity,
                transition: isDragging ? "none" : "opacity 0.3s ease-out",
              }}
            >
              <div
                style={{
                  opacity: overlayOpacity,
                  transform: `scale(${0.5 + overlayOpacity * 0.5})`,
                  transition: isDragging ? "none" : "all 0.3s ease-out",
                }}
              >
                {swipeDirection === "right" ? (
                  <CheckCheck
                    size={96}
                    strokeWidth={1.5}
                    className="text-white"
                  />
                ) : (
                  <MessageCircleWarning
                    size={96}
                    strokeWidth={1.5}
                    className="text-white"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function DirectFeedPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-screen flex items-center justify-center"
          style={{ background: "#16161a" }}
        >
          <p className="text-white/60">Loading...</p>
        </div>
      }
    >
      <DirectFeedContent />
    </Suspense>
  );
}
