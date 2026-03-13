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
      createServerEnv({
        PHALA_API_KEY: "server-key",
        DATABASE_URL: "postgresql://localhost/test",
      }).appEnvironment
    ).toBe("prod");
  });

  test("accepts valid app environment values", () => {
    const env = createServerEnv({
      NEXT_PUBLIC_APP_ENVIRONMENT: "dev",
      PHALA_API_KEY: "server-key",
      DATABASE_URL: "postgresql://localhost/test",
    });

    expect(env.appEnvironment).toBe("dev");
  });

  test("falls back to prod for invalid app environment values", () => {
    const env = createServerEnv({
      NEXT_PUBLIC_APP_ENVIRONMENT: "qa",
      PHALA_API_KEY: "server-key",
      DATABASE_URL: "postgresql://localhost/test",
    });

    expect(env.appEnvironment).toBe("prod");
  });

  test("throws when a required server env var is missing", () => {
    expect(() =>
      createServerEnv({ DATABASE_URL: "postgresql://localhost/test" })
    ).toThrow("PHALA_API_KEY is not set");

    expect(() => createServerEnv({ PHALA_API_KEY: "server-key" })).toThrow(
      "DATABASE_URL is not set"
    );
  });

  test("returns a centralized chat runtime config", () => {
    const env = createServerEnv({
      PHALA_API_KEY: "  phala-key  ",
      PHALA_MODEL_ID: "  loyal-model  ",
      DATABASE_URL: "  postgresql://localhost/loyal  ",
      NEXT_PUBLIC_GRID_AUTH_BASE_URL: "  https://auth.askloyal.com  ",
    });

    expect(env.chatRuntime).toEqual({
      apiKey: "phala-key",
      modelId: "loyal-model",
    });
    expect(env.databaseUrl).toBe("postgresql://localhost/loyal");
    expect(env.gridAuthBaseUrl).toBe("https://auth.askloyal.com");
  });
});
