import { describe, expect, test } from "bun:test";

import { resolveGridServerClientConfig } from "../server";

describe("grid server client config", () => {
  test("normalizes trailing slashes from base urls", () => {
    const config = resolveGridServerClientConfig({
      environment: "sandbox",
      apiKey: "grid-api-key",
      baseUrl: "https://grid.squads.xyz/",
    });

    expect(config).toEqual({
      environment: "sandbox",
      apiKey: "grid-api-key",
      baseUrl: "https://grid.squads.xyz",
    });
  });

  test("keeps config minimal when optional fields are absent", () => {
    const config = resolveGridServerClientConfig({
      environment: "production",
    });

    expect(config).toEqual({
      environment: "production",
    });
  });
});
