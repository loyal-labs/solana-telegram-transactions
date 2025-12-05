"use client";

import {
  backButton,
  hapticFeedback,
  swipeBehavior,
  themeParams,
  useSignal,
  viewport,
} from "@telegram-apps/sdk-react";
import type { Signal } from "@telegram-apps/signals";
import { ArrowUp } from "lucide-react";
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

// Mock data for demo - matches the chat list in summaries/page.tsx
const MOCK_SUMMARIES: ChatSummary[] = [
  {
    id: "1",
    title: "The Loyal Community",
    messageCount: 1247,
    topics: [
      {
        id: "1-1",
        title: "Blockchain Coordination",
        content:
          "Blockchain technology offers a way to coordinate many independent actors around a single, append-only record of events. It combines cryptography with distributed systems.",
        sources: ["Alice", "Bob", "Charlie"],
      },
      {
        id: "1-2",
        title: "Community Growth",
        content:
          "The community has grown significantly over the past month. New members are joining daily and contributing to discussions about decentralization. Several community events are planned for next month including a hackathon and developer meetup. Several community events are planned for next month including a hackathon and developer meetup.",
        sources: ["David", "Eve", "Frank"],
      },
      {
        id: "1-3",
        title: "Upcoming Events",
        content:
          "Several community events are planned for next month including a hackathon and developer meetup. Several community events are planned for next month including a hackathon and developer meetup. Several community events are planned for next month including a hackathon and developer meetup. Several community events are planned for next month including a hackathon and developer meetup.",
        sources: ["Grace", "Henry"],
      },
    ],
  },
  {
    id: "2",
    title: "X Live classic",
    messageCount: 892,
    topics: [
      {
        id: "2-1",
        title: "Live Performances",
        content:
          "Latest updates about upcoming live performances and discussions about classical music in the digital age.",
        sources: ["Grace", "Henry"],
      },
      {
        id: "2-2",
        title: "Artist Collaborations",
        content:
          "New collaborations between traditional musicians and digital artists are creating unique experiences for audiences worldwide.",
        sources: ["Ivan", "Julia"],
      },
    ],
  },
  {
    id: "3",
    title: "Gift Concepts",
    messageCount: 654,
    topics: [
      {
        id: "3-1",
        title: "Digital Collectibles",
        content:
          "Creative ideas for digital gifts and collectibles that combine traditional gift-giving with blockchain technology.",
        sources: ["Kevin", "Laura"],
      },
      {
        id: "3-2",
        title: "NFT Gift Ideas",
        content:
          "Community members shared innovative ways to use NFTs as meaningful gifts for special occasions.",
        sources: ["Mike", "Nancy"],
      },
    ],
  },
  {
    id: "4",
    title: "TON Community",
    messageCount: 4521,
    topics: [
      {
        id: "4-1",
        title: "Smart Contract Development",
        content:
          "New tooling for FunC development was released, including improved IDE support and better debugging capabilities.",
        sources: ["Kevin", "Laura"],
      },
      {
        id: "4-2",
        title: "Community Projects",
        content:
          "Community projects showcased innovative use cases for TON blockchain including decentralized social features.",
        sources: ["Mike", "Nancy"],
      },
    ],
  },
  {
    id: "5",
    title: "Solana Developers",
    messageCount: 3298,
    topics: [
      {
        id: "5-1",
        title: "Network Performance",
        content:
          "Recent network upgrades have improved transaction throughput significantly. The community reported faster confirmation times.",
        sources: ["Grace", "Henry"],
      },
      {
        id: "5-2",
        title: "Priority Fees",
        content:
          "Discussions around the new priority fee system and how developers should adjust their applications to optimize for both speed and cost.",
        sources: ["Ivan", "Julia"],
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
function TopicCard({ topic }: { topic: ChatSummary["topics"][0] }) {
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

// Animation phases for next chat transition
type TransitionPhase =
  | "idle" // Normal state, indicator visible at bottom
  | "swiping" // User actively swiping up on indicator
  | "avatar-hold" // Enlarged avatar visible, holding before slide
  | "content-slide" // Content sliding up to reveal next summary
  | "content-enter"; // New content sliding up into view

// Spring easing for bouncy feel
const SPRING_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// Next chat indicator component (arrow + avatar) - fixed at bottom
function NextChatIndicator({
  nextChat,
  swipeProgress,
  phase,
}: {
  nextChat: ChatSummary;
  swipeProgress: number; // 0-1, how far user has swiped
  phase: TransitionPhase;
}) {
  const avatarColor = getAvatarColor(nextChat.title);
  const firstLetter = getFirstLetter(nextChat.title);

  // Track bounce animation state: compress then release with spring
  const [bounceState, setBounceState] = useState<
    "idle" | "compress" | "release"
  >("idle");
  const prevPhaseRef = useRef(phase);

  // Trigger bouncy animation when entering avatar-hold
  useEffect(() => {
    if (phase === "avatar-hold" && prevPhaseRef.current !== "avatar-hold") {
      // Step 1: Quick compress (scale down, move up slightly)
      setBounceState("compress");
      // Step 2: Release with spring overshoot
      const timer = setTimeout(() => {
        setBounceState("release");
      }, 60);
      return () => clearTimeout(timer);
    }
    if (phase === "idle" || phase === "swiping") {
      setBounceState("idle");
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  // During avatar-hold, keep progress at 1
  const effectiveProgress = phase === "avatar-hold" ? 1 : swipeProgress;

  // Use eased progress for smoother feel (ease-out curve)
  const easedProgress = 1 - Math.pow(1 - effectiveProgress, 2);

  // Arrow shrinks and disappears as user swipes (gone by 60% progress)
  const arrowProgress = Math.min(1, effectiveProgress / 0.6);
  const arrowScale = Math.max(0, 1 - arrowProgress);
  const arrowOpacity = Math.max(0, 1 - arrowProgress * 1.5);

  // Arrow height collapses as progress increases
  const arrowHeight = 40 * (1 - arrowProgress);

  // Avatar grows from 40px to 60px (1.5x) as user swipes
  const avatarSize = 40 + easedProgress * 20;

  // Avatar bounce transform - creates spring bounce effect
  const getAvatarTransform = () => {
    if (bounceState === "compress") {
      // Compress: scale down slightly, move up
      return "translateY(-12px) scale(0.88)";
    }
    if (bounceState === "release") {
      // Release: spring back (CSS spring easing will overshoot past 1.0 then settle)
      return "translateY(0) scale(1)";
    }
    return "translateY(0) scale(1)";
  };

  // Avatar transition based on bounce state
  const getAvatarTransition = () => {
    if (bounceState === "compress") {
      return "transform 60ms ease-out"; // Quick compress
    }
    if (bounceState === "release") {
      return `transform 400ms ${SPRING_EASING}`; // Bouncy release with overshoot
    }
    return "none";
  };

  // Title pill fades in after arrow starts shrinking (starts at 30% progress)
  const titleProgress = Math.max(0, (effectiveProgress - 0.3) / 0.7);
  const titleOpacity = titleProgress;
  const titleScale = 0.8 + titleProgress * 0.2;

  // During content-slide, avatar flies up and fades out
  const isSliding = phase === "content-slide";
  const transitionTransform = isSliding
    ? "translateY(-200px) scale(0.7)"
    : "translateY(0) scale(1)";
  const transitionOpacity = isSliding ? 0 : 1;

  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{
        transform: transitionTransform,
        opacity: transitionOpacity,
        transition: isSliding ? `all 500ms ${SPRING_EASING}` : "none",
      }}
    >
      {/* Pill container with arrow + avatar */}
      <div
        className="flex flex-col items-center justify-center rounded-full overflow-hidden p-1"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.06)",
          mixBlendMode: "lighten",
        }}
      >
        {/* Arrow up icon - shrinks and disappears */}
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            transform: `scale(${arrowScale})`,
            opacity: arrowOpacity,
            height: arrowHeight,
            padding: arrowOpacity > 0.05 ? 6 : 0,
            transition: phase === "idle" ? `all 400ms ${SPRING_EASING}` : "none",
          }}
        >
          <ArrowUp className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>

        {/* Next chat avatar - grows and bounces with spring */}
        <div
          className="rounded-full flex items-center justify-center font-medium text-white"
          style={{
            backgroundColor: avatarColor,
            width: avatarSize,
            height: avatarSize,
            fontSize: avatarSize * 0.35,
            transform: getAvatarTransform(),
            transition: getAvatarTransition(),
          }}
        >
          {firstLetter}
        </div>
      </div>

      {/* Title pill - fades in with spring after arrow disappears */}
      <div
        className="backdrop-blur-xl rounded-full overflow-hidden px-3 py-1"
        style={{
          backgroundColor: "rgba(128, 128, 128, 0.1)",
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          transition: phase === "idle" ? `all 400ms ${SPRING_EASING}` : "none",
        }}
      >
        <p className="text-sm text-white leading-5 whitespace-nowrap">
          {nextChat.title}
        </p>
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
  const [scrollY, setScrollY] = useState(0);

  // Animation state machine
  const [transitionPhase, setTransitionPhase] =
    useState<TransitionPhase>("idle");
  const [swipeProgress, setSwipeProgress] = useState(0);

  // Ref to track phase synchronously during touch events (state updates are async)
  const transitionPhaseRef = useRef<TransitionPhase>("idle");

  // Touch tracking for overscroll detection
  const touchStartY = useRef<number | null>(null);
  const isAtBottom = useRef(false);
  const isAtTop = useRef(true);
  const overscrollAmount = useRef(0);
  const swipeStartY = useRef<number | null>(null);
  const swipeProgressRef = useRef(0);

  // Helper to set phase (updates both state and ref for sync access)
  const setPhase = useCallback((phase: TransitionPhase) => {
    transitionPhaseRef.current = phase;
    setTransitionPhase(phase);
  }, []);

  // Helper to set progress (updates both state and ref)
  const setProgress = useCallback((progress: number) => {
    swipeProgressRef.current = progress;
    setSwipeProgress(progress);
  }, []);

  // Get button color from Telegram theme
  const [buttonColor] = useState(() => {
    try {
      return themeParams.buttonColor() || "#2990ff";
    } catch {
      return "#2990ff";
    }
  });

  // Get safe area inset (only device safe area, not content safe area)
  // This positions content at the same level as native Telegram header buttons
  const safeAreaInsetTop = useSignal(
    viewport.safeAreaInsetTop as Signal<number>
  );

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

  // Start the next summary transition with full animation
  const startNextTransition = useCallback(() => {
    if (
      currentSummaryIndex >= MOCK_SUMMARIES.length - 1 ||
      transitionPhaseRef.current === "content-slide" ||
      transitionPhaseRef.current === "avatar-hold" ||
      transitionPhaseRef.current === "content-enter"
    )
      return;

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("medium");
    }

    // Phase 1: Hold the enlarged avatar for user to see (300ms)
    setPhase("avatar-hold");

    // Phase 2: After hold, start content slide - both current and next slide up together
    setTimeout(() => {
      setPhase("content-slide");
    }, 300);

    // Phase 3: After slide animation completes, switch to next summary and return to idle
    setTimeout(() => {
      setCurrentSummaryIndex((prev) => prev + 1);
      setScrollY(0);
      setProgress(0);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      isAtTop.current = true;
      isAtBottom.current = false;
      setPhase("idle");
    }, 800); // 300ms hold + 500ms slide
  }, [currentSummaryIndex, setPhase, setProgress]);

  // Go to previous summary (simpler animation)
  const goToPrevSummary = useCallback(() => {
    if (currentSummaryIndex <= 0 || transitionPhaseRef.current !== "idle")
      return;

    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred("medium");
    }

    setPhase("content-slide");

    setTimeout(() => {
      setCurrentSummaryIndex((prev) => prev - 1);
      // Scroll to bottom of previous summary
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }
      isAtTop.current = false;
      isAtBottom.current = true;
    }, 200);

    setTimeout(() => {
      setPhase("idle");
    }, 400);
  }, [currentSummaryIndex, setPhase]);

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
      swipeStartY.current = null;
      updateScrollPosition();
    },
    [updateScrollPosition]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null) return;

      const phase = transitionPhaseRef.current;

      // Don't process during content slide
      if (phase === "content-slide") {
        return;
      }

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY.current - touchY; // Positive = scrolling down

      updateScrollPosition();

      // If already swiping (swipeProgress > 0), continue tracking
      if (swipeProgressRef.current > 0 || phase === "swiping") {
        if (swipeStartY.current === null) {
          swipeStartY.current = touchY;
        }

        const swipeDelta = swipeStartY.current - touchY;
        const progress = Math.min(1, Math.max(0, swipeDelta / 150)); // 150px for full swipe
        setProgress(progress);

        if (progress > 0 && phase !== "swiping") {
          setPhase("swiping");
        }

        // Trigger transition when swipe completes
        if (progress >= 1) {
          startNextTransition();
        }
        return;
      }

      // User is at bottom and scrolling down - start tracking swipe
      if (isAtBottom.current && deltaY > 0 && nextSummary && phase === "idle") {
        swipeStartY.current = touchY;
        setPhase("swiping");
        if (hapticFeedback.impactOccurred.isAvailable()) {
          hapticFeedback.impactOccurred("light");
        }
        return;
      }

      // Scrolling up at top -> go to previous
      if (isAtTop.current && deltaY < 0 && prevSummary && phase === "idle") {
        overscrollAmount.current += Math.abs(deltaY);
        touchStartY.current = touchY;

        if (overscrollAmount.current > 100) {
          overscrollAmount.current = 0;
          goToPrevSummary();
        }
        return;
      }

      // Reset overscroll if not in a special state
      if (phase === "idle") {
        overscrollAmount.current = 0;
      }
    },
    [
      nextSummary,
      prevSummary,
      startNextTransition,
      goToPrevSummary,
      updateScrollPosition,
      setPhase,
      setProgress,
    ]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null;
    overscrollAmount.current = 0;

    const phase = transitionPhaseRef.current;
    const progress = swipeProgressRef.current;

    // If swiping but didn't complete, animate back or complete transition
    if (phase === "swiping") {
      if (progress >= 0.5) {
        // Complete the transition
        startNextTransition();
      } else {
        // Animate back to idle with spring
        setProgress(0);
        setPhase("idle");
      }
    }

    swipeStartY.current = null;
  }, [startNextTransition, setPhase, setProgress]);

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
      {/* Header - "X chats left" - aligned with native Telegram header buttons */}
      <div
        className="relative flex items-center justify-center shrink-0 z-20 py-3"
        style={{ paddingTop: `${Math.max(safeAreaInsetTop || 0, 12) + 10}px` }}
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
        {/* Hide during content-slide when FlyingAvatar is showing */}
        <div
          className="absolute top-2 left-0 right-0 z-10 flex justify-center"
          style={{
            opacity: transitionPhase === "content-slide" ? 0 : 1,
            // No transition - instant swap with FlyingAvatar to avoid flicker
          }}
        >
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
          className="flex-1 overflow-y-auto px-4 pt-16"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Content wrapper for slide animations */}
          <ContentSlider
            phase={transitionPhase}
            currentContent={
              <>
                <div className="flex flex-col gap-3 pt-4">
                  {currentSummary.topics.map((topic) => (
                    <TopicCard key={topic.id} topic={topic} />
                  ))}
                </div>

                {/* End message */}
                {!nextSummary && (
                  <div className="flex flex-col items-center justify-center pt-6 pb-2">
                    <p className="text-sm text-white/40">You&apos;ve caught up!</p>
                  </div>
                )}

                {/* Bottom padding for indicator and safe area */}
                <div className="h-40 shrink-0" />
              </>
            }
            nextContent={
              nextSummary ? (
                <>
                  <div className="flex flex-col gap-3 pt-4">
                    {nextSummary.topics.map((topic) => (
                      <TopicCard key={topic.id} topic={topic} />
                    ))}
                  </div>

                  {/* Bottom padding for indicator and safe area */}
                  <div className="h-40 shrink-0" />
                </>
              ) : null
            }
          />
        </div>

        {/* Fixed Next Chat Indicator at bottom */}
        {nextSummary && (
          <div
            className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pointer-events-none"
            style={{
              paddingBottom: 24,
            }}
          >
            <NextChatIndicator
              nextChat={nextSummary}
              swipeProgress={swipeProgress}
              phase={transitionPhase}
            />
          </div>
        )}

        {/* Flying avatar during transition - slides in with new content in parallel */}
        {transitionPhase === "content-slide" && nextSummary && (
          <FlyingAvatar chat={nextSummary} />
        )}
      </div>
    </main>
  );
}

