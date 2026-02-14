import { describe, expect, test } from "bun:test";

import { shouldTrackTelegramPageView } from "../AnalyticsBootstrap";

describe("shouldTrackTelegramPageView", () => {
  test("returns true for first Telegram pageview when identity is ready", () => {
    expect(
      shouldTrackTelegramPageView({
        pathname: "/telegram/wallet",
        didTrackForCurrentPath: false,
        hasIdentity: true,
        canTrackWithoutIdentity: false,
      })
    ).toBe(true);
  });

  test("returns false after first pageview has already been tracked for a path", () => {
    expect(
      shouldTrackTelegramPageView({
        pathname: "/telegram/wallet",
        didTrackForCurrentPath: true,
        hasIdentity: true,
        canTrackWithoutIdentity: true,
      })
    ).toBe(false);
  });

  test("returns true for pathname transition when first-track flag is reset", () => {
    expect(
      shouldTrackTelegramPageView({
        pathname: "/telegram/profile",
        didTrackForCurrentPath: false,
        hasIdentity: true,
        canTrackWithoutIdentity: true,
      })
    ).toBe(true);
  });

  test("blocks tracking when identity is unresolved and fallback window is not reached", () => {
    expect(
      shouldTrackTelegramPageView({
        pathname: "/telegram/wallet",
        didTrackForCurrentPath: false,
        hasIdentity: false,
        canTrackWithoutIdentity: false,
      })
    ).toBe(false);
  });

  test("allows tracking without identity after fallback window", () => {
    expect(
      shouldTrackTelegramPageView({
        pathname: "/telegram/wallet",
        didTrackForCurrentPath: false,
        hasIdentity: false,
        canTrackWithoutIdentity: true,
      })
    ).toBe(true);
  });
});
