"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { initAnalytics, track } from "@/lib/core/analytics";

const PAGE_VIEW_EVENT = "Page View";

export function AnalyticsBootstrap() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname || !pathname.startsWith("/telegram")) {
      return;
    }

    if (lastTrackedPathRef.current === pathname) {
      return;
    }

    lastTrackedPathRef.current = pathname;

    track(PAGE_VIEW_EVENT, { path: pathname });
  }, [pathname]);

  return null;
}
