import { describe, expect, test } from "bun:test";
import { InlineKeyboard } from "grammy";

describe("grammy inline keyboard style support", () => {
  test("keeps style and icon metadata on callback buttons", () => {
    const keyboard = new InlineKeyboard().text(
      {
        icon_custom_emoji_id: "5373141891321699084",
        style: "primary",
        text: "Claim now",
      },
      "claim:123"
    );

    const button = keyboard.inline_keyboard[0]?.[0];

    expect(button).toEqual({
      callback_data: "claim:123",
      icon_custom_emoji_id: "5373141891321699084",
      style: "primary",
      text: "Claim now",
    });
  });

  test("keeps style metadata on URL buttons", () => {
    const keyboard = new InlineKeyboard().url(
      {
        style: "success",
        text: "Open",
      },
      "https://t.me/askloyal"
    );

    const button = keyboard.inline_keyboard[0]?.[0];

    expect(button).toEqual({
      style: "success",
      text: "Open",
      url: "https://t.me/askloyal",
    });
  });
});
