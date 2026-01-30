"use client";

import { hapticFeedback } from "@telegram-apps/sdk-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

export type DatePickerProps = {
  /** Dates that have summaries available (ISO date strings: YYYY-MM-DD) */
  availableDates: string[];
  /** Currently selected date (ISO date string: YYYY-MM-DD) */
  selectedDate: string;
  /** Callback when date is selected */
  onDateSelect: (date: string) => void;
  /** Whether the picker is collapsed (only shows date header) */
  collapsed?: boolean;
};

// Format date for display (e.g., "January 27")
function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// Get day number from date string
function getDayNumber(dateStr: string): number {
  return new Date(dateStr + "T12:00:00").getDate();
}

// Generate array of dates: past N days + future M days
function generateDateRange(pastDays: number, futureDays: number = 7): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // Past dates (from oldest to today)
  for (let i = pastDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }

  // Future dates (from tomorrow onwards)
  for (let i = 1; i <= futureDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

// Check if a date is in the future
function isFutureDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");
  return date > today;
}

export default function DatePicker({
  availableDates,
  selectedDate,
  onDateSelect,
  collapsed = false,
}: DatePickerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const availableDateSet = new Set(availableDates);

  // Find the latest date with data (not in future) - this is our scroll boundary
  const latestDateWithData = useMemo(() => {
    const validDates = availableDates.filter(d => !isFutureDate(d));
    if (validDates.length === 0) return new Date().toISOString().split("T")[0];
    return validDates.sort().pop()!;
  }, [availableDates]);

  // Generate all dates including future placeholders
  const dates = useMemo(() => generateDateRange(30, 7), []);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollLeftRef = useRef(0); // Track scroll direction
  const lastCenteredDateRef = useRef<string | null>(null); // Track centered date for haptics

  // Scroll to selected date on mount and when selection changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    const selectedElement = itemRefs.current.get(selectedDate);

    if (container && selectedElement) {
      const containerWidth = container.offsetWidth;
      const elementLeft = selectedElement.offsetLeft;
      const elementWidth = selectedElement.offsetWidth;
      const scrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [selectedDate]);

  // Handle date click - only allow dates with data, not future
  const handleDateClick = useCallback(
    (date: string) => {
      const hasData = availableDateSet.has(date);
      const isFuture = isFutureDate(date);

      // Don't allow selecting dates without data or future dates
      if (!hasData || isFuture) {
        if (hapticFeedback.notificationOccurred.isAvailable()) {
          hapticFeedback.notificationOccurred("error");
        }
        return;
      }

      // Already selected
      if (date === selectedDate) {
        return;
      }

      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("light");
      }
      onDateSelect(date);
    },
    [availableDateSet, selectedDate, onDateSelect]
  );

  // Handle scroll end - snap to nearest date WITH DATA in scroll direction
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    // Detect scroll direction
    const currentScrollLeft = container.scrollLeft;
    const scrollDirection = currentScrollLeft > lastScrollLeftRef.current ? 1 : -1; // 1 = right (newer), -1 = left (older)
    lastScrollLeftRef.current = currentScrollLeft;

    // Find currently centered date for haptic feedback
    const containerCenter = currentScrollLeft + container.offsetWidth / 2;
    let closestDate: string | null = null;
    let closestDistance = Infinity;

    itemRefs.current.forEach((element, date) => {
      const elementCenter = element.offsetLeft + element.offsetWidth / 2;
      const distance = Math.abs(elementCenter - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestDate = date;
      }
    });

    // Trigger haptic when crossing to a new date
    if (closestDate && closestDate !== lastCenteredDateRef.current && closestDistance < 28) {
      lastCenteredDateRef.current = closestDate;
      if (hapticFeedback.selectionChanged.isAvailable()) {
        hapticFeedback.selectionChanged();
      }
    }

    isScrollingRef.current = true;

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      if (!container) return;

      const containerCenter = container.scrollLeft + container.offsetWidth / 2;

      // Get all dates with their positions, sorted by position
      const datesWithPositions: Array<{
        date: string;
        center: number;
        hasData: boolean;
        isFuture: boolean;
      }> = [];

      itemRefs.current.forEach((element, date) => {
        const elementCenter = element.offsetLeft + element.offsetWidth / 2;
        datesWithPositions.push({
          date,
          center: elementCenter,
          hasData: availableDateSet.has(date),
          isFuture: isFutureDate(date),
        });
      });

      // Sort by position (left to right)
      datesWithPositions.sort((a, b) => a.center - b.center);

      // Find the closest date WITH DATA in the scroll direction
      let targetDate: string | null = null;

      if (scrollDirection >= 0) {
        // Scrolling right (towards newer dates) - find closest available date at or after center
        // But not future dates
        for (const item of datesWithPositions) {
          if (item.hasData && !item.isFuture && item.center >= containerCenter - 28) {
            targetDate = item.date;
            break;
          }
        }
        // If no date found ahead, find closest behind
        if (!targetDate) {
          for (let i = datesWithPositions.length - 1; i >= 0; i--) {
            const item = datesWithPositions[i];
            if (item.hasData && !item.isFuture) {
              targetDate = item.date;
              break;
            }
          }
        }
      } else {
        // Scrolling left (towards older dates) - find closest available date at or before center
        for (let i = datesWithPositions.length - 1; i >= 0; i--) {
          const item = datesWithPositions[i];
          if (item.hasData && !item.isFuture && item.center <= containerCenter + 28) {
            targetDate = item.date;
            break;
          }
        }
        // If no date found behind, find closest ahead (but not future)
        if (!targetDate) {
          for (const item of datesWithPositions) {
            if (item.hasData && !item.isFuture) {
              targetDate = item.date;
              break;
            }
          }
        }
      }

      // Snap to the target date
      if (targetDate && targetDate !== selectedDate) {
        if (hapticFeedback.selectionChanged.isAvailable()) {
          hapticFeedback.selectionChanged();
        }
        onDateSelect(targetDate);
      } else if (targetDate) {
        // Same date but might need to re-center
        const element = itemRefs.current.get(targetDate);
        if (element) {
          const elementCenter = element.offsetLeft + element.offsetWidth / 2;
          const targetScrollLeft = elementCenter - container.offsetWidth / 2;
          container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
        }
      }
    }, 80);
  }, [availableDateSet, selectedDate, onDateSelect]);

  // Set ref for each date element
  const setItemRef = useCallback(
    (date: string) => (el: HTMLButtonElement | null) => {
      if (el) {
        itemRefs.current.set(date, el);
      } else {
        itemRefs.current.delete(date);
      }
    },
    []
  );

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      {/* Selected date header */}
      <div className="flex flex-col items-center py-0.5">
        <p className="text-base font-medium text-white leading-5 tracking-[-0.176px]">
          {formatDateHeader(selectedDate)}
        </p>
      </div>

      {/* Collapsible section */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: collapsed ? "0fr" : "1fr",
          transition: "grid-template-rows 200ms ease-out",
        }}
      >
        <div className="overflow-hidden">
          {/* Triangle pointer */}
          <div className="flex items-center justify-center pt-1 pb-1.5">
            <svg
              width="8"
              height="6"
              viewBox="0 0 8 6"
              fill="none"
              className="text-white/60"
            >
              <path d="M4 6L0 0H8L4 6Z" fill="currentColor" />
            </svg>
          </div>

          {/* Scrollable date strip */}
          <div className="relative w-full">
        {/* Left fade gradient */}
        <div
          className="absolute left-0 top-0 h-10 w-9 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, #000, rgba(0, 0, 0, 0))",
          }}
        />

        {/* Right fade gradient */}
        <div
          className="absolute right-0 top-0 h-10 w-9 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, #000, rgba(0, 0, 0, 0))",
          }}
        />

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex items-center overflow-x-auto scrollbar-none h-10"
          style={{
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            // Deceleration rate for iOS
            // @ts-expect-error - WebKit specific property
            WebkitScrollDecelerationRate: "fast",
          }}
        >
          {/* Left padding for centering first item */}
          <div className="shrink-0 w-[calc(50%-28px)]" />

          {dates.map((date) => {
            const isSelected = date === selectedDate;
            const hasData = availableDateSet.has(date);
            const isFuture = isFutureDate(date);
            const isDisabled = !hasData || isFuture;
            const isPastLatestWithData = date > latestDateWithData;

            // Future placeholder - inactive circle with day number, no snap point
            if (isPastLatestWithData) {
              return (
                <div
                  key={date}
                  className="shrink-0 flex items-center justify-center w-14 h-10"
                >
                  <div
                    className="flex items-center justify-center rounded-full size-9"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
                  >
                    <span className="text-sm leading-5 font-normal text-white/20">
                      {getDayNumber(date)}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={date}
                ref={setItemRef(date)}
                onClick={() => handleDateClick(date)}
                disabled={isDisabled}
                className="shrink-0 flex items-center justify-center w-14 h-10 relative"
                style={{
                  scrollSnapAlign: "center",
                  scrollSnapStop: "always",
                }}
              >
                {/* Date circle */}
                <div
                  className="flex items-center justify-center rounded-full size-9 relative"
                  style={{
                    backgroundColor: isSelected
                      ? "rgba(255, 255, 255, 0.14)"
                      : hasData && !isFuture
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(255, 255, 255, 0.03)",
                  }}
                >
                  <span
                    className={`text-sm leading-5 ${
                      isSelected
                        ? "font-medium text-white"
                        : hasData && !isFuture
                          ? "font-normal text-white/60"
                          : "font-normal text-white/20"
                    }`}
                  >
                    {getDayNumber(date)}
                  </span>
                </div>

                {/* Red dot badge for dates with data (except selected) */}
                {hasData && !isFuture && !isSelected && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 size-4 flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-[#f9363c]" />
                  </div>
                )}
              </button>
            );
          })}

          {/* Right padding for centering last item */}
          <div className="shrink-0 w-[calc(50%-28px)]" />
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
