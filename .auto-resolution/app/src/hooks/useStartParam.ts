"use client";

/**
 * Route mapping for startParam values.
 * Maps Telegram startParam string values to their corresponding app routes.
 */
export const START_PARAM_ROUTES: Record<string, string> = {
  feed: "/telegram/summaries/feed",
};

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

  try {
    // Try to get from URL hash (Telegram format: #tgWebAppStartParam=value)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      const startParam = params.get("tgWebAppStartParam");
      if (startParam && START_PARAM_ROUTES[startParam]) {
        return START_PARAM_ROUTES[startParam];
      }
    }

    // Also check URL search params as fallback
    const searchParams = new URLSearchParams(window.location.search);
    const startParam = searchParams.get("tgWebAppStartParam");
    if (startParam && START_PARAM_ROUTES[startParam]) {
      return START_PARAM_ROUTES[startParam];
    }
  } catch (error) {
    console.debug("Failed to parse startParam from URL:", error);
  }

  return undefined;
}
