"use client";

import { retrieveLaunchParams } from "@telegram-apps/sdk-react";

import { parseSummaryFeedStartParam } from "@/lib/telegram/mini-app/start-param";

/**
 * Extract start_param from the native Telegram WebApp bridge object.
 * This is set by Telegram before the web app loads and is the most
 * reliable source — it doesn't depend on URL hash format or SDK init.
 */
function getNativeStartParam(): string | undefined {
  try {
    const startParam = (
      window as { Telegram?: { WebApp?: { initDataUnsafe?: { start_param?: string } } } }
    ).Telegram?.WebApp?.initDataUnsafe?.start_param;
    return startParam || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Parse startParam and return the mapped route.
 *
 * Tries three sources in order:
 * 1. Native Telegram WebApp bridge (most reliable, always set by Telegram)
 * 2. SDK retrieveLaunchParams (multi-source: href, perf entries, localStorage)
 * 3. Manual URL hash / search-param parsing (legacy fallback)
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

  // 1. Native Telegram WebApp bridge (most reliable)
  const nativeParam = getNativeStartParam();
  const routeFromNative = mapStartParamToRoute(nativeParam);
  if (routeFromNative) {
    return routeFromNative;
  }

  // 2. SDK extraction (handles various client hash formats)
  try {
    const launchParams = retrieveLaunchParams();
    const routeFromSdk = mapStartParamToRoute(launchParams.tgWebAppStartParam);
    if (routeFromSdk) {
      return routeFromSdk;
    }
  } catch {
    // SDK extraction failed (e.g. not in Telegram context) — fall through
  }

  // 3. Manual hash / search-param parsing
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
