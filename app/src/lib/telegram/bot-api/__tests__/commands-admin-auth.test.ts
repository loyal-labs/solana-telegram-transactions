import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { CommandContext, Context } from "grammy";

import type { Community } from "@/lib/core/schema";

mock.module("server-only", () => ({}));

let mockDb: {
  query: {
    admins: { findFirst: () => Promise<{ id: string } | null> };
    communities: { findFirst: () => Promise<Community | null> };
  };
  update: () => {
    set: (values: Record<string, unknown>) => {
      where: () => Promise<void>;
    };
  };
};

let getChatCalls = 0;

mock.module("@/lib/core/database", () => ({
  getDatabase: () => mockDb,
}));

mock.module("../get-chat", () => ({
  getChat: async () => {
    getChatCalls += 1;
    return {};
  },
}));

mock.module("../get-file", () => ({
  downloadTelegramFile: async () => ({
    body: Buffer.from(""),
    contentType: "image/jpeg",
  }),
}));

mock.module("@/lib/telegram/user-service", () => ({
  getOrCreateUser: async () => "user-1",
}));

let handleActivateCommunityCommand: (
  ctx: CommandContext<Context>
) => Promise<void>;
let handleDeactivateCommunityCommand: (
  ctx: CommandContext<Context>
) => Promise<void>;

let adminResult: { id: string } | null;
let communityResult: Community | null;
let updateValuesCaptured: Array<Record<string, unknown>>;

function createCommunity(overrides?: Partial<Community>): Community {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    chatId: BigInt("-1009876543210"),
    chatTitle: "Test Community",
    activatedBy: BigInt("123456789"),
    isActive: true,
    summaryNotificationsEnabled: true,
    summaryNotificationTimeHours: 24,
    summaryNotificationMessageCount: null,
    isPublic: true,
    settings: {},
    activatedAt: new Date("2026-02-12T00:00:00.000Z"),
    updatedAt: new Date("2026-02-12T00:00:00.000Z"),
    ...overrides,
  };
}

function createCommandContext() {
  const replyCalls: string[] = [];

  const ctx = {
    chat: {
      id: -1009876543210,
      title: "Test Community",
      type: "supergroup",
    },
    deleteMessage: async () => true as const,
    from: {
      first_name: "Admin",
      id: 777,
      username: "admin_user",
    },
    reply: async (text: string) => {
      replyCalls.push(text);
      return {} as never;
    },
  } as unknown as CommandContext<Context>;

  return { ctx, replyCalls };
}

describe("commands admin authorization", () => {
  beforeAll(async () => {
    const loadedModule = await import("../commands");
    handleActivateCommunityCommand = loadedModule.handleActivateCommunityCommand;
    handleDeactivateCommunityCommand = loadedModule.handleDeactivateCommunityCommand;
  });

  beforeEach(() => {
    adminResult = null;
    communityResult = null;
    getChatCalls = 0;
    updateValuesCaptured = [];

    mockDb = {
      query: {
        admins: {
          findFirst: async () => adminResult,
        },
        communities: {
          findFirst: async () => communityResult,
        },
      },
      update: () => ({
        set: (values: Record<string, unknown>) => {
          updateValuesCaptured.push(values);
          return {
            where: async () => {},
          };
        },
      }),
    };
  });

  test("activate succeeds for whitelisted user without requiring Telegram chat-admin check", async () => {
    adminResult = { id: "admin-1" };
    communityResult = createCommunity({ isActive: true });
    const { ctx, replyCalls } = createCommandContext();

    await handleActivateCommunityCommand(ctx);

    expect(getChatCalls).toBe(1);
    expect(updateValuesCaptured).toHaveLength(1);
    expect(updateValuesCaptured[0]?.updatedAt).toBeInstanceOf(Date);
    expect(replyCalls).toContain("Community is already activated. Data updated!");
  });

  test("activate rejects non-whitelisted user", async () => {
    adminResult = null;
    const { ctx, replyCalls } = createCommandContext();

    await handleActivateCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(0);
    expect(replyCalls).toEqual([
      "You are not authorized to activate communities. Contact an administrator to be added to the whitelist.",
    ]);
  });

  test("deactivate succeeds for whitelisted user without requiring Telegram chat-admin check", async () => {
    adminResult = { id: "admin-1" };
    communityResult = createCommunity({ isActive: true });
    const { ctx, replyCalls } = createCommandContext();

    await handleDeactivateCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(1);
    expect(updateValuesCaptured[0]?.isActive).toBe(false);
    expect(updateValuesCaptured[0]?.updatedAt).toBeInstanceOf(Date);
    expect(replyCalls).toContain(
      "Community deactivated. Message tracking has been disabled."
    );
  });

  test("deactivate rejects non-whitelisted user", async () => {
    adminResult = null;
    const { ctx, replyCalls } = createCommandContext();

    await handleDeactivateCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(0);
    expect(replyCalls).toEqual([
      "You are not authorized to deactivate communities. Contact an administrator to be added to the whitelist.",
    ]);
  });
});
