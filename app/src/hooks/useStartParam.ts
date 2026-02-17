"use client";

import { parseSummaryFeedStartParam } from "@/lib/telegram/mini-app/start-param";

/**
 * Parse startParam from URL and return the mapped route.
 * Works before React/SDK initialization - can be called in splash screen.
 *
 * Telegram passes startParam in the URL hash as tgWebAppStartParam.
 * Format: #tgWebAppStartParam=value or in query string.
 *
 * @returns The mapped route path if startParam is valid, undefined otherwise.
 */
export function getStartParamRoute(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const mapStartParamToRoute = (startParam: string | null): string | undefined => {
    const parsed = parseSummaryFeedStartParam(startParam);
    if (!parsed) {
      return undefined;
    }

    const params = new URLSearchParams({
      groupChatId: parsed.groupChatId,
      summaryId: parsed.summaryId,
    });

    return `/telegram/summaries/feed?${params.toString()}`;
  };

  try {
    // Try to get from URL hash (Telegram format: #tgWebAppStartParam=value)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      const startParam = params.get("tgWebAppStartParam");
      const routeFromHash = mapStartParamToRoute(startParam);
      if (routeFromHash) {
        return routeFromHash;
      }
    }

    // Also check URL search params as fallback
    const searchParams = new URLSearchParams(window.location.search);
    const startParam = searchParams.get("tgWebAppStartParam");
    const routeFromSearch = mapStartParamToRoute(startParam);
    if (routeFromSearch) {
      return routeFromSearch;
    }
  } catch (error) {
    console.debug("Failed to parse startParam from URL:", error);
  }

  return undefined;
}
