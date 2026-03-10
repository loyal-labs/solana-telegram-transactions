import { describe, expect, test } from "bun:test";

import { parsePasskeyServerConfig } from "@/lib/core/config/schema";

describe("parsePasskeyServerConfig", () => {
  test("applies defaults for grid environment, base url, and app name", () => {
    const config = parsePasskeyServerConfig({
      PASSKEY_CUSTOM_DOMAIN_BASE_URL: "https://passkey.example.com/",
    });

    expect(config.gridEnvironment).toBe("sandbox");
    expect(config.gridApiBaseUrl).toBe("https://grid.squads.xyz");
    expect(config.appName).toBe("askloyal");
    expect(config.customDomainBaseUrl).toBe("https://passkey.example.com");
  });

  test("fails fast when custom domain is missing", () => {
    expect(() => parsePasskeyServerConfig({})).toThrow();
  });
});
