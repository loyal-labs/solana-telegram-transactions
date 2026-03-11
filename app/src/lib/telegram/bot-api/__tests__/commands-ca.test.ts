import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { Bot, CommandContext, Context } from "grammy";

mock.module("server-only", () => ({}));

const fetchTokenMetricsByMintMock = mock(async () => ({
  fdvUsd: 3341945.8167783576,
  holderCount: 1572,
  liquidityUsd: 402595.3191460919,
  marketCapUsd: 2029828.3193513064,
  priceUsd: 0.1624529794720929,
  updatedAt: "2026-03-10T21:57:59.390765983Z",
}));

mock.module("@/lib/jupiter/server", () => ({
  fetchTokenMetricsByMint: fetchTokenMetricsByMintMock,
}));

mock.module("mixpanel", () => ({
  default: {
    init: () => ({
      track: (
        _eventName: string,
        _properties: Record<string, unknown>,
        callback?: (error?: unknown) => void
      ) => {
        callback?.();
      },
    }),
  },
}));

mock.module("@/lib/core/database", () => ({
  getDatabase: () => ({}),
}));

mock.module("@/lib/telegram/community-photo-service", () => ({
  captureCommunityPhotoToCdn: async () => null,
}));

mock.module("@/lib/telegram/user-service", () => ({
  getOrCreateUser: async () => "user-1",
}));

mock.module("../message-handlers", () => ({
  evictActiveCommunityCache: () => {},
}));

mock.module("../notification-settings", () => ({
  sendNotificationSettingsMessage: async () => {},
}));

mock.module("../start-carousel", () => ({
  sendStartCarousel: async () => {},
}));

mock.module("../summaries", () => ({
  sendLatestSummary: async () => ({ sent: true as const }),
}));

mock.module("../helper-message-cleanup", () => ({
  replyWithAutoCleanup: async () => {},
}));

let handleCaCommand: typeof import("../commands").handleCaCommand;

function createContext(chatId: number | undefined = -1002981429221) {
  return {
    chat:
      chatId === undefined
        ? undefined
        : {
            id: chatId,
            type: "supergroup",
          },
  } as unknown as CommandContext<Context>;
}

function createBot() {
  const sendMessage = mock(async () => ({}));

  return {
    bot: {
      api: {
        sendMessage,
      },
    } as unknown as Bot,
    sendMessage,
  };
}

describe("/ca command", () => {
  beforeAll(async () => {
    ({ handleCaCommand } = await import("../commands"));
  });

  beforeEach(() => {
    fetchTokenMetricsByMintMock.mockReset();
    fetchTokenMetricsByMintMock.mockImplementation(async () => ({
      fdvUsd: 3341945.8167783576,
      holderCount: 1572,
      liquidityUsd: 402595.3191460919,
      marketCapUsd: 2029828.3193513064,
      priceUsd: 0.1624529794720929,
      updatedAt: "2026-03-10T21:57:59.390765983Z",
    }));
  });

  test("sends the CA message with Jupiter token metrics", async () => {
    const ctx = createContext();
    const { bot, sendMessage } = createBot();

    await handleCaCommand(ctx, bot);

    expect(fetchTokenMetricsByMintMock).toHaveBeenCalledWith(
      "LYLikzBQtpa9ZgVrJsqYGQpR3cC1WMJrBHaXGrQmeta"
    );
    expect(sendMessage).toHaveBeenCalledTimes(1);
    const [chatId, text, options] = sendMessage.mock.calls[0] ?? [];

    expect(chatId).toBe(-1002981429221);
    expect(text).toContain("Price: **$0.162**");
    expect(text).toContain("Market cap: **$2,029,828.319**");
    expect(text).toContain("FDV: **$3,341,945.817**");
    expect(text).toContain("Holders: **1,572**");
    expect(text).toContain("Liquidity: **$402,595.319**");
    expect(text).toContain("Updated: **2026-03-10 21:57:59**");
    expect(options).toEqual(
      expect.objectContaining({
        parse_mode: "Markdown",
      })
    );
  });

  test("falls back to N/A values when Jupiter lookup fails", async () => {
    fetchTokenMetricsByMintMock.mockImplementation(async () => {
      throw new Error("Jupiter unavailable");
    });
    const ctx = createContext();
    const { bot, sendMessage } = createBot();
    const consoleErrorMock = mock(() => undefined);
    const previousConsoleError = console.error;
    console.error = consoleErrorMock;

    try {
      await handleCaCommand(ctx, bot);
    } finally {
      console.error = previousConsoleError;
    }

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const [chatId, text] = sendMessage.mock.calls[0] ?? [];

    expect(chatId).toBe(-1002981429221);
    expect(text).toContain("Price: **N/A**");
    expect(text).toContain("Market cap: **N/A**");
    expect(text).toContain("Updated: **N/A**");
    expect(consoleErrorMock).toHaveBeenCalledTimes(1);
  });

  test("does nothing outside the designated CA chat", async () => {
    const ctx = createContext(-1001234567890);
    const { bot, sendMessage } = createBot();

    await handleCaCommand(ctx, bot);

    expect(fetchTokenMetricsByMintMock).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