// Smooth ease-out for content sliding (no bounce)
const EASE_OUT = "cubic-bezier(0.0, 0.0, 0.2, 1)";

// Content slider component that handles slide up/down animations
// Both contents slide up in parallel - current exits top, next enters from bottom
function ContentSlider({
  phase,
  currentContent,
  nextContent,
}: {
  phase: TransitionPhase;
  currentContent: React.ReactNode;
  nextContent: React.ReactNode | null;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevPhaseRef = useRef(phase);

  // Trigger animation when entering content-slide phase
  useEffect(() => {
    if (phase === "content-slide" && prevPhaseRef.current !== "content-slide") {
      setIsAnimating(false);
      // Double rAF to ensure initial position is painted
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    }
    if (phase === "idle") {
      setIsAnimating(false);
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  const isSliding = phase === "content-slide";

  return (
    <div className="relative">
      {/* Current content - slides up and out during transition */}
      <div
        style={{
          transform: isSliding && isAnimating ? "translateY(-100vh)" : "translateY(0)",
          transition: isSliding && isAnimating ? `transform 500ms ${EASE_OUT}` : "none",
        }}
      >
        {currentContent}
      </div>

      {/* Next content - positioned absolutely, slides up from 100vh to 0 */}
      {isSliding && nextContent && (
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            transform: isAnimating ? "translateY(0)" : "translateY(100vh)",
            transition: isAnimating ? `transform 500ms ${EASE_OUT}` : "none",
          }}
        >
          {nextContent}
        </div>
      )}
    </div>
  );
}

// Flying avatar component that animates from bottom to top in sync with content
function FlyingAvatar({ chat }: { chat: ChatSummary }) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Double requestAnimationFrame ensures the initial state is painted first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    });
  }, []);

  const avatarColor = getAvatarColor(chat.title);
  const firstLetter = getFirstLetter(chat.title);

  return (
    <div
      className="absolute inset-0 z-30 flex items-start justify-center pointer-events-none"
      style={{ paddingTop: 8 }}
    >
      <div
        className="flex items-center backdrop-blur-xl rounded-full overflow-hidden"
        style={{
          backgroundColor: "rgba(128, 128, 128, 0.1)",
          paddingLeft: 6,
          paddingRight: 24,
          paddingTop: 6,
          paddingBottom: 6,
          // Start from below (100vh matches content position) and slide up
          transform: isAnimating
            ? "translateY(0) scale(1)"
            : "translateY(calc(100vh - 8px)) scale(0.9)",
          opacity: isAnimating ? 1 : 0,
          // 500ms matches content slide animation, smooth ease-out (no bounce)
          transition: isAnimating ? `all 500ms ${EASE_OUT}` : "none",
        }}
      >
        {/* Avatar */}
        <div
          className="rounded-full flex items-center justify-center font-medium text-white shrink-0"
          style={{
            backgroundColor: avatarColor,
            width: 40,
            height: 40,
            fontSize: 16,
            marginRight: 12,
          }}
        >
          {firstLetter}
        </div>
        {/* Text */}
        <div className="flex flex-col justify-center">
          <p className="font-normal text-white leading-5 text-base whitespace-nowrap">
            {chat.title}
          </p>
          <p className="text-[13px] text-white/60 leading-4 whitespace-nowrap">
            Summary of {chat.messageCount?.toLocaleString()} messages
          </p>
        </div>
      </div>
    </div>
  );
}
