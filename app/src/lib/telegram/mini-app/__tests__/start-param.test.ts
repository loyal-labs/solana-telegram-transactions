import { describe, expect, test } from "bun:test";

import {
  buildSummaryFeedMiniAppUrl,
  buildSummaryFeedStartParam,
  parseSummaryFeedStartParam,
} from "../start-param";

const GROUP_CHAT_ID = "-1002981429221";
const SUMMARY_ID = "123e4567-e89b-12d3-a456-426614174000";

describe("start-param summary feed codec", () => {
  test("builds and parses a valid summary feed start param", () => {
    const startParam = buildSummaryFeedStartParam(GROUP_CHAT_ID, SUMMARY_ID);

    expect(startParam).toBe(`sf1_${GROUP_CHAT_ID}_${SUMMARY_ID}`);
    expect(parseSummaryFeedStartParam(startParam)).toEqual({
      groupChatId: GROUP_CHAT_ID,
      summaryId: SUMMARY_ID,
      version: "sf1",
    });
  });

  test("builds mini app URL with startapp payload", () => {
    expect(buildSummaryFeedMiniAppUrl(GROUP_CHAT_ID, SUMMARY_ID)).toBe(
      `https://t.me/askloyal_tgbot/app?startapp=sf1_${GROUP_CHAT_ID}_${SUMMARY_ID}`
    );
  });

  test("rejects invalid prefix", () => {
    expect(
      parseSummaryFeedStartParam(`wrong_${GROUP_CHAT_ID}_${SUMMARY_ID}`)
    ).toBeNull();
  });

  test("rejects invalid chat id", () => {
    expect(parseSummaryFeedStartParam(`sf1_not-a-chat_${SUMMARY_ID}`)).toBeNull();
  });

  test("rejects invalid summary id", () => {
    expect(parseSummaryFeedStartParam(`sf1_${GROUP_CHAT_ID}_invalid`)).toBeNull();
  });

  test("rejects payloads longer than Telegram limit", () => {
    const veryLongChatId = `-${"9".repeat(80)}`;

    expect(() =>
      buildSummaryFeedStartParam(veryLongChatId, SUMMARY_ID)
    ).toThrow("Start param exceeds Telegram limits");
  });
});

