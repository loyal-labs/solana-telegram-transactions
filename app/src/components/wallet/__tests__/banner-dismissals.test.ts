import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

const getCloudValueCalls: string[] = [];
const setCloudValueCalls: Array<{ key: string; value: string }> = [];

let storedCloudValue: string | null = null;
let getCloudValueImpl: (key: string) => Promise<string | null> = async () =>
  storedCloudValue;
let setCloudValueImpl: (key: string, value: string) => Promise<boolean> =
  async (_key: string, value: string) => {
    storedCloudValue = value;
    return true;
  };

mock.module("@/lib/telegram/mini-app/cloud-storage", () => ({
  getCloudValue: async (key: string) => {
    getCloudValueCalls.push(key);
    return getCloudValueImpl(key);
  },
  setCloudValue: async (key: string, value: string) => {
    setCloudValueCalls.push({ key, value });
    return setCloudValueImpl(key, value);
  },
}));

let loadDismissedBannerIds: typeof import("../banner-dismissals").loadDismissedBannerIds;
let saveDismissedBannerIds: typeof import("../banner-dismissals").saveDismissedBannerIds;
let getCachedDismissedBannerIds: typeof import("../banner-dismissals").getCachedDismissedBannerIds;
let clearDismissedBannerIdsCacheForTests: typeof import("../banner-dismissals").clearDismissedBannerIdsCacheForTests;

beforeAll(async () => {
  const loaded = await import("../banner-dismissals");
  loadDismissedBannerIds = loaded.loadDismissedBannerIds;
  saveDismissedBannerIds = loaded.saveDismissedBannerIds;
  getCachedDismissedBannerIds = loaded.getCachedDismissedBannerIds;
  clearDismissedBannerIdsCacheForTests = loaded.clearDismissedBannerIdsCacheForTests;
});

beforeEach(() => {
  getCloudValueCalls.length = 0;
  setCloudValueCalls.length = 0;
  storedCloudValue = null;
  getCloudValueImpl = async () => storedCloudValue;
  setCloudValueImpl = async (_key: string, value: string) => {
    storedCloudValue = value;
    return true;
  };
  clearDismissedBannerIdsCacheForTests();
});

describe("banner dismissals persistence", () => {
  test("returns empty set when no value is stored", async () => {
    const dismissed = await loadDismissedBannerIds();

    expect([...dismissed]).toEqual([]);
    expect(getCloudValueCalls).toHaveLength(1);
  });

  test("ignores malformed or non-array payloads", async () => {
    getCloudValueImpl = async () => "{bad-json";
    const malformed = await loadDismissedBannerIds();
    expect([...malformed]).toEqual([]);

    clearDismissedBannerIdsCacheForTests();

    getCloudValueImpl = async () => JSON.stringify({ id: "emoji-status" });
    const nonArray = await loadDismissedBannerIds();
    expect([...nonArray]).toEqual([]);
  });

  test("retries read on subsequent load when the first read fails", async () => {
    let attempts = 0;
    getCloudValueImpl = async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("temporary read failure");
      }
      return JSON.stringify(["home-screen"]);
    };

    const first = await loadDismissedBannerIds();
    expect([...first]).toEqual([]);
    expect(getCachedDismissedBannerIds()).toBeUndefined();
    expect(getCloudValueCalls).toHaveLength(1);

    const second = await loadDismissedBannerIds();
    expect([...second]).toEqual(["home-screen"]);
    expect(getCloudValueCalls).toHaveLength(2);

    const third = await loadDismissedBannerIds();
    expect([...third]).toEqual(["home-screen"]);
    expect(getCloudValueCalls).toHaveLength(2);
  });

  test("deduplicates IDs and persists valid JSON", async () => {
    await saveDismissedBannerIds([
      "emoji-status",
      "home-screen",
      "emoji-status",
    ]);

    expect(setCloudValueCalls).toHaveLength(1);
    expect(setCloudValueCalls[0]?.key).toBe("wallet_dismissed_banners_v1");
    expect(JSON.parse(setCloudValueCalls[0]?.value ?? "[]")).toEqual([
      "emoji-status",
      "home-screen",
    ]);
  });

  test("uses in-memory cache after first load", async () => {
    getCloudValueImpl = async () => JSON.stringify(["community-summary"]);

    const first = await loadDismissedBannerIds();
    expect([...first]).toEqual(["community-summary"]);
    expect(getCloudValueCalls).toHaveLength(1);

    getCloudValueImpl = async () => JSON.stringify(["home-screen"]);

    const second = await loadDismissedBannerIds();
    expect([...second]).toEqual(["community-summary"]);
    expect(getCloudValueCalls).toHaveLength(1);

    const cached = getCachedDismissedBannerIds();
    expect([...(cached ?? new Set())]).toEqual(["community-summary"]);
  });
});
