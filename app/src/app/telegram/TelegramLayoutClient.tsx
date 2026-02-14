"use client";

import { useSignal, viewport } from "@telegram-apps/sdk-react";
import type { Signal } from "@telegram-apps/signals";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AnalyticsBootstrapClient } from "@/components/analytics/AnalyticsBootstrapClient";
import Header from "@/components/Header";
import BottomNav from "@/components/telegram/BottomNav";
import Onboarding from "@/components/telegram/Onboarding";
import { TelegramAppRootClient } from "@/components/telegram/TelegramAppRootClient";
import { TelegramProvider } from "@/components/telegram/TelegramProvider";
import {
  getCloudValue,
  setCloudValue,
} from "@/lib/telegram/mini-app/cloud-storage";

const ONBOARDING_DONE_KEY = "onboarding_done";

export default function TelegramLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const safeAreaInsetTop = useSignal(
    viewport.safeAreaInsetTop as Signal<number>
  );
  const pathname = usePathname();
  // null = loading, true = show, false = don't show
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  // Check cloud storage for onboarding completion
  useEffect(() => {
    getCloudValue(ONBOARDING_DONE_KEY).then((value) => {
      setShowOnboarding(value !== "1");
    });
  }, []);

  const handleOnboardingDone = () => {
    setShowOnboarding(false);
    void setCloudValue(ONBOARDING_DONE_KEY, "1");
  };

  // Reset scroll position when navigating between pages
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Header height: safe area + 10px + logo (27px) + padding bottom (16px)
  const headerHeight = Math.max(safeAreaInsetTop || 0, 12) + 10 + 27 + 16;

  return (
    <TelegramAppRootClient>
      <AnalyticsBootstrapClient />
      <TelegramProvider>
        <div
          className="flex flex-col"
          style={{ background: "#fff", minHeight: "100vh" }}
        >
          <Header />
          {showOnboarding ? (
            <Onboarding
              headerHeight={headerHeight}
              onDone={handleOnboardingDone}
            />
          ) : showOnboarding === false ? (
            <>
              <div
                className="flex-1"
                style={{ paddingTop: headerHeight }}
              >
                {children}
              </div>
              <BottomNav />
            </>
          ) : null}
        </div>
      </TelegramProvider>
    </TelegramAppRootClient>
  );
}
