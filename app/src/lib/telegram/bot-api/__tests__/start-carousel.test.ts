import { describe, expect, test } from "bun:test";

import {
  buildStartCarouselKeyboard,
  calculateNextCarouselIndex,
  encodeStartCarouselCallbackData,
  parseStartCarouselCallbackData,
  START_CAROUSEL_CALLBACK_DATA_REGEX,
  START_CAROUSEL_SLIDES,
} from "../start-carousel";

describe("start carousel callback parser", () => {
  test("parses valid callback data", () => {
    const data = encodeStartCarouselCallbackData("next", 2);
    expect(parseStartCarouselCallbackData(data)).toEqual({
      action: "next",
      currentIndex: 2,
    });
  });

  test("rejects callback data with invalid prefix", () => {
    expect(parseStartCarouselCallbackData("not_carousel:next:0")).toBeNull();
  });

  test("rejects callback data with invalid shape", () => {
    expect(parseStartCarouselCallbackData("start_carousel:next")).toBeNull();
  });

  test("rejects callback data with extra segments", () => {
    expect(
      parseStartCarouselCallbackData("start_carousel:next:0:unexpected")
    ).toBeNull();
  });

  test("rejects callback data with out-of-range index", () => {
    expect(parseStartCarouselCallbackData("start_carousel:next:99")).toBeNull();
  });

  test("regex trigger only matches expected callback format", () => {
    expect(START_CAROUSEL_CALLBACK_DATA_REGEX.test("start_carousel:prev:0")).toBe(
      true
    );
    expect(
      START_CAROUSEL_CALLBACK_DATA_REGEX.test("start_carousel:prev:0:extra")
    ).toBe(false);
  });
});

describe("start carousel navigation", () => {
  test("wraps from first slide to last on prev", () => {
    expect(calculateNextCarouselIndex(0, "prev")).toBe(
      START_CAROUSEL_SLIDES.length - 1
    );
  });

  test("wraps from last slide to first on next", () => {
    expect(
      calculateNextCarouselIndex(START_CAROUSEL_SLIDES.length - 1, "next")
    ).toBe(0);
  });
});

describe("start carousel keyboard", () => {
  test("builds two rows with two callbacks and one mini app URL button", () => {
    const keyboard = buildStartCarouselKeyboard(0);
    const rows = keyboard.inline_keyboard;

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(2);
    expect(rows[1]).toHaveLength(1);
    expect(rows[0][0]?.callback_data).toBe("start_carousel:prev:0");
    expect(rows[0][1]?.callback_data).toBe("start_carousel:next:0");
    expect(rows[1][0]?.url).toBe("https://t.me/askloyal_tgbot/app");
  });
});

describe("start carousel slides", () => {
  test("defines five slides with expected captions", () => {
    expect(START_CAROUSEL_SLIDES).toHaveLength(5);

    const captions = START_CAROUSEL_SLIDES.map((slide) => slide.caption);
    expect(captions).toEqual([
      "Instantly see what’s happening in busy group chats with AI summaries.",
      "Quickly review and manage your Telegram DMs in one place.",
      "Securely hold and manage your digital assets with privacy protection built into the system.",
      "Send and receive funds without exposing balances or history.",
      "A private AI chat where your questions and conversations stay confidential.",
    ]);
  });
});
