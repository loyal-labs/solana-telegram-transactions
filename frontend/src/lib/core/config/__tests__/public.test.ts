import { describe, expect, test } from "bun:test";

import { createPublicEnv } from "../public";

describe("public config", () => {
  test("uses prod as the default app environment", () => {
    const env = createPublicEnv({});

    expect(env.appEnvironment).toBe("prod");
    expect(env.turnstile).toEqual({
      mode: "misconfigured",
      reason:
        "Turnstile is enabled for prod, but NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set.",
    });
  });

  test("accepts valid app environment values", () => {
    const env = createPublicEnv({
      NEXT_PUBLIC_APP_ENVIRONMENT: "local",
    });

    expect(env.appEnvironment).toBe("local");
    expect(env.turnstile).toEqual({
      mode: "bypass",
      verificationToken: "local-bypass",
    });
  });

  test("falls back to prod for invalid app environment values", () => {
    const env = createPublicEnv({
      NEXT_PUBLIC_APP_ENVIRONMENT: "staging",
    });

    expect(env.appEnvironment).toBe("prod");
    expect(env.turnstile.mode).toBe("misconfigured");
  });

  test("returns a widget turnstile configuration outside local when configured", () => {
    const env = createPublicEnv({
      NEXT_PUBLIC_APP_ENVIRONMENT: "dev",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "  site-key  ",
    });

    expect(env.turnstile).toEqual({
      mode: "widget",
      siteKey: "site-key",
    });
  });

  test("returns trimmed grid auth base url when set", () => {
    const env = createPublicEnv({
      NEXT_PUBLIC_GRID_AUTH_BASE_URL: "  https://auth.askloyal.com  ",
    });

    expect(env.gridAuthBaseUrl).toBe("https://auth.askloyal.com");
  });

  test("returns the default solana rpc endpoint", () => {
    expect(createPublicEnv({}).solanaRpcEndpoint).toBe(
      "https://api.mainnet-beta.solana.com"
    );
  });

  test("returns a trimmed custom solana rpc endpoint", () => {
    const env = createPublicEnv({
      NEXT_PUBLIC_SOLANA_RPC_ENDPOINT: "  https://rpc.example.com  ",
    });

    expect(env.solanaRpcEndpoint).toBe("https://rpc.example.com");
  });

  test("enables swap when the jupiter api key is configured", () => {
    const env = createPublicEnv({
      NEXT_PUBLIC_JUPITER_API_KEY: "  jupiter-key  ",
    });

    expect(env.swap).toEqual({
      mode: "enabled",
      apiKey: "jupiter-key",
    });
  });

  test("disables swap gracefully when the jupiter api key is missing", () => {
    expect(createPublicEnv({}).swap).toEqual({
      mode: "disabled",
      reason:
        "NEXT_PUBLIC_JUPITER_API_KEY is not set. Swap quotes are unavailable in this environment.",
    });
  });

  test("keeps skills enabled by default", () => {
    expect(createPublicEnv({}).skillsEnabled).toBe(true);
  });

  test("uses strict true semantics for client booleans", () => {
    const env = createPublicEnv({
      NEXT_PUBLIC_SKILLS_ENABLED: "false",
      NEXT_PUBLIC_DEMO_RECIPE: "true",
    });

    expect(env.skillsEnabled).toBe(false);
    expect(env.demoRecipeEnabled).toBe(true);
    expect(
      createPublicEnv({ NEXT_PUBLIC_DEMO_RECIPE: "TRUE" }).demoRecipeEnabled
    ).toBe(false);
  });
});
