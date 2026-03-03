import { describe, expect, test } from "bun:test";

import {
  DEFAULT_ACCOUNT_KEY,
  DEFAULT_STORAGE_DIR,
  loadUserbotConfig,
} from "../lib/env";

describe("loadUserbotConfig", () => {
  test("throws deterministic error when TELEGRAM_USERBOT_API_ID is missing", () => {
    expect(() =>
      loadUserbotConfig({
        TELEGRAM_USERBOT_API_HASH: "hash",
      })
    ).toThrow("TELEGRAM_USERBOT_API_ID is not set");
  });

  test("throws deterministic error when TELEGRAM_USERBOT_API_HASH is missing", () => {
    expect(() =>
      loadUserbotConfig({
        TELEGRAM_USERBOT_API_ID: "123",
      })
    ).toThrow("TELEGRAM_USERBOT_API_HASH is not set");
  });

  test("applies defaults for account key and storage dir", () => {
    const config = loadUserbotConfig({
      TELEGRAM_USERBOT_API_HASH: "hash",
      TELEGRAM_USERBOT_API_ID: "123",
    });

    expect(config.accountKey).toBe(DEFAULT_ACCOUNT_KEY);
    expect(config.storageDir).toBe(DEFAULT_STORAGE_DIR);
  });

  test("parses explicit account key and storage dir", () => {
    const config = loadUserbotConfig({
      TELEGRAM_USERBOT_ACCOUNT_KEY: "ops_userbot",
      TELEGRAM_USERBOT_API_HASH: "hash",
      TELEGRAM_USERBOT_API_ID: "123",
      USERBOT_STORAGE_DIR: "./.data/userbot",
    });

    expect(config.accountKey).toBe("ops_userbot");
    expect(config.storageDir.endsWith("/.data/userbot")).toBe(true);
  });
});
