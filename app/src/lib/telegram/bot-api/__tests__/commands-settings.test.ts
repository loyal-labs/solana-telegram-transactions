import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { CommandContext, Context } from "grammy";

import type { UserSettings } from "@/lib/core/schema";

mock.module("server-only", () => ({}));

let mockDb: {
  insert: () => {
    values: (
      values: Record<string, unknown>
    ) => { onConflictDoNothing: () => Promise<void> };
  };
  query: {
    userSettings: { findFirst: () => Promise<UserSettings | null> };
  };
};

let getOrCreateUserImpl: () => Promise<string> = async () => "user-1";
let userSettingsFindResult: UserSettings | null = null;
let insertValuesCaptured: Array<Record<string, unknown>> = [];

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
  getDatabase: () => mockDb,
}));

mock.module("@/lib/telegram/user-service", () => ({
  getOrCreateUser: async () => getOrCreateUserImpl(),
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

mock.module("../get-chat", () => ({
  getChat: async () => ({}),
}));

mock.module("../get-file", () => ({
  downloadTelegramFile: async () => ({
    body: Buffer.from(""),
    contentType: "image/jpeg",
  }),
}));

let handleSettingsCommand: typeof import("../commands").handleSettingsCommand;

function createUserSettings(overrides?: Partial<UserSettings>): UserSettings {
  return {
    id: "dd54f4c3-3e4d-40d6-8af2-4bf14ee4b7c7",
    userId: "550e8400-e29b-41d4-a716-446655440000",
    model: "phala/gpt-oss-120b",
    notifications: true,
    createdAt: new Date("2026-02-12T00:00:00.000Z"),
    updatedAt: new Date("2026-02-12T00:00:00.000Z"),
    ...overrides,
  };
}

function createPrivateCommandContext() {
  const replyCalls: Array<{ options?: unknown; text: string }> = [];

  const ctx = {
    chat: {
      id: 777,
      type: "private",
    },
    from: {
      first_name: "Test",
      id: 777,
      username: "test_user",
    },
    reply: async (text: string, options?: unknown) => {
      replyCalls.push({ options, text });
      return {} as never;
    },
  } as unknown as CommandContext<Context>;

  return { ctx, replyCalls };
}

function createGroupCommandContext() {
  const replyCalls: Array<{ options?: unknown; text: string }> = [];

  const ctx = {
    chat: {
      id: -1009876543210,
      type: "supergroup",
    },
    from: {
      first_name: "Test",
      id: 777,
      username: "test_user",
    },
    reply: async (text: string, options?: unknown) => {
      replyCalls.push({ options, text });
      return {} as never;
    },
  } as unknown as CommandContext<Context>;

  return { ctx, replyCalls };
}

describe("settings command", () => {
  beforeAll(async () => {
    const loadedModule = await import("../commands");
    handleSettingsCommand = loadedModule.handleSettingsCommand;
  });

  beforeEach(() => {
    insertValuesCaptured = [];
    getOrCreateUserImpl = async () => "550e8400-e29b-41d4-a716-446655440000";
    userSettingsFindResult = createUserSettings();

    mockDb = {
      insert: () => ({
        values: (values: Record<string, unknown>) => {
          insertValuesCaptured.push(values);
          return {
            onConflictDoNothing: async () => {},
          };
        },
      }),
      query: {
        userSettings: {
          findFirst: async () => userSettingsFindResult,
        },
      },
    };
  });

  test("sends user settings panel in private chat and ensures row exists", async () => {
    const { ctx, replyCalls } = createPrivateCommandContext();

    await handleSettingsCommand(ctx);

    expect(insertValuesCaptured).toEqual([
      { userId: "550e8400-e29b-41d4-a716-446655440000" },
    ]);
    expect(replyCalls).toHaveLength(1);
    expect(replyCalls[0]?.text).toContain("Your notification settings");
    expect(replyCalls[0]?.options).toEqual(
      expect.objectContaining({
        parse_mode: "HTML",
      })
    );
  });

  test("replies with error when settings row cannot be loaded", async () => {
    userSettingsFindResult = null;
    const { ctx, replyCalls } = createPrivateCommandContext();

    await handleSettingsCommand(ctx);

    expect(replyCalls).toEqual([
      {
        options: undefined,
        text: "Unable to load your settings right now. Please try again.",
      },
    ]);
  });

  test("does nothing for non-private chats", async () => {
    const { ctx, replyCalls } = createGroupCommandContext();

    await handleSettingsCommand(ctx);

    expect(insertValuesCaptured).toHaveLength(0);
    expect(replyCalls).toHaveLength(0);
  });

  test("replies with error when user resolution fails", async () => {
    getOrCreateUserImpl = async () => {
      throw new Error("user resolution failed");
    };
    const { ctx, replyCalls } = createPrivateCommandContext();
    const consoleErrorMock = mock(() => undefined);
    const previousConsoleError = console.error;
    console.error = consoleErrorMock;

    try {
      await handleSettingsCommand(ctx);
    } finally {
      console.error = previousConsoleError;
    }

    expect(replyCalls).toEqual([
      {
        options: undefined,
        text: "Unable to load your settings right now. Please try again.",
      },
    ]);
    expect(consoleErrorMock).toHaveBeenCalledTimes(1);
  });
});
