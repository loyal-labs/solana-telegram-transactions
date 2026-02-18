import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

const initCalls: unknown[] = [];
const identifyCalls: string[] = [];
const trackCalls: Array<{ event: string; properties?: Record<string, unknown> }> = [];
const registerOnceCalls: Array<Record<string, unknown>> = [];
const registerCalls: Array<Record<string, unknown>> = [];
const peopleSetOnceCalls: Array<Record<string, unknown>> = [];
const peopleSetCalls: Array<Record<string, unknown>> = [];

let currentDistinctId = "$device:anon";

const mixpanelMock = {
  init: (...args: unknown[]) => {
    initCalls.push(args);
  },
  track: (event: string, properties?: Record<string, unknown>) => {
    trackCalls.push({ event, properties });
  },
  identify: (distinctId: string) => {
    identifyCalls.push(distinctId);
    currentDistinctId = distinctId;
  },
  get_distinct_id: () => currentDistinctId,
  register_once: (properties: Record<string, unknown>) => {
    registerOnceCalls.push(properties);
  },
  register: (properties: Record<string, unknown>) => {
    registerCalls.push(properties);
  },
  reset: mock(() => {}),
  people: {
    set: (properties: Record<string, unknown>) => {
      peopleSetCalls.push(properties);
    },
    set_once: (properties: Record<string, unknown>) => {
      peopleSetOnceCalls.push(properties);
    },
  },
};

mock.module("mixpanel-browser", () => ({
  default: mixpanelMock,
}));

mock.module("@/lib/core/config/public", () => ({
  publicEnv: {
    mixpanelToken: "test-mixpanel-token",
    mixpanelProxyPath: "/ingest",
    solanaEnv: "mainnet",
  },
}));

let analytics: typeof import("../analytics");
const SUMMARY_ID = "123e4567-e89b-12d3-a456-426614174000";
const GROUP_CHAT_ID = "-1001234567890";
const VALID_START_PARAM = `sf1_${GROUP_CHAT_ID}_${SUMMARY_ID}`;

describe("analytics identifyTelegramUser", () => {
  beforeAll(async () => {
    analytics = await import("../analytics");
  });

  beforeEach(() => {
    (globalThis as { window?: unknown }).window = {
      location: { origin: "https://loyal.example" },
    };
    initCalls.length = 0;
    identifyCalls.length = 0;
    trackCalls.length = 0;
    registerOnceCalls.length = 0;
    registerCalls.length = 0;
    peopleSetOnceCalls.length = 0;
    peopleSetCalls.length = 0;
    currentDistinctId = "$device:anon";
    analytics.__resetAnalyticsStateForTests();
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  test("deduplicates identify/profile calls for the same Telegram user", () => {
    const identity = {
      telegramId: "123456789",
      firstName: "Ada",
      lastName: "Lovelace",
      username: "ada",
      photoUrl: "https://example.com/avatar.png",
      languageCode: "en",
      isPremium: true,
    };

    analytics.identifyTelegramUser(identity);
    analytics.identifyTelegramUser(identity);

    expect(initCalls).toHaveLength(1);
    expect(identifyCalls).toEqual(["tg:123456789"]);
    expect(registerOnceCalls).toHaveLength(1);
    expect(registerCalls).toHaveLength(1);
    expect(peopleSetOnceCalls).toHaveLength(1);
    expect(peopleSetCalls).toHaveLength(0);
    expect(peopleSetOnceCalls[0]).toMatchObject({
      telegram_language_code: "en",
      telegram_is_premium: true,
    });
  });

  test("identifies and profiles again when Telegram user changes", () => {
    analytics.identifyTelegramUser({
      telegramId: "1",
      firstName: "First",
      username: "first",
    });
    analytics.identifyTelegramUser({
      telegramId: "2",
      firstName: "Second",
      username: "second",
    });

    expect(identifyCalls).toEqual(["tg:1", "tg:2"]);
    expect(peopleSetOnceCalls).toHaveLength(2);
  });

  test("adds launch context to tracked events while context is set", () => {
    analytics.setTelegramLaunchContext({
      startParamRaw: VALID_START_PARAM,
      chatType: "channel",
      chatInstance: "99887766",
    });

    analytics.track("Page View", { path: "/telegram/wallet" });

    expect(trackCalls).toHaveLength(1);
    expect(trackCalls[0]).toEqual({
      event: "Page View",
      properties: {
        start_param_raw: VALID_START_PARAM,
        group_chat_id: GROUP_CHAT_ID,
        summary_id: SUMMARY_ID,
        path: "/telegram/wallet",
      },
    });
  });

  test("uses none placeholders when launch start param is missing", () => {
    analytics.setTelegramLaunchContext({
      chatType: "channel",
      chatInstance: "99887766",
    });

    analytics.track("Page View", { path: "/telegram/wallet" });

    expect(trackCalls).toHaveLength(1);
    expect(trackCalls[0]).toEqual({
      event: "Page View",
      properties: {
        start_param_raw: "none",
        group_chat_id: "none",
        summary_id: "none",
        path: "/telegram/wallet",
      },
    });
  });

  test("stops attaching launch context after clear", () => {
    analytics.setTelegramLaunchContext({
      startParamRaw: VALID_START_PARAM,
      chatType: "channel",
      chatInstance: "99887766",
    });
    analytics.clearTelegramLaunchContext();

    analytics.track("Page View", { path: "/telegram/wallet" });

    expect(trackCalls).toHaveLength(1);
    expect(trackCalls[0]).toEqual({
      event: "Page View",
      properties: {
        path: "/telegram/wallet",
      },
    });
  });
});
