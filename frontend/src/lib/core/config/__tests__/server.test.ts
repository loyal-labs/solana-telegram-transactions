import { beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

let createServerEnv: typeof import("../server").createServerEnv;

describe("server config", () => {
  beforeAll(async () => {
    process.env.PHALA_API_KEY = "bootstrap-key";
    ({ createServerEnv } = await import("../server"));
    delete process.env.PHALA_API_KEY;
  });

  test("uses prod as the default app environment", () => {
    expect(
      createServerEnv({ PHALA_API_KEY: "server-key" }).appEnvironment
    ).toBe("prod");
  });

  test("accepts valid app environment values", () => {
    const env = createServerEnv({
      NEXT_PUBLIC_APP_ENVIRONMENT: "dev",
      PHALA_API_KEY: "server-key",
    });

    expect(env.appEnvironment).toBe("dev");
  });

  test("falls back to prod for invalid app environment values", () => {
    const env = createServerEnv({
      NEXT_PUBLIC_APP_ENVIRONMENT: "qa",
      PHALA_API_KEY: "server-key",
    });

    expect(env.appEnvironment).toBe("prod");
  });

  test("throws when the required Phala API key is missing", () => {
    expect(() => createServerEnv({})).toThrow("PHALA_API_KEY is not set");
  });

  test("returns a centralized chat runtime config", () => {
    const env = createServerEnv({
      PHALA_API_KEY: "  phala-key  ",
      PHALA_MODEL_ID: "  loyal-model  ",
    });

    expect(env.chatRuntime).toEqual({
      apiKey: "phala-key",
      modelId: "loyal-model",
    });
  });
});
