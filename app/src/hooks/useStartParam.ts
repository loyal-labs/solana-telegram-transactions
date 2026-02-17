"use client";

import { retrieveLaunchParams } from "@telegram-apps/sdk-react";

import { parseSummaryFeedStartParam } from "@/lib/telegram/mini-app/start-param";

/**
 * Parse startParam from URL and return the mapped route.
 * Works before React/SDK initialization - can be called in splash screen.
 *
 * Uses the Telegram SDK's retrieveLaunchParams() which handles multiple
 * sources (location.href, performance navigation entries, localStorage)
 * and various Telegram client hash formats. Falls back to manual URL
 * parsing if the SDK extraction fails.
 *
 * @returns The mapped route path if startParam is valid, undefined otherwise.
 */
export function getStartParamRoute(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const mapStartParamToRoute = (startParam: string | null | undefined): string | undefined => {
    const parsed = parseSummaryFeedStartParam(startParam ?? null);
    if (!parsed) {
      return undefined;
    }

    const params = new URLSearchParams({
      groupChatId: parsed.groupChatId,
      summaryId: parsed.summaryId,
    });

    return `/telegram/summaries/feed?${params.toString()}`;
  };

  // 1. Try SDK extraction (handles all Telegram client variations)
  try {
    const launchParams = retrieveLaunchParams();
    const routeFromSdk = mapStartParamToRoute(launchParams.tgWebAppStartParam);
    if (routeFromSdk) {
      return routeFromSdk;
    }
  } catch {
    // SDK extraction failed (e.g. not in Telegram context) — fall through
  }

  // 2. Fallback: manual hash / search-param parsing
  try {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      const startParam = params.get("tgWebAppStartParam");
      const routeFromHash = mapStartParamToRoute(startParam);
      if (routeFromHash) {
        return routeFromHash;
      }
    }

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
