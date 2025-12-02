"use client";

import { backButton, hapticFeedback, swipeBehavior } from "@telegram-apps/sdk-react";
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
    paragraphs: Array<{
      id: string;
      text: string;
      sources: string[];
    }>;
  }>;
};

// Mock data for demo
const MOCK_SUMMARIES: ChatSummary[] = [
  {
    id: "1",
    title: "Telegram Developers Community",
    messageCount: 2986,
    topics: [
      {
        id: "1-1",
        title: "Topic",
        paragraphs: [
          {
            id: "1-1-1",
            text: "Blockchain technology offers a way to coordinate many independent actors around a single, append-only record of events. It combines cryptography.",
            sources: ["Alice", "Bob"],
          },
          {
            id: "1-1-2",
            text: "This structure makes the history tamper-evident: if someone tries to modify a past block, all following references stop matching. Within this general idea, there are many variations: public vs permissioned networks, simple value-transfer systems vs expressive smart contract. Blockchain technology offers a way to coordinate many independent actors around a single, append-only record of events. It combines cryptography. Blockchain technology offers a way to coordinate many independent actors around a single, append-only record of events. It combines cryptography.",
            sources: ["Charlie", "David"],
          },
          {
            id: "1-1-3",
            text: "Within this general idea, there are many variations: public vs permissioned networks, simple value-transfer systems vs expressive smart contract. Within this general idea, there are many variations: public vs permissioned networks, simple value-transfer systems vs expressive smart contract. Blockchain technology offers a way to coordinate many independent actors around a single, append-only record of events. It combines cryptography. Blockchain technology offers a way to coordinate many independent actors around a single, append-only record of events. It combines cryptography.",
            sources: ["Eve", "Frank"],
          },
        ],
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
        paragraphs: [
          {
            id: "2-1-1",
            text: "Recent network upgrades have improved transaction throughput significantly. The community reported faster confirmation times.",
            sources: ["Grace", "Henry"],
          },
          {
            id: "2-1-2",
            text: "Discussions around the new priority fee system and how developers should adjust their applications to optimize for both speed and cost.",
            sources: ["Ivan", "Julia"],
          },
        ],
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
        paragraphs: [
          {
            id: "3-1-1",
            text: "New tooling for FunC development was released, including improved IDE support and better debugging capabilities.",
            sources: ["Kevin", "Laura"],
          },
          {
            id: "3-1-2",
            text: "Community projects showcased innovative use cases for TON blockchain including decentralized social features.",
            sources: ["Mike", "Nancy"],
          },
        ],
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
    <div className="flex items-center h-10">
      <div className="flex items-center pl-1 pr-3">
        <div className="flex items-center">
          {sources.slice(0, 3).map((source, index) => (
            <div
              key={source}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white border border-[#28282c]"
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Touch tracking for overscroll detection
  const touchStartY = useRef<number | null>(null);
  const isAtBottom = useRef(false);
  const isAtTop = useRef(true);
  const overscrollAmount = useRef(0);

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

  return (
    <main
      className="min-h-screen text-white font-sans overflow-hidden relative flex flex-col"
      style={{ background: "#16161a" }}
    >
      {/* Header - Fixed */}
      <div
        className="relative h-[52px] flex items-center justify-center shrink-0 z-20"
        style={{ marginTop: "var(--app-safe-top, 20px)" }}
      >
        {/* Center - Remaining count */}
        <div className="flex items-center gap-1.5">
          <div className="bg-[#2990ff] h-6 min-w-6 px-1.5 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {remainingCount}
            </span>
          </div>
          <span className="text-base text-white">Left</span>
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex flex-col mx-4 mb-4 min-h-0 overflow-visible relative">
        {/* Back Card (next card preview) */}
        {nextSummary && (
          <div
            className="absolute inset-0 flex flex-col rounded-[20px] overflow-hidden pointer-events-none"
            style={{
              background: "#28282c",
              transform: "rotate(-2deg) translateX(-8px)",
              transformOrigin: "center bottom",
              opacity: 0.4,
              zIndex: 0,
            }}
          >
            {/* Back card header */}
            <div
              className="flex items-center gap-4 p-1 border-b shrink-0"
              style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <div className="w-10 h-10 rounded-full opacity-0" />
              <div className="flex-1 flex flex-col items-center justify-center h-11 gap-0.5">
                <p className="text-base font-medium text-white leading-5 tracking-[-0.176px] truncate max-w-full">
                  {nextSummary.title}
                </p>
                {nextSummary.messageCount && (
                  <p className="text-[13px] text-white/60 leading-5">
                    {nextSummary.messageCount.toLocaleString()} messages
                  </p>
                )}
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium text-white"
                style={{ backgroundColor: getAvatarColor(nextSummary.title) }}
              >
                {getFirstLetter(nextSummary.title)}
              </div>
            </div>
          </div>
        )}

        {/* Front Card */}
        <div
          className="flex-1 flex flex-col rounded-[20px] overflow-hidden min-h-0 relative"
          style={{
            background: "#28282c",
            zIndex: 1,
            opacity: isTransitioning ? 0.5 : 1,
            transition: "opacity 0.2s ease-out",
          }}
        >
          {/* Chat Header - Fixed at top of card */}
          <div
            className="flex items-center gap-4 p-1 border-b shrink-0"
            style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
          >
            {/* Left avatar (invisible for spacing) */}
            <div className="w-10 h-10 rounded-full opacity-0" />

            {/* Center - Chat info */}
            <div className="flex-1 flex flex-col items-center justify-center h-11 gap-0.5">
              <p className="text-base font-medium text-white leading-5 tracking-[-0.176px] truncate max-w-full">
                {currentSummary.title}
              </p>
              {currentSummary.messageCount && (
                <p className="text-[13px] text-white/60 leading-5">
                  {currentSummary.messageCount.toLocaleString()} messages
                </p>
              )}
            </div>

            {/* Right avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {firstLetter}
            </div>
          </div>

          {/* Summary Content - Scrollable */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex-1 overflow-y-auto px-5 pt-4 pb-6 min-h-0"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {currentSummary.topics.map((topic) => (
              <div key={topic.id} className="flex flex-col">
                {/* Topic Title */}
                <h2 className="text-2xl font-semibold text-white leading-8 pb-2">
                  {topic.title}
                </h2>

                {/* Paragraphs */}
                {topic.paragraphs.map((paragraph, index) => (
                  <div key={paragraph.id} className="flex flex-col">
                    <p
                      className={`text-base text-white leading-7 ${
                        index > 0 ? "pt-2" : ""
                      }`}
                    >
                      {paragraph.text}
                    </p>
                    {/* Sources */}
                    <SourceAvatars sources={paragraph.sources} />
                  </div>
                ))}
              </div>
            ))}

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
          </div>
        </div>
      </div>

      {/* Bottom padding for safe area */}
      <div className="h-32 shrink-0" />
    </main>
  );
}
