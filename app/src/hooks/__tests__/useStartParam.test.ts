import { afterEach, describe, expect, mock, test } from "bun:test";

import { getStartParamRoute } from "../useStartParam";

const GROUP_CHAT_ID = "-1002981429221";
const SUMMARY_ID = "123e4567-e89b-12d3-a456-426614174000";
const START_PARAM = `sf1_${GROUP_CHAT_ID}_${SUMMARY_ID}`;
const EXPECTED_ROUTE = `/telegram/summaries/feed?groupChatId=${encodeURIComponent(
  GROUP_CHAT_ID
)}&summaryId=${SUMMARY_ID}`;

const stubWindow = (overrides: Record<string, unknown> = {}) => {
  (globalThis as { window?: unknown }).window = {
    location: { hash: "", search: "", href: "" },
    ...overrides,
  };
};

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  mock.restore();
});

describe("getStartParamRoute", () => {
  describe("native Telegram bridge (primary)", () => {
    test("reads start_param from Telegram.WebApp.initDataUnsafe", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => {
          throw new Error("unused");
        },
      }));

      stubWindow({
        Telegram: {
          WebApp: {
            initDataUnsafe: { start_param: START_PARAM },
          },
        },
      });

      expect(getStartParamRoute()).toBe(EXPECTED_ROUTE);
    });

    test("skips when initDataUnsafe has no start_param", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => ({
          tgWebAppStartParam: undefined,
        }),
      }));

      stubWindow({
        Telegram: { WebApp: { initDataUnsafe: {} } },
      });

      expect(getStartParamRoute()).toBeUndefined();
    });
  });

  describe("SDK extraction (secondary)", () => {
    test("parses start param via retrieveLaunchParams", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => ({
          tgWebAppStartParam: START_PARAM,
        }),
      }));

      stubWindow();

      expect(getStartParamRoute()).toBe(EXPECTED_ROUTE);
    });
  });

  describe("manual fallback (when SDK throws)", () => {
    test("parses start param from hash", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => {
          throw new Error("Not in Telegram context");
        },
      }));

      stubWindow({
        location: {
          hash: `#tgWebAppStartParam=${START_PARAM}`,
          search: "",
          href: "",
        },
      });

      expect(getStartParamRoute()).toBe(EXPECTED_ROUTE);
    });

    test("falls back to search params", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => {
          throw new Error("Not in Telegram context");
        },
      }));

      stubWindow({
        location: {
          hash: "",
          search: `?tgWebAppStartParam=${START_PARAM}`,
          href: "",
        },
      });

      expect(getStartParamRoute()).toBe(EXPECTED_ROUTE);
    });

    test("returns undefined for invalid payload", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => {
          throw new Error("Not in Telegram context");
        },
      }));

      stubWindow({
        location: {
          hash: "#tgWebAppStartParam=invalid",
          search: "",
          href: "",
        },
      });

      expect(getStartParamRoute()).toBeUndefined();
    });
  });

  describe("tgWebAppData blob extraction (when start_param is only inside init data)", () => {
    const TG_WEB_APP_DATA = `user=%7B%22id%22%3A123%7D&start_param=${START_PARAM}&auth_date=1234`;

    test("extracts start_param from tgWebAppData in hash", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => {
          throw new Error("Not in Telegram context");
        },
      }));

      stubWindow({
        location: {
          hash: `#tgWebAppData=${encodeURIComponent(TG_WEB_APP_DATA)}&tgWebAppVersion=8.0`,
          search: "",
          href: `https://example.com/#tgWebAppData=${encodeURIComponent(TG_WEB_APP_DATA)}&tgWebAppVersion=8.0`,
        },
      });

      expect(getStartParamRoute()).toBe(EXPECTED_ROUTE);
    });

    test("extracts start_param from tgWebAppData in query string", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => {
          throw new Error("Not in Telegram context");
        },
      }));

      stubWindow({
        location: {
          hash: "",
          search: "",
          href: `https://example.com/?tgWebAppData=${encodeURIComponent(TG_WEB_APP_DATA)}`,
        },
      });

      expect(getStartParamRoute()).toBe(EXPECTED_ROUTE);
    });
  });
});
