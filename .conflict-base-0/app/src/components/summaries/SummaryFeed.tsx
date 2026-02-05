"use client";

import {
  backButton,
  hapticFeedback,
  swipeBehavior,
  useSignal,
  viewport,
} from "@telegram-apps/sdk-react";
import type { Signal } from "@telegram-apps/signals";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getAvatarColor, getFirstLetter } from "./avatar-utils";
import DatePicker from "./DatePicker";

export type ChatSummary = {
  id: string;
  title: string;
  messageCount?: number;
  createdAt?: string;
  photoBase64?: string;
  photoMimeType?: string;
  topics: Array<{
    id: string;
    title: string;
    content: string;
    sources: string[];
  }>;
};

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

// Smooth ease-out for animations
const EASE_OUT = "cubic-bezier(0.0, 0.0, 0.2, 1)";

// Convert ISO date string to YYYY-MM-DD format
function toDateKey(isoString: string): string {
  return isoString.split("T")[0];
}

// Group summaries by date
function groupSummariesByDate(
  summaries: ChatSummary[]
): Map<string, ChatSummary[]> {
  const map = new Map<string, ChatSummary[]>();

  for (const summary of summaries) {
    if (!summary.createdAt) continue;
    const dateKey = toDateKey(summary.createdAt);
    const existing = map.get(dateKey) || [];
    existing.push(summary);
    map.set(dateKey, existing);
  }

  return map;
}

// Get available dates from summaries (sorted newest first)
function getAvailableDates(summaries: ChatSummary[]): string[] {
  const dateSet = new Set<string>();

  for (const summary of summaries) {
    if (summary.createdAt) {
      dateSet.add(toDateKey(summary.createdAt));
    }
  }

  return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
}

// Get total message count for a date
function getMessageCountForDate(
  summariesByDate: Map<string, ChatSummary[]>,
  date: string
): number {
  const summaries = summariesByDate.get(date) || [];
  return summaries.reduce((sum, s) => sum + (s.messageCount || 0), 0);
}

// Get all topics for a date
function getTopicsForDate(
  summariesByDate: Map<string, ChatSummary[]>,
  date: string
): ChatSummary["topics"] {
  const summaries = summariesByDate.get(date) || [];
  return summaries.flatMap((s) => s.topics);
}

export type SummaryFeedProps = {
  /** Initial chat/summary ID to display */
  initialChatId?: string;
  /** All summaries for the group (pre-fetched) */
  summaries?: ChatSummary[];
  /** Group title (optional, derived from summaries if not provided) */
  groupTitle?: string;
};

