import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { publicEnv } from "../public";

const PUBLIC_ENV_KEYS = [
  "NEXT_PUBLIC_SERVER_HOST",
  "NEXT_PUBLIC_TELEGRAM_BOT_ID",
  "NEXT_PUBLIC_SOLANA_ENV",
  "NEXT_PUBLIC_GAS_PUBLIC_KEY",
  "NEXT_PUBLIC_USE_MOCK_SUMMARIES",
] as const;

function clearPublicEnv(): void {
  for (const key of PUBLIC_ENV_KEYS) {
    delete process.env[key];
  }
}

describe("public config", () => {
  beforeEach(() => {
    clearPublicEnv();
  });

  afterEach(() => {
    clearPublicEnv();
  });

  test("returns trimmed optional values", () => {
    process.env.NEXT_PUBLIC_SERVER_HOST = "  https://example.com  ";
    process.env.NEXT_PUBLIC_GAS_PUBLIC_KEY = "  gas-key  ";

    expect(publicEnv.serverHost).toBe("https://example.com");
    expect(publicEnv.gasPublicKey).toBe("gas-key");
  });

  test("returns empty telegram bot id by default", () => {
    expect(publicEnv.telegramBotId).toBe("");
  });

  test("returns trimmed telegram bot id when set", () => {
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID = "  bot-id  ";
    expect(publicEnv.telegramBotId).toBe("bot-id");
  });

  test("uses devnet as default solana env", () => {
    expect(publicEnv.solanaEnv).toBe("devnet");
  });

  test("accepts valid solana env values", () => {
    process.env.NEXT_PUBLIC_SOLANA_ENV = "mainnet";
    expect(publicEnv.solanaEnv).toBe("mainnet");
  });

  test("falls back to devnet for invalid solana env values", () => {
    process.env.NEXT_PUBLIC_SOLANA_ENV = "staging";
    expect(publicEnv.solanaEnv).toBe("devnet");
  });

  test("parses boolean values with strict true semantics", () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUMMARIES = "true";
    expect(publicEnv.useMockSummaries).toBe(true);

    process.env.NEXT_PUBLIC_USE_MOCK_SUMMARIES = "TRUE";
    expect(publicEnv.useMockSummaries).toBe(false);
  });
});
