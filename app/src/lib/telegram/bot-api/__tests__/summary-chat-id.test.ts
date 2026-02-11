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

const SUMMARY_OVERRIDE_ENV_KEYS = [
  "TELEGRAM_SUMMARY_PEER_OVERRIDE_FROM",
  "TELEGRAM_SUMMARY_PEER_OVERRIDE_TO",
] as const;

function clearSummaryOverrideEnv(): void {
  for (const key of SUMMARY_OVERRIDE_ENV_KEYS) {
    delete process.env[key];
  }
}

let resolveSummaryCommunityPeerId: (requestPeerId: bigint) => bigint;

describe("resolveSummaryCommunityPeerId", () => {
  beforeAll(async () => {
    const loadedModule = await import("../summary-chat-id");
    resolveSummaryCommunityPeerId = loadedModule.resolveSummaryCommunityPeerId;
  });

  beforeEach(() => {
    clearSummaryOverrideEnv();
  });

  afterEach(() => {
    clearSummaryOverrideEnv();
  });

  test("returns request peer ID when override is not configured", () => {
    expect(resolveSummaryCommunityPeerId(BigInt("4864680368"))).toBe(
      BigInt("4864680368")
    );
  });

  test("returns override target peer ID when request peer matches configured source", () => {
    process.env.TELEGRAM_SUMMARY_PEER_OVERRIDE_FROM = "4864680368";
    process.env.TELEGRAM_SUMMARY_PEER_OVERRIDE_TO = "-1002981429221";

    expect(resolveSummaryCommunityPeerId(BigInt("4864680368"))).toBe(
      BigInt("-1002981429221")
    );
  });

  test("returns request peer ID when request peer does not match configured source", () => {
    process.env.TELEGRAM_SUMMARY_PEER_OVERRIDE_FROM = "4864680368";
    process.env.TELEGRAM_SUMMARY_PEER_OVERRIDE_TO = "-1002981429221";

    expect(resolveSummaryCommunityPeerId(BigInt("-1001111111111"))).toBe(
      BigInt("-1001111111111")
    );
  });

  test("throws when summary override configuration is incomplete", () => {
    process.env.TELEGRAM_SUMMARY_PEER_OVERRIDE_FROM = "4864680368";

    expect(() => resolveSummaryCommunityPeerId(BigInt("4864680368"))).toThrow(
      "TELEGRAM_SUMMARY_PEER_OVERRIDE_FROM and TELEGRAM_SUMMARY_PEER_OVERRIDE_TO must both be set"
    );
  });

  test("throws when summary override configuration contains invalid peer IDs", () => {
    process.env.TELEGRAM_SUMMARY_PEER_OVERRIDE_FROM = "invalid";
    process.env.TELEGRAM_SUMMARY_PEER_OVERRIDE_TO = "-1002981429221";

    expect(() => resolveSummaryCommunityPeerId(BigInt("4864680368"))).toThrow(
      "TELEGRAM_SUMMARY_PEER_OVERRIDE_FROM must be a valid integer peer ID"
    );
  });
});
