"use client";

import { addToHomeScreen, postEvent } from "@telegram-apps/sdk";
import { hapticFeedback } from "@telegram-apps/sdk-react";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { setLoyalEmojiStatus } from "@/lib/telegram/mini-app/emoji-status";

type Banner = {
  id: string;
  title: string;
  cta: string;
  image: string;
  onPress: () => void;
};

const SWIPE_THRESHOLD = 50;
const SLIDE_DURATION = 180;
const AUTO_ROTATE_INTERVAL = 3000;

function BannerCard({
  banner,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: {
  banner: Banner;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}) {
  return (
    <button
      className="relative w-full rounded-[20px] text-left active:opacity-80 transition-opacity"
      style={{ backgroundColor: "#f2f2f7" }}
      onClick={banner.onPress}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex gap-4 items-start pl-4 pr-[120px] py-3 min-h-[76px]">
        <div className="flex flex-col flex-1 justify-between min-h-[52px]">
          <p className="font-medium text-[17px] leading-[22px] tracking-[-0.187px] text-black">
            {banner.title}
          </p>
          <div className="flex items-center">
            <span
              className="text-[15px] leading-5"
              style={{ color: "rgba(60, 60, 67, 0.6)" }}
            >
              {banner.cta}
            </span>
            <ChevronRight
              size={12}
              strokeWidth={1.5}
              style={{ color: "rgba(60, 60, 67, 0.6)" }}
              className="mt-0.5"
            />
          </div>
        </div>
      </div>

      {/* Mascot image — bottom-aligned, overflows above the card */}
      <div className="absolute bottom-0 right-0 w-[100px] h-[120px] pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.image}
          alt=""
          className="absolute bottom-0 right-0 w-full h-auto"
        />
      </div>
    </button>
  );
}

export type BannerCarouselProps = {
  isMobilePlatform: boolean;
};

export default function BannerCarousel({
  isMobilePlatform,
}: BannerCarouselProps) {
  const router = useRouter();

  const banners = useMemo(() => {
    const list: Banner[] = [];

    if (isMobilePlatform) {
      list.push({
        id: "home-screen",
        title: "Add App to Home Screen",
        cta: "Add",
        image: "/banners/banner1.png",
        onPress: () => {
          if (hapticFeedback.impactOccurred.isAvailable()) {
            hapticFeedback.impactOccurred("light");
          }
          if (addToHomeScreen.isAvailable()) {
            addToHomeScreen();
          } else {
            postEvent("web_app_add_to_home_screen");
          }
        },
      });
    }

    list.push({
      id: "emoji-status",
      title: "Set Emoji Status",
      cta: "Set",
      image: "/banners/banner2.png",
      onPress: () => {
        if (hapticFeedback.impactOccurred.isAvailable()) {
          hapticFeedback.impactOccurred("light");
        }
        void setLoyalEmojiStatus();
      },
    });

    list.push({
      id: "community-summary",
      title: "View Community Summary",
      cta: "View",
      image: "/banners/banner3.png",
      onPress: () => {
        if (hapticFeedback.impactOccurred.isAvailable()) {
          hapticFeedback.impactOccurred("light");
        }
        router.push("/telegram/summaries");
      },
    });

    return list;
  }, [isMobilePlatform, router]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [swipeX, setSwipeX] = useState(0);
  const [slideDirection, setSlideDirection] = useState<
    "left" | "right" | null
  >(null);
  const [isSliding, setIsSliding] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const bannersRef = useRef(banners);
  bannersRef.current = banners;

  // Preload all banner images on mount
  useEffect(() => {
    for (const banner of banners) {
      const img = new Image();
      img.src = banner.image;
    }
  }, [banners]);

  // Auto-rotate timer
  useEffect(() => {
    if (!autoRotate || bannersRef.current.length <= 1) return;

    const timer = setInterval(() => {
      const count = bannersRef.current.length;
      const next = (activeIndexRef.current + 1) % count;
      setSlideDirection("left");
      setIsSliding(true);
      setActiveIndex(next);

      setTimeout(() => {
        setIsSliding(false);
        setSlideDirection(null);
      }, SLIDE_DURATION);
    }, AUTO_ROTATE_INTERVAL);

    return () => clearInterval(timer);
  }, [autoRotate]);

  const goTo = useCallback(
    (index: number, direction: "left" | "right") => {
      const count = banners.length;
      const wrapped = ((index % count) + count) % count;
      if (wrapped === activeIndex) return;

      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("light");
      }

      setAutoRotate(false);
      setSlideDirection(direction);
      setIsSliding(true);
      setActiveIndex(wrapped);

      setTimeout(() => {
        setIsSliding(false);
        setSlideDirection(null);
      }, SLIDE_DURATION);
    },
    [activeIndex, banners.length],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isSwipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;

      if (
        !isSwipingRef.current &&
        Math.abs(deltaX) > 10 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5
      ) {
        isSwipingRef.current = true;
      }

      if (isSwipingRef.current) {
        setSwipeX(deltaX * 0.35);

        if (
          Math.abs(deltaX) >= SWIPE_THRESHOLD &&
          Math.abs(deltaX - (deltaX > 0 ? 5 : -5)) < SWIPE_THRESHOLD
        ) {
          if (hapticFeedback.selectionChanged.isAvailable()) {
            hapticFeedback.selectionChanged();
          }
        }
      }
    },
    [],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const deltaX =
        e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY =
        e.changedTouches[0].clientY - touchStartRef.current.y;

      if (
        Math.abs(deltaX) > SWIPE_THRESHOLD &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5
      ) {
        if (deltaX < 0) {
          goTo(activeIndex + 1, "left");
        } else {
          goTo(activeIndex - 1, "right");
        }
      }

      setSwipeX(0);
      touchStartRef.current = null;
      isSwipingRef.current = false;
    },
    [activeIndex, goTo],
  );

  const banner = banners[activeIndex];

  // Compute card transform: swipe drag OR slide animation
  const getCardStyle = (): React.CSSProperties => {
    if (swipeX !== 0) {
      return {
        transform: `translateX(${swipeX}px)`,
        transition: "none",
      };
    }
    if (isSliding && slideDirection) {
      return {
        animation: `banner-slide-in-${slideDirection} ${SLIDE_DURATION}ms ease-out forwards`,
      };
    }
    return {
      transform: "translateX(0)",
      transition: "transform 200ms ease-out",
    };
  };

  if (banners.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 pt-4 px-4">
      {/* Slide-in keyframes */}
      <style>{`
        @keyframes banner-slide-in-left {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes banner-slide-in-right {
          from { transform: translateX(-40px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Swipe area — overflow visible so mascot can poke above */}
      <div className="relative overflow-visible">
        <div style={getCardStyle()}>
          <BannerCard
            banner={banner}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>
      </div>

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {banners.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: 7,
                height: 7,
                backgroundColor:
                  i === activeIndex
                    ? "#F9363C"
                    : "rgba(60, 60, 67, 0.18)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
