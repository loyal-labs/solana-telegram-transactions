import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

mock.module("server-only", () => ({}));

const CDN_ENV_KEYS = [
  "CLOUDFLARE_CDN_BASE_URL",
  "NEXT_PUBLIC_CLOUDFLARE_CDN_BASE_URL",
  "CLOUDFLARE_R2_PUBLIC_DEV_URL",
  "NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DEV_URL",
] as const;

function clearCdnEnv(): void {
  for (const key of CDN_ENV_KEYS) {
    delete process.env[key];
  }
}

let createCloudflareCdnUrlClient: (config: {
  baseUrl: string;
  keyPrefix?: string;
  defaultQuery?: Record<string, string | number | boolean | null | undefined>;
}) => {
  resolveUrl: (input: {
    key: string;
    query?: Record<string, string | number | boolean | null | undefined>;
  }) => string;
  resolveUrls: (
    keys: string[],
    options?: {
      query?: Record<string, string | number | boolean | null | undefined>;
    }
  ) => string[];
};
let getCloudflareCdnBaseUrlFromEnv: () => string | null;

describe("cdn-url", () => {
  beforeAll(async () => {
    const loadedModule = await import("../cdn-url");
    createCloudflareCdnUrlClient = loadedModule.createCloudflareCdnUrlClient;
    getCloudflareCdnBaseUrlFromEnv = loadedModule.getCloudflareCdnBaseUrlFromEnv;
  });

  beforeEach(() => {
    clearCdnEnv();
  });

  afterEach(() => {
    clearCdnEnv();
  });

  test("resolves URL with prefix and query params", () => {
    const client = createCloudflareCdnUrlClient({
      baseUrl: "https://cdn.example.com/assets/",
      keyPrefix: "telegram/photos/",
      defaultQuery: { fit: "cover", width: 600 },
    });

    const url = client.resolveUrl({
      key: "/group 1/avatar#1.png",
      query: { width: 1200, quality: 80 },
    });

    expect(url).toBe(
      "https://cdn.example.com/assets/telegram/photos/group%201/avatar%231.png?fit=cover&width=1200&quality=80"
    );
  });

  test("resolves multiple keys consistently", () => {
    const client = createCloudflareCdnUrlClient({
      baseUrl: "https://cdn.example.com",
      keyPrefix: "uploads",
    });

    const urls = client.resolveUrls(["a.png", "b/c.png"], {
      query: { v: "1" },
    });

    expect(urls).toEqual([
      "https://cdn.example.com/uploads/a.png?v=1",
      "https://cdn.example.com/uploads/b/c.png?v=1",
    ]);
  });

  test("rejects unsafe path segments", () => {
    const client = createCloudflareCdnUrlClient({
      baseUrl: "https://cdn.example.com",
    });

    expect(() => client.resolveUrl({ key: "avatars/../admin.png" })).toThrow(
      "CDN key contains an invalid path segment"
    );
  });

  test("selects CDN base URL from env in documented priority order", () => {
    process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DEV_URL =
      "https://pub-last.r2.dev";
    process.env.CLOUDFLARE_R2_PUBLIC_DEV_URL = "https://pub-third.r2.dev";
    process.env.NEXT_PUBLIC_CLOUDFLARE_CDN_BASE_URL =
      "https://cdn-second.example.com";
    process.env.CLOUDFLARE_CDN_BASE_URL = "https://cdn-first.example.com";

    expect(getCloudflareCdnBaseUrlFromEnv()).toBe("https://cdn-first.example.com");
  });

  test("returns null when no CDN base URL env var is set", () => {
    expect(getCloudflareCdnBaseUrlFromEnv()).toBeNull();
  });
});
