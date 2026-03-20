import { describe, expect, test } from "bun:test";

import { shouldTrackFrontendPageView } from "../AnalyticsBootstrap";
import { getFrontendPageViewEventName } from "@/lib/core/analytics";

describe("frontend analytics bootstrap helpers", () => {
  test("formats page view event names", () => {
    expect(getFrontendPageViewEventName("/")).toBe("View /");
    expect(getFrontendPageViewEventName("/wallet")).toBe("View /wallet");
  });

  test("tracks the first pathname", () => {
    expect(
      shouldTrackFrontendPageView({
        pathname: "/",
        lastTrackedPath: null,
      })
    ).toBe(true);
  });

  test("does not retrack the same pathname", () => {
    expect(
      shouldTrackFrontendPageView({
        pathname: "/wallet",
        lastTrackedPath: "/wallet",
      })
    ).toBe(false);
  });

  test("tracks a pathname transition without auth or hydration inputs", () => {
    expect(
      shouldTrackFrontendPageView({
        pathname: "/chat",
        lastTrackedPath: "/wallet",
      })
    ).toBe(true);
  });
});
