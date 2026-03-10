import { describe, expect, test } from "bun:test";

import { parsePasskeyServerConfig } from "@/lib/core/config/schema";

describe("parsePasskeyServerConfig", () => {
  test("applies defaults for grid environment, base url, app name, and localhost", () => {
    const config = parsePasskeyServerConfig({
      PASSKEY_ALLOWED_PARENT_DOMAIN: "askloyal.com",
      NEXT_PUBLIC_PASSKEY_RP_ID: "askloyal.com",
    });

    expect(config.gridEnvironment).toBe("sandbox");
    expect(config.gridApiBaseUrl).toBe("https://grid.squads.xyz");
    expect(config.appName).toBe("askloyal");
    expect(config.allowedParentDomain).toBe("askloyal.com");
    expect(config.sharedRpId).toBe("askloyal.com");
    expect(config.allowLocalhost).toBe(true);
  });

  test("supports disabling localhost explicitly", () => {
    const config = parsePasskeyServerConfig({
      PASSKEY_ALLOWED_PARENT_DOMAIN: "askloyal.com",
      PASSKEY_ALLOW_LOCALHOST: "false",
      NEXT_PUBLIC_PASSKEY_RP_ID: "askloyal.com",
    });

    expect(config.allowLocalhost).toBe(false);
  });

  test("fails fast when parent domain is missing", () => {
    expect(() => parsePasskeyServerConfig({})).toThrow();
  });

  test("rejects invalid parent domain values", () => {
    expect(() =>
      parsePasskeyServerConfig({
        PASSKEY_ALLOWED_PARENT_DOMAIN: "https://askloyal.com",
        NEXT_PUBLIC_PASSKEY_RP_ID: "askloyal.com",
      })
    ).toThrow();
  });

  test("rejects RP IDs that do not match the allowed parent domain", () => {
    expect(() =>
      parsePasskeyServerConfig({
        PASSKEY_ALLOWED_PARENT_DOMAIN: "askloyal.com",
        NEXT_PUBLIC_PASSKEY_RP_ID: "example.com",
      })
    ).toThrow();
  });
});
