import { afterEach, describe, expect, test } from "bun:test";

import { getStartParamRoute } from "../useStartParam";

const GROUP_CHAT_ID = "-1002981429221";
const SUMMARY_ID = "123e4567-e89b-12d3-a456-426614174000";
const START_PARAM = `sf1_${GROUP_CHAT_ID}_${SUMMARY_ID}`;

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("getStartParamRoute", () => {
  test("parses start param from hash", () => {
    (globalThis as { window?: unknown }).window = {
      location: {
        hash: `#tgWebAppStartParam=${START_PARAM}`,
        search: "",
      },
    };

    expect(getStartParamRoute()).toBe(
      `/telegram/summaries/feed?groupChatId=${encodeURIComponent(
        GROUP_CHAT_ID
      )}&summaryId=${SUMMARY_ID}`
    );
  });

  test("falls back to search params", () => {
    (globalThis as { window?: unknown }).window = {
      location: {
        hash: "",
        search: `?tgWebAppStartParam=${START_PARAM}`,
      },
    };

    expect(getStartParamRoute()).toBe(
      `/telegram/summaries/feed?groupChatId=${encodeURIComponent(
        GROUP_CHAT_ID
      )}&summaryId=${SUMMARY_ID}`
    );
  });

  test("returns undefined for invalid payload", () => {
    (globalThis as { window?: unknown }).window = {
      location: {
        hash: "#tgWebAppStartParam=invalid",
        search: "",
      },
    };

    expect(getStartParamRoute()).toBeUndefined();
  });
});

