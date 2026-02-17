"use client";

import { useSignal, viewport } from "@telegram-apps/sdk-react";
import type { Signal } from "@telegram-apps/signals";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AnalyticsBootstrapClient } from "@/components/analytics/AnalyticsBootstrapClient";
import Header from "@/components/Header";
import BottomNav from "@/components/telegram/BottomNav";
import Onboarding from "@/components/telegram/Onboarding";
import { TelegramAppRootClient } from "@/components/telegram/TelegramAppRootClient";
import { TelegramProvider } from "@/components/telegram/TelegramProvider";
import {
  getUnconsumedStartParamRoute,
  markStartParamConsumed,
} from "@/hooks/useStartParam";
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
  const router = useRouter();
  const safeAreaInsetTop = useSignal(
    viewport.safeAreaInsetTop as Signal<number>
  );
  const pathname = usePathname();
  // null = loading, true = show, false = don't show
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  // Detect deeplink synchronously on first render to prevent
  // flash of cached page content (black screen / flicker).
  const [deeplinkRoute, setDeeplinkRoute] = useState<string | undefined>(
    () => {
      if (typeof window === "undefined") return undefined;
      return getUnconsumedStartParamRoute();
    }
  );

  // Redirect to deeplink route once on mount
  useEffect(() => {
    if (!deeplinkRoute) return;
    if (pathname !== deeplinkRoute.split("?")[0]) {
      router.replace(deeplinkRoute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Mark consumed and clear state once navigation to target completes,
  // so refreshes and back-navigation don't re-trigger the redirect.
  useEffect(() => {
    if (!deeplinkRoute) return;
    if (pathname === deeplinkRoute.split("?")[0]) {
      markStartParamConsumed(deeplinkRoute);
      setDeeplinkRoute(undefined);
    }
  }, [deeplinkRoute, pathname]);

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

  // While redirecting to deeplink, render blank screen to avoid flashing
  // the cached page content before navigation completes.
  const isRedirecting =
    deeplinkRoute && pathname !== deeplinkRoute.split("?")[0];

  if (isRedirecting) {
    return <div style={{ background: "#fff", minHeight: "100vh" }} />;
  }

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
