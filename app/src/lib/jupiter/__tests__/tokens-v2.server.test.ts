import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

let fetchTokenMetricsByMint: typeof import("../tokens-v2.server").fetchTokenMetricsByMint;
const originalFetch = globalThis.fetch;

describe("fetchTokenMetricsByMint", () => {
  beforeAll(async () => {
    ({ fetchTokenMetricsByMint } = await import("../tokens-v2.server"));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restore();
  });

  test("returns metrics for the exact mint match", async () => {
    const fetchMock = mock(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe(
        "https://lite-api.jup.ag/tokens/v2/search?query=target-mint"
      );

      return new Response(
        JSON.stringify([
          {
            id: "other-mint",
            mcap: 123,
            name: "Other",
            symbol: "OTR",
            usdPrice: 0.1,
          },
          {
            fdv: 3341945.8167783576,
            holderCount: 1572,
            id: "target-mint",
            liquidity: 402595.3191460919,
            mcap: 2029828.3193513064,
            name: "Loyal",
            symbol: "LOYAL",
            updatedAt: "2026-03-10T21:57:59.390765983Z",
            usdPrice: 0.1624529794720929,
          },
        ]),
        { status: 200 }
      );
    });

    globalThis.fetch = fetchMock as typeof fetch;

    await expect(fetchTokenMetricsByMint("target-mint")).resolves.toEqual({
      fdvUsd: 3341945.8167783576,
      holderCount: 1572,
      liquidityUsd: 402595.3191460919,
      marketCapUsd: 2029828.3193513064,
      priceUsd: 0.1624529794720929,
      updatedAt: "2026-03-10T21:57:59.390765983Z",
    });
  });

  test("throws when the exact mint is missing from search results", async () => {
    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify([
          {
            id: "similar-mint",
            mcap: 1,
            name: "Loyal",
            symbol: "LOYAL",
            usdPrice: 1,
          },
        ]),
        { status: 200 }
      );
    }) as typeof fetch;

    await expect(fetchTokenMetricsByMint("target-mint")).rejects.toThrow(
      "Invalid Jupiter token response."
    );
  });

  test("throws when Jupiter returns a non-OK response", async () => {
    globalThis.fetch = mock(async () => {
      return new Response("bad gateway", { status: 502, statusText: "Bad Gateway" });
    }) as typeof fetch;

    await expect(fetchTokenMetricsByMint("target-mint")).rejects.toThrow(
      "HTTP 502: Bad Gateway"
    );
  });
});
