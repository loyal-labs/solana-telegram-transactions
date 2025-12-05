"use client";

import {
  backButton,
  hapticFeedback,
  swipeBehavior,
  themeParams,
} from "@telegram-apps/sdk-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Mock chat data - will be passed as props later
export type ChatSummary = {
  id: string;
  title: string;
  messageCount?: number;
  topics: Array<{
    id: string;
    title: string;
    content: string;
    sources: string[];
  }>;
};

// Mock data for demo
const MOCK_SUMMARIES: ChatSummary[] = [
  {
    id: "1",
    title: "Telegram Developers Community",
    messageCount: 973,
    topics: [
      {
        id: "1-1",
        title: "Topic 1",
        content:
          "Blockchain technology offers a way to coordinate many independent actors around a single, append-only record of events. It combines cryptography.",
        sources: ["Alice", "Bob", "Charlie"],
      },
      {
        id: "1-2",
        title: "Topic 2",
        content:
          "Blockchain technology offers a way to coordinate many independent actors around a single, append-only record of events. It combines cryptography.",
        sources: ["David", "Eve", "Frank"],
      },
      {
        id: "1-3",
        title: "Topic 3",
        content:
          "Blockchain technology offers a way to coordinate many independent actors around",
        sources: ["Grace", "Henry"],
      },
      {
        id: "1-4",
        title: "Topic 4",
        content:
          "Blockchain technology offers a way to coordinate many independent actors around a single, append-only record of events. It combines cryptography. A single, append-only record of events. It combines cryptography.",
        sources: ["Ivan", "Julia"],
      },
    ],
  },
  {
    id: "2",
    title: "Solana Developers",
    messageCount: 3298,
    topics: [
      {
        id: "2-1",
        title: "Network Performance",
        content:
          "Recent network upgrades have improved transaction throughput significantly. The community reported faster confirmation times.",
        sources: ["Grace", "Henry"],
      },
      {
        id: "2-2",
        title: "Priority Fees",
        content:
          "Discussions around the new priority fee system and how developers should adjust their applications to optimize for both speed and cost.",
        sources: ["Ivan", "Julia"],
      },
    ],
  },
  {
    id: "3",
    title: "TON Community",
    messageCount: 4521,
    topics: [
      {
        id: "3-1",
        title: "Smart Contract Development",
        content:
          "New tooling for FunC development was released, including improved IDE support and better debugging capabilities.",
        sources: ["Kevin", "Laura"],
      },
      {
        id: "3-2",
        title: "Community Projects",
        content:
          "Community projects showcased innovative use cases for TON blockchain including decentralized social features.",
        sources: ["Mike", "Nancy"],
      },
    ],
  },
];

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

