import { afterEach, describe, expect, mock, test } from "bun:test";

import { getStartParamRoute } from "../useStartParam";

const GROUP_CHAT_ID = "-1002981429221";
const SUMMARY_ID = "123e4567-e89b-12d3-a456-426614174000";
const START_PARAM = `sf1_${GROUP_CHAT_ID}_${SUMMARY_ID}`;
const EXPECTED_ROUTE = `/telegram/summaries/feed?groupChatId=${encodeURIComponent(
  GROUP_CHAT_ID
)}&summaryId=${SUMMARY_ID}`;

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  mock.restore();
});

describe("getStartParamRoute", () => {
  describe("SDK extraction (primary)", () => {
    test("parses start param via retrieveLaunchParams", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => ({
          tgWebAppStartParam: START_PARAM,
        }),
      }));

      (globalThis as { window?: unknown }).window = {
        location: { hash: "", search: "" },
      };

      expect(getStartParamRoute()).toBe(EXPECTED_ROUTE);
    });

    test("returns undefined when SDK has no start param", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => ({
          tgWebAppStartParam: undefined,
        }),
      }));

      (globalThis as { window?: unknown }).window = {
        location: { hash: "", search: "" },
      };

      expect(getStartParamRoute()).toBeUndefined();
    });
  });

  describe("manual fallback (when SDK throws)", () => {
    test("parses start param from hash", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => {
          throw new Error("Not in Telegram context");
        },
      }));

      (globalThis as { window?: unknown }).window = {
        location: {
          hash: `#tgWebAppStartParam=${START_PARAM}`,
          search: "",
        },
      };

      expect(getStartParamRoute()).toBe(EXPECTED_ROUTE);
    });

    test("falls back to search params", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => {
          throw new Error("Not in Telegram context");
        },
      }));

      (globalThis as { window?: unknown }).window = {
        location: {
          hash: "",
          search: `?tgWebAppStartParam=${START_PARAM}`,
        },
      };

      expect(getStartParamRoute()).toBe(EXPECTED_ROUTE);
    });

    test("returns undefined for invalid payload", () => {
      mock.module("@telegram-apps/sdk-react", () => ({
        retrieveLaunchParams: () => {
          throw new Error("Not in Telegram context");
        },
      }));

      (globalThis as { window?: unknown }).window = {
        location: {
          hash: "#tgWebAppStartParam=invalid",
          search: "",
        },
      };

      expect(getStartParamRoute()).toBeUndefined();
    });
  });
});
