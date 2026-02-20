import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

const trackCalls: Array<{
  event: string;
  properties?: Record<string, unknown>;
}> = [];

mock.module("@/lib/core/analytics", () => ({
  track: (event: string, properties?: Record<string, unknown>) => {
    trackCalls.push({ event, properties });
  },
}));

let trackWalletBannerClose: typeof import("../banner-analytics").trackWalletBannerClose;
let trackWalletBannerPress: typeof import("../banner-analytics").trackWalletBannerPress;

beforeAll(async () => {
  const loaded = await import("../banner-analytics");
  trackWalletBannerClose = loaded.trackWalletBannerClose;
  trackWalletBannerPress = loaded.trackWalletBannerPress;
});

beforeEach(() => {
  trackCalls.length = 0;
});

describe("banner analytics", () => {
  test("tracks press with expected event and properties", () => {
    trackWalletBannerPress("emoji-status");

    expect(trackCalls).toEqual([
      {
        event: 'Press "Wallet banner"',
        properties: {
          path: "/telegram/wallet",
          banner_id: "emoji-status",
        },
      },
    ]);
  });

  test("tracks close with expected event and properties", () => {
    trackWalletBannerClose("community-summary");

    expect(trackCalls).toEqual([
      {
        event: 'Close "Wallet banner"',
        properties: {
          path: "/telegram/wallet",
          banner_id: "community-summary",
        },
      },
    ]);
  });
});
