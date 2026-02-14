import { describe, expect, mock, test } from "bun:test";

import {
  parseTelegramAnalyticsContextFromInitData,
  parseTelegramIdentityFromInitData,
  parseUserFromInitData,
} from "../init-data-transform";

describe("parseTelegramIdentityFromInitData", () => {
  test("parses user identity from stringified Telegram user payload", () => {
    const rawInitData = [
      "query_id=aa",
      `user=${encodeURIComponent(
        JSON.stringify({
          id: 123456789,
          first_name: "Ada",
          last_name: "Lovelace",
          username: "ada",
          photo_url: "https://example.com/avatar.png",
          language_code: "en",
          is_premium: true,
        })
      )}`,
      "auth_date=1700000000",
      "hash=hash",
    ].join("&");

    expect(parseTelegramIdentityFromInitData(rawInitData)).toEqual({
      telegramId: "123456789",
      firstName: "Ada",
      lastName: "Lovelace",
      username: "ada",
      photoUrl: "https://example.com/avatar.png",
      languageCode: "en",
      isPremium: true,
    });
  });

  test("parses user identity from object-shaped user payload", () => {
    const rawInitData = [
      "query_id=aa",
      "user[id]=987654321",
      "user[first_name]=Linus",
      "user[last_name]=Torvalds",
      "user[username]=linus",
      "hash=hash",
    ].join("&");

    expect(parseTelegramIdentityFromInitData(rawInitData)).toEqual({
      telegramId: "987654321",
      firstName: "Linus",
      lastName: "Torvalds",
      username: "linus",
      photoUrl: undefined,
      languageCode: undefined,
      isPremium: undefined,
    });
  });

  test("returns null for malformed stringified user payload", () => {
    const originalWarn = console.warn;
    console.warn = mock(() => {});

    try {
      const rawInitData = [
        "query_id=aa",
        `user=${encodeURIComponent("{bad-json")}`,
        "hash=hash",
      ].join("&");

      expect(parseTelegramIdentityFromInitData(rawInitData)).toBeNull();
    } finally {
      console.warn = originalWarn;
    }
  });

  test("returns null when Telegram user id is missing", () => {
    const rawInitData = [
      "query_id=aa",
      `user=${encodeURIComponent(
        JSON.stringify({
          first_name: "No",
          username: "missing_id",
        })
      )}`,
      "hash=hash",
    ].join("&");

    expect(parseTelegramIdentityFromInitData(rawInitData)).toBeNull();
  });
});

describe("parseUserFromInitData", () => {
  test("reuses Telegram identity parser output", () => {
    const rawInitData = [
      "query_id=aa",
      `user=${encodeURIComponent(
        JSON.stringify({
          id: 10101010,
          first_name: "Grace",
          last_name: "Hopper",
          username: "grace",
          language_code: "en",
          is_premium: false,
        })
      )}`,
      "hash=hash",
    ].join("&");

    expect(parseUserFromInitData(rawInitData)).toEqual({
      telegramId: "10101010",
      firstName: "Grace",
      lastName: "Hopper",
      username: "grace",
      photoUrl: undefined,
      languageCode: "en",
      isPremium: false,
    });
  });
});

describe("parseTelegramAnalyticsContextFromInitData", () => {
  test("extracts raw launch context fields from init data", () => {
    const rawInitData = [
      "query_id=aa",
      `user=${encodeURIComponent(
        JSON.stringify({
          id: 10101010,
          first_name: "Grace",
        })
      )}`,
      "start_param=post_42_campaign_abc",
      "chat_type=channel",
      "chat_instance=99887766",
      "hash=hash",
    ].join("&");

    expect(parseTelegramAnalyticsContextFromInitData(rawInitData)).toEqual({
      identity: {
        telegramId: "10101010",
        firstName: "Grace",
        lastName: undefined,
        username: undefined,
        photoUrl: undefined,
        languageCode: undefined,
        isPremium: undefined,
      },
      launchContext: {
        startParamRaw: "post_42_campaign_abc",
        chatType: "channel",
        chatInstance: "99887766",
      },
    });
  });

  test("returns undefined launch fields when they are missing", () => {
    const rawInitData = [
      "query_id=aa",
      `user=${encodeURIComponent(
        JSON.stringify({
          id: 4242,
          first_name: "User",
        })
      )}`,
      "hash=hash",
    ].join("&");

    expect(parseTelegramAnalyticsContextFromInitData(rawInitData)).toEqual({
      identity: {
        telegramId: "4242",
        firstName: "User",
        lastName: undefined,
        username: undefined,
        photoUrl: undefined,
        languageCode: undefined,
        isPremium: undefined,
      },
      launchContext: {
        startParamRaw: undefined,
        chatType: undefined,
        chatInstance: undefined,
      },
    });
  });
});
