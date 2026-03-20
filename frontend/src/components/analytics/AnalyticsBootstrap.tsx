"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAuthSession } from "@/contexts/auth-session-context";
import { usePublicEnv } from "@/contexts/public-env-context";
import {
  identifyAuthenticatedUser,
  initAnalytics,
  resetAuthenticatedUser,
  trackPageView,
} from "@/lib/core/analytics";

export type ShouldTrackFrontendPageViewParams = {
  pathname: string | null;
  lastTrackedPath: string | null;
};

export function shouldTrackFrontendPageView({
  pathname,
  lastTrackedPath,
}: ShouldTrackFrontendPageViewParams): boolean {
  return Boolean(pathname && pathname !== lastTrackedPath);
}

export function AnalyticsBootstrap() {
  const pathname = usePathname();
  const publicEnv = usePublicEnv();
  const { user } = useAuthSession();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    void initAnalytics(publicEnv);
  }, [publicEnv]);

  useEffect(() => {
    if (!shouldTrackFrontendPageView({
      pathname,
      lastTrackedPath: lastTrackedPathRef.current,
    })) {
      return;
    }

    lastTrackedPathRef.current = pathname;
    trackPageView(publicEnv, pathname!);
  }, [pathname, publicEnv]);

  useEffect(() => {
    if (!user) {
      resetAuthenticatedUser();
      return;
    }

    identifyAuthenticatedUser(publicEnv, user);
  }, [publicEnv, user]);

  return null;
}