export default function SummaryFeed({
  initialChatId,
  summaries: initialSummaries,
  groupTitle: initialGroupTitle,
}: SummaryFeedProps) {
  const router = useRouter();
  const safeAreaInsetTop = useSignal(
    viewport.safeAreaInsetTop as Signal<number>
  );
  // Calculate header height to determine available space
  const headerHeight = Math.max(safeAreaInsetTop || 0, 12) + 10 + 27 + 16;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [summaries, setSummaries] = useState<ChatSummary[]>(
    initialSummaries || []
  );
  const [isLoading, setIsLoading] = useState(!initialSummaries);
  const [error, setError] = useState<string | null>(null);

  // Fetch summaries from API if not provided
  useEffect(() => {
    if (initialSummaries) return;

    const fetchSummaries = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/summaries");
        if (!response.ok) {
          throw new Error("Failed to fetch summaries");
        }
        const data = await response.json();
        setSummaries(data.summaries || []);
      } catch (err) {
        console.error("Failed to fetch summaries:", err);
        setError("Failed to load summaries");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaries();
  }, [initialSummaries]);

  // Get group title from summaries
  const groupTitle = useMemo(() => {
    if (initialGroupTitle) return initialGroupTitle;
    if (summaries.length > 0) return summaries[0].title;
    return "Chat Summary";
  }, [initialGroupTitle, summaries]);

  // Get group photo from summaries (all summaries share the same community photo)
  const groupPhoto = useMemo(() => {
    if (summaries.length === 0) return null;
    const first = summaries[0];
    if (first.photoBase64) {
      return {
        base64: first.photoBase64,
        mimeType: first.photoMimeType || "image/jpeg",
      };
    }
    return null;
  }, [summaries]);

  // Group summaries by date
  const summariesByDate = useMemo(
    () => groupSummariesByDate(summaries),
    [summaries]
  );

  // Get available dates
  const availableDates = useMemo(
    () => getAvailableDates(summaries),
    [summaries]
  );

  // Selected date state - default to most recent date with summaries
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return availableDates[0] || toDateKey(new Date().toISOString());
  });

  // Update selected date when available dates change
  useEffect(() => {
    if (availableDates.length > 0 && !availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Get data for selected date
  const messageCount = useMemo(
    () => getMessageCountForDate(summariesByDate, selectedDate),
    [summariesByDate, selectedDate]
  );

  const topics = useMemo(
    () => getTopicsForDate(summariesByDate, selectedDate),
    [summariesByDate, selectedDate]
  );

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

  // Slide animation state
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );
  const [isSliding, setIsSliding] = useState(false);
  const [oldTopics, setOldTopics] = useState<typeof topics>([]);
  const prevDateRef = useRef(selectedDate);

  // Swipe detection for content area
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);

  // Date picker collapse state based on scroll
  const [isDatePickerCollapsed, setIsDatePickerCollapsed] = useState(false);
  const lastScrollTopRef = useRef(0);
  const scrollThresholdRef = useRef(0); // Accumulate scroll delta before triggering

  // Navigate to adjacent date with data
  const navigateToAdjacentDate = useCallback(
    (direction: "prev" | "next") => {
      const currentIndex = availableDates.indexOf(selectedDate);
      if (currentIndex === -1) return;

      let targetDate: string | null = null;
      if (direction === "prev" && currentIndex < availableDates.length - 1) {
        // Older date (availableDates is sorted newest first)
        targetDate = availableDates[currentIndex + 1];
      } else if (direction === "next" && currentIndex > 0) {
        // Newer date
        targetDate = availableDates[currentIndex - 1];
      }

      if (targetDate) {
        if (hapticFeedback.impactOccurred.isAvailable()) {
          hapticFeedback.impactOccurred("light");
        }
        // Trigger date selection with proper direction
        const slideDir = direction === "next" ? "left" : "right";
        setOldTopics(topics);
        setSlideDirection(slideDir);
        setIsSliding(true);
        setSelectedDate(targetDate);
        prevDateRef.current = targetDate;

        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }

        setTimeout(() => {
          setIsSliding(false);
          setSlideDirection(null);
        }, 180);
      }
    },
    [availableDates, selectedDate, topics]
  );

  // Handle touch events for swipe detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isSwipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    // Determine if this is a horizontal swipe (not vertical scroll)
    if (!isSwipingRef.current && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      isSwipingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

      // Only trigger if it was a horizontal swipe
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          // Swipe left = go to newer date
          navigateToAdjacentDate("next");
        } else {
          // Swipe right = go to older date
          navigateToAdjacentDate("prev");
        }
      }

      touchStartRef.current = null;
      isSwipingRef.current = false;
    },
    [navigateToAdjacentDate]
  );

  // Handle content scroll to collapse/expand date picker
  const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;

    // Only enable collapse behavior if content is actually scrollable
    const isScrollable = target.scrollHeight > target.clientHeight + 50;
    if (!isScrollable) {
      // Reset collapsed state if content becomes non-scrollable
      if (isDatePickerCollapsed) {
        setIsDatePickerCollapsed(false);
      }
      return;
    }

    const delta = scrollTop - lastScrollTopRef.current;
    lastScrollTopRef.current = scrollTop;

    // Accumulate scroll delta
    scrollThresholdRef.current += delta;

    // Collapse when scrolling down past threshold
    if (scrollThresholdRef.current > 30 && !isDatePickerCollapsed) {
      setIsDatePickerCollapsed(true);
      scrollThresholdRef.current = 0;
    }
    // Expand when scrolling up past threshold or at top
    else if ((scrollThresholdRef.current < -20 || scrollTop < 10) && isDatePickerCollapsed) {
      setIsDatePickerCollapsed(false);
      scrollThresholdRef.current = 0;
    }

    // Reset threshold when direction changes
    if ((delta > 0 && scrollThresholdRef.current < 0) || (delta < 0 && scrollThresholdRef.current > 0)) {
      scrollThresholdRef.current = delta;
    }
  }, [isDatePickerCollapsed]);

  // Handle date selection with slide animation
  const handleDateSelect = useCallback(
    (date: string) => {
      if (date === selectedDate) return;

      // Save current topics before switching
      setOldTopics(topics);

      // Determine slide direction based on date comparison
      // Newer date (right in calendar) = content slides left
      // Older date (left in calendar) = content slides right
      const direction = date > prevDateRef.current ? "left" : "right";
      setSlideDirection(direction);
      setIsSliding(true);

      // Update selected date
      setSelectedDate(date);
      prevDateRef.current = date;

      // Reset scroll position
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }

      // End animation after transition (faster: 180ms instead of 300ms)
      setTimeout(() => {
        setIsSliding(false);
        setSlideDirection(null);
      }, 180);
    },
    [selectedDate, topics]
  );

  // Page entrance animation
  const [isPageMounted, setIsPageMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsPageMounted(true);
      });
    });
  }, []);

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#16161a" }}
      >
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: "#16161a" }}
      >
        <p className="text-white/60">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#16161a" }}
      >
        <p className="text-white/60">No summaries available</p>
      </div>
    );
  }

  const avatarColor = getAvatarColor(groupTitle);
  const firstLetter = getFirstLetter(groupTitle);

  return (
    <main
      className="text-white font-sans overflow-hidden relative flex flex-col"
      style={{
        background: "#16161a",
        height: `calc(100vh - ${headerHeight}px)`,
      }}
    >
      {/* Header Section - Fixed */}
      <div
        className="shrink-0 flex flex-col items-center gap-2 px-4 pb-2"
      >
        {/* Group Pill */}
        <div
          className="flex items-center backdrop-blur-xl rounded-full overflow-hidden"
          style={{
            backgroundColor: "rgba(128, 128, 128, 0.1)",
            paddingLeft: 6,
            paddingRight: isDatePickerCollapsed ? 12 : 24,
            paddingTop: 6,
            paddingBottom: 6,
            opacity: isPageMounted ? 1 : 0,
            transform: isPageMounted ? "translateY(0)" : "translateY(-10px)",
            transition: `all 300ms ${EASE_OUT}`,
          }}
        >
          {/* Avatar */}
          {groupPhoto ? (
            <img
              src={`data:${groupPhoto.mimeType};base64,${groupPhoto.base64}`}
              alt={groupTitle}
              className="rounded-full object-cover shrink-0"
              style={{
                width: isDatePickerCollapsed ? 24 : 32,
                height: isDatePickerCollapsed ? 24 : 32,
                marginRight: isDatePickerCollapsed ? 8 : 12,
                transition: `all 300ms ${EASE_OUT}`,
              }}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center font-medium text-white shrink-0"
              style={{
                backgroundColor: avatarColor,
                width: isDatePickerCollapsed ? 24 : 32,
                height: isDatePickerCollapsed ? 24 : 32,
                fontSize: isDatePickerCollapsed ? 11 : 14,
                marginRight: isDatePickerCollapsed ? 8 : 12,
                transition: `all 300ms ${EASE_OUT}`,
              }}
            >
              {firstLetter}
            </div>
          )}

          {/* Text */}
          <div className="flex flex-col justify-center overflow-hidden">
            <p
              className="font-normal text-white whitespace-nowrap"
              style={{
                fontSize: isDatePickerCollapsed ? 14 : 16,
                lineHeight: isDatePickerCollapsed ? "20px" : "20px",
                transition: `all 300ms ${EASE_OUT}`,
              }}
            >
              {groupTitle}
            </p>
            <p
              className="text-[13px] text-white/60 whitespace-nowrap overflow-hidden"
              style={{
                lineHeight: "16px",
                maxHeight: isDatePickerCollapsed ? 0 : 16,
                opacity: isDatePickerCollapsed ? 0 : 1,
                transition: `all 300ms ${EASE_OUT}`,
              }}
            >
              {messageCount > 0
                ? `Summary of ${messageCount.toLocaleString()} messages`
                : "No messages"}
            </p>
          </div>
        </div>

        {/* Date Picker */}
        <div
          className="w-full"
          style={{
            opacity: isPageMounted ? 1 : 0,
            transform: isPageMounted ? "translateY(0)" : "translateY(10px)",
            transition: isPageMounted ? `all 400ms ${EASE_OUT} 100ms` : "none",
          }}
        >
          <DatePicker
            availableDates={availableDates}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            collapsed={isDatePickerCollapsed}
          />
        </div>
      </div>

      {/* Content Section - Scrollable with slide animation */}
      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Fade gradient at top */}
        <div
          className="absolute top-0 left-0 right-0 h-6 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, #16161a 0%, transparent 100%)",
          }}
        />

        {/* Sliding container wrapper */}
        <div className="h-full relative overflow-hidden">
          {/* Old content - slides out */}
          {isSliding && (
            <div
              className="absolute inset-0 overflow-y-auto px-4 pt-2 pb-8"
              style={{
                WebkitOverflowScrolling: "touch",
                animation:
                  slideDirection === "left"
                    ? "slideOutToLeft 180ms ease-out forwards"
                    : "slideOutToRight 180ms ease-out forwards",
              }}
            >
              {oldTopics.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {oldTopics.map((topic) => (
                    <TopicCard key={topic.id} topic={topic} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-white/40 text-sm">No topics for this date</p>
                </div>
              )}
              <div className="h-20 shrink-0" />
            </div>
          )}

          {/* New content - slides in */}
          <div
            ref={scrollContainerRef}
            onScroll={handleContentScroll}
            className="h-full overflow-y-auto px-4 pt-2 pb-8"
            style={{
              WebkitOverflowScrolling: "touch",
              opacity: isPageMounted ? 1 : 0,
              transform: isSliding
                ? "translateX(0)"
                : isPageMounted
                  ? "translateX(0)"
                  : "translateY(20px)",
              transition: isSliding
                ? `transform 180ms ${EASE_OUT}`
                : isPageMounted
                  ? `all 400ms ${EASE_OUT} 150ms`
                  : "none",
              // Start position for slide-in
              ...(isSliding && {
                animation:
                  slideDirection === "left"
                    ? "slideInFromRight 180ms ease-out forwards"
                    : "slideInFromLeft 180ms ease-out forwards",
              }),
            }}
          >
            {topics.length > 0 ? (
              <div className="flex flex-col gap-3">
                {topics.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-white/40 text-sm">No topics for this date</p>
              </div>
            )}

            {/* Bottom safe area padding */}
            <div className="h-20 shrink-0" />
          </div>
        </div>

        {/* CSS Keyframes for slide animations */}
        <style jsx>{`
          @keyframes slideInFromRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
          @keyframes slideInFromLeft {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }
          @keyframes slideOutToLeft {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-100%);
            }
          }
          @keyframes slideOutToRight {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    </main>
  );
}