// Source avatars component (overlapping circles)
function SourceAvatars({ sources }: { sources: string[] }) {
  return (
    <div className="flex items-center h-12">
      <div className="flex items-center">
        {sources.slice(0, 3).map((source, index) => (
          <div
            key={source}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white border-2 border-[#242427]"
            style={{
              backgroundColor: getAvatarColor(source),
              marginLeft: index > 0 ? -4 : 0,
              zIndex: sources.length - index,
            }}
          >
            {getFirstLetter(source)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Topic card component
function TopicCard({
  topic,
}: {
  topic: ChatSummary["topics"][0];
}) {
  return (
    <div className="bg-[#242427] rounded-2xl px-3 pt-4 pb-2 overflow-hidden">
      {/* Topic Title */}
      <h2 className="text-xl font-semibold text-white leading-7 pb-2">
        {topic.title}
      </h2>
      {/* Content */}
      <p className="text-base text-white leading-7">{topic.content}</p>
      {/* Source Avatars */}
      <SourceAvatars sources={topic.sources} />
    </div>
  );
}

export type SummaryFeedProps = {
  initialChatId?: string;
};

export default function SummaryFeed({ initialChatId }: SummaryFeedProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentSummaryIndex, setCurrentSummaryIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Touch tracking for overscroll detection
  const touchStartY = useRef<number | null>(null);
  const isAtBottom = useRef(false);
  const isAtTop = useRef(true);
  const overscrollAmount = useRef(0);

  // Get button color from Telegram theme
  const [buttonColor] = useState(() => {
    try {
      return themeParams.buttonColor() || "#2990ff";
    } catch {
      return "#2990ff";
    }
  });

  // Find initial summary index based on chatId
  useEffect(() => {
    if (initialChatId) {
      const index = MOCK_SUMMARIES.findIndex((s) => s.id === initialChatId);
      if (index !== -1) {
        setCurrentSummaryIndex(index);
      }
    }
  }, [initialChatId]);

  const currentSummary = MOCK_SUMMARIES[currentSummaryIndex];
  const nextSummary = MOCK_SUMMARIES[currentSummaryIndex + 1];
  const prevSummary = MOCK_SUMMARIES[currentSummaryIndex - 1];
  const remainingCount = MOCK_SUMMARIES.length - currentSummaryIndex;

  // Calculate collapse progress (0 = expanded, 1 = collapsed)
  const collapseProgress = Math.min(1, Math.max(0, scrollY / 60));

  // Setup Telegram back button and disable vertical swipe to close
  useEffect(() => {
    // Disable vertical swipe to close the app
    if (swipeBehavior.disableVertical.isAvailable()) {
      swipeBehavior.disableVertical();
    }

    // Show back button
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
      // Hide back button
      if (backButton.hide.isAvailable()) {
        backButton.hide();
      }
      if (backButton.offClick.isAvailable()) {
        backButton.offClick(handleBack);
      }
    };
  }, [router]);

  // Go to next summary
  const goToNextSummary = useCallback(() => {
    if (currentSummaryIndex >= MOCK_SUMMARIES.length - 1 || isTransitioning)
      return;

    setIsTransitioning(true);
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("medium");
    }

    setTimeout(() => {
      setCurrentSummaryIndex((prev) => prev + 1);
      setIsTransitioning(false);
      setScrollY(0);
      // Reset scroll to top
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      isAtTop.current = true;
      isAtBottom.current = false;
    }, 200);
  }, [currentSummaryIndex, isTransitioning]);

  // Go to previous summary
  const goToPrevSummary = useCallback(() => {
    if (currentSummaryIndex <= 0 || isTransitioning) return;

    setIsTransitioning(true);
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("medium");
    }

    setTimeout(() => {
      setCurrentSummaryIndex((prev) => prev - 1);
      setIsTransitioning(false);
      // Scroll to bottom of previous summary
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }
      isAtTop.current = false;
      isAtBottom.current = true;
    }, 200);
  }, [currentSummaryIndex, isTransitioning]);

  // Check scroll position
  const updateScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    isAtTop.current = scrollTop <= 0;
    isAtBottom.current = scrollTop + clientHeight >= scrollHeight - 1;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      overscrollAmount.current = 0;
      updateScrollPosition();
    },
    [updateScrollPosition]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null || isTransitioning) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY.current - touchY; // Positive = scrolling down

      updateScrollPosition();

      // Scrolling down at bottom -> go to next
      if (isAtBottom.current && deltaY > 0 && nextSummary) {
        overscrollAmount.current += deltaY;
        touchStartY.current = touchY;

        if (overscrollAmount.current > 100) {
          overscrollAmount.current = 0;
          goToNextSummary();
        }
      }
      // Scrolling up at top -> go to previous
      else if (isAtTop.current && deltaY < 0 && prevSummary) {
        overscrollAmount.current += Math.abs(deltaY);
        touchStartY.current = touchY;

        if (overscrollAmount.current > 100) {
          overscrollAmount.current = 0;
          goToPrevSummary();
        }
      } else {
        overscrollAmount.current = 0;
      }
    },
    [
      isTransitioning,
      nextSummary,
      prevSummary,
      goToNextSummary,
      goToPrevSummary,
      updateScrollPosition,
    ]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null;
    overscrollAmount.current = 0;
  }, []);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    updateScrollPosition();
    if (scrollContainerRef.current) {
      setScrollY(scrollContainerRef.current.scrollTop);
    }
  }, [updateScrollPosition]);

  if (!currentSummary) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#16161a" }}
      >
        <p className="text-white/60">No summaries available</p>
      </div>
    );
  }

  const avatarColor = getAvatarColor(currentSummary.title);
  const firstLetter = getFirstLetter(currentSummary.title);

  // Interpolate values based on collapse progress
  const avatarSize = 40 - 12 * collapseProgress; // 40px -> 28px
  const pillPaddingY = 6 - 2 * collapseProgress; // 6px -> 4px
  const pillPaddingRight = 24 - 12 * collapseProgress; // 24px -> 12px
  const titleSize = 16 - 2 * collapseProgress; // 16px -> 14px
  const subtitleOpacity = 1 - collapseProgress;
  const subtitleHeight = 16 * (1 - collapseProgress);

  return (
    <main
      className="h-screen text-white font-sans overflow-hidden relative flex flex-col"
      style={{ background: "#16161a" }}
    >
      {/* Header - "X chats left" */}
      <div
        className="relative h-[52px] flex items-center justify-center shrink-0 z-20"
        style={{ paddingTop: "var(--app-safe-top, 20px)" }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="h-6 min-w-6 px-1.5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: buttonColor }}
          >
            <span className="text-sm font-medium text-white">
              {remainingCount}
            </span>
          </div>
          <span className="text-base text-white">chats left</span>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Chat Title Pill - Floating above content */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center">
          <div
            className="flex items-center backdrop-blur-xl rounded-full overflow-hidden transition-all duration-150 ease-out"
            style={{
              backgroundColor: "rgba(128, 128, 128, 0.1)",
              paddingLeft: collapseProgress > 0.5 ? 4 : 6,
              paddingRight: pillPaddingRight,
              paddingTop: pillPaddingY,
              paddingBottom: pillPaddingY,
            }}
          >
            {/* Avatar */}
            <div
              className="rounded-full flex items-center justify-center font-medium text-white shrink-0 transition-all duration-150 ease-out"
              style={{
                backgroundColor: avatarColor,
                width: avatarSize,
                height: avatarSize,
                fontSize: avatarSize * 0.4,
                marginRight: 12 - 6 * collapseProgress,
              }}
            >
              {firstLetter}
            </div>

            {/* Text */}
            <div className="flex flex-col justify-center">
              <p
                className="font-normal text-white leading-5 transition-all duration-150 ease-out whitespace-nowrap"
                style={{ fontSize: titleSize }}
              >
                {currentSummary.title}
              </p>
              {/* Subtitle - animates out */}
              <div
                className="overflow-hidden transition-all duration-150 ease-out"
                style={{
                  height: subtitleHeight,
                  opacity: subtitleOpacity,
                }}
              >
                <p className="text-[13px] text-white/60 leading-4 whitespace-nowrap">
                  Summary of {currentSummary.messageCount?.toLocaleString()}{" "}
                  messages
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fade gradient at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[76px] z-[5] pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, #16161a 0%, #16161a 40%, transparent 100%)",
          }}
        />

        {/* Scrollable Topics List */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-y-auto px-4 pt-16 pb-8"
          style={{
            WebkitOverflowScrolling: "touch",
            opacity: isTransitioning ? 0.5 : 1,
            transition: "opacity 0.2s ease-out",
          }}
        >
          <div className="flex flex-col gap-3 pt-4">
            {currentSummary.topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>

          {/* Bottom indicator */}
          {nextSummary && (
            <div className="flex flex-col items-center justify-center pt-6 pb-2">
              <p className="text-sm text-white/40">
                {isTransitioning ? "Loading..." : "Pull up for next summary"}
              </p>
            </div>
          )}

          {/* End message */}
          {!nextSummary && (
            <div className="flex flex-col items-center justify-center pt-6 pb-2">
              <p className="text-sm text-white/40">You&apos;ve caught up!</p>
            </div>
          )}

          {/* Bottom padding for safe area */}
          <div className="h-24 shrink-0" />
        </div>
      </div>
    </main>
  );
}
