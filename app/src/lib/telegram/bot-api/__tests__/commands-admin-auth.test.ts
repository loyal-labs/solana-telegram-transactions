import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { CommandContext, Context } from "grammy";

import type { Community } from "@/lib/core/schema";

mock.module("server-only", () => ({}));

let mockDb: {
  query: {
    admins: { findFirst: () => Promise<{ id: string } | null> };
    communities: { findFirst: () => Promise<Community | null> };
  };
  insert: () => {
    values: (values: Record<string, unknown>) => Promise<void>;
  };
  update: () => {
    set: (values: Record<string, unknown>) => {
      where: () => Promise<void>;
    };
  };
};

let getChatCalls = 0;
let evictCalls: Array<bigint | number | string> = [];
let autoCleanupReplyTexts: string[] = [];

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

mock.module("../message-handlers", () => ({
  evictActiveCommunityCache: (chatId: bigint | number | string) => {
    evictCalls.push(chatId);
  },
}));

mock.module("../helper-message-cleanup", () => ({
  replyWithAutoCleanup: async (
    ctx: CommandContext<Context>,
    text: string,
    options?: unknown
  ) => {
    autoCleanupReplyTexts.push(text);
    await ctx.reply(text, options as never);
  },
}));

let handleActivateCommunityCommand: (
  ctx: CommandContext<Context>
) => Promise<void>;
let handleDeactivateCommunityCommand: (
  ctx: CommandContext<Context>
) => Promise<void>;
let handleHideCommunityCommand: (ctx: CommandContext<Context>) => Promise<void>;
let handleUnhideCommunityCommand: (
  ctx: CommandContext<Context>
) => Promise<void>;

let adminResult: { id: string } | null;
let communityResult: Community | null;
let insertValuesCaptured: Array<Record<string, unknown>>;
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
    handleActivateCommunityCommand =
      loadedModule.handleActivateCommunityCommand;
    handleDeactivateCommunityCommand =
      loadedModule.handleDeactivateCommunityCommand;
    handleHideCommunityCommand = loadedModule.handleHideCommunityCommand;
    handleUnhideCommunityCommand = loadedModule.handleUnhideCommunityCommand;
  });

  beforeEach(() => {
    adminResult = null;
    communityResult = null;
    getChatCalls = 0;
    evictCalls = [];
    autoCleanupReplyTexts = [];
    insertValuesCaptured = [];
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
      insert: () => ({
        values: async (values: Record<string, unknown>) => {
          insertValuesCaptured.push(values);
        },
      }),
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
    expect(replyCalls).toContain(
      "Community is already activated. Data updated!"
    );
    expect(autoCleanupReplyTexts).toContain(
      "Community is already activated. Data updated!"
    );
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

  test("activate creates new community as hidden by default", async () => {
    adminResult = { id: "admin-1" };
    communityResult = null;
    const { ctx, replyCalls } = createCommandContext();

    await handleActivateCommunityCommand(ctx);

    expect(getChatCalls).toBe(1);
    expect(updateValuesCaptured).toHaveLength(0);
    expect(insertValuesCaptured).toHaveLength(1);
    expect(insertValuesCaptured[0]?.isPublic).toBe(false);
    expect(replyCalls).toContain("Community activated for message tracking!");
  });

  test("deactivate succeeds for whitelisted user without requiring Telegram chat-admin check", async () => {
    adminResult = { id: "admin-1" };
    communityResult = createCommunity({ isActive: true });
    const { ctx, replyCalls } = createCommandContext();

    await handleDeactivateCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(1);
    expect(updateValuesCaptured[0]?.isActive).toBe(false);
    expect(updateValuesCaptured[0]?.updatedAt).toBeInstanceOf(Date);
    expect(evictCalls).toEqual([BigInt(ctx.chat.id)]);
    expect(replyCalls).toContain(
      "Community deactivated. Message tracking has been disabled."
    );
  });

  test("deactivate rejects non-whitelisted user", async () => {
    adminResult = null;
    const { ctx, replyCalls } = createCommandContext();

    await handleDeactivateCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(0);
    expect(evictCalls).toHaveLength(0);
    expect(replyCalls).toEqual([
      "You are not authorized to deactivate communities. Contact an administrator to be added to the whitelist.",
    ]);
  });

  test("hide succeeds for whitelisted user and sets isPublic to false", async () => {
    adminResult = { id: "admin-1" };
    communityResult = createCommunity({ isActive: true, isPublic: true });
    const { ctx, replyCalls } = createCommandContext();

    await handleHideCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(1);
    expect(updateValuesCaptured[0]?.isPublic).toBe(false);
    expect(updateValuesCaptured[0]?.updatedAt).toBeInstanceOf(Date);
    expect(replyCalls).toEqual(["Community hidden from public summaries."]);
  });

  test("unhide succeeds for whitelisted user and sets isPublic to true", async () => {
    adminResult = { id: "admin-1" };
    communityResult = createCommunity({ isActive: true, isPublic: false });
    const { ctx, replyCalls } = createCommandContext();

    await handleUnhideCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(1);
    expect(updateValuesCaptured[0]?.isPublic).toBe(true);
    expect(updateValuesCaptured[0]?.updatedAt).toBeInstanceOf(Date);
    expect(replyCalls).toEqual([
      "Community is now visible in public summaries.",
    ]);
  });

  test("hide rejects non-whitelisted user", async () => {
    adminResult = null;
    communityResult = createCommunity({ isActive: true, isPublic: true });
    const { ctx, replyCalls } = createCommandContext();

    await handleHideCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(0);
    expect(replyCalls).toEqual([
      "You are not authorized to manage community visibility. Contact an administrator to be added to the whitelist.",
    ]);
  });

  test("unhide rejects non-whitelisted user", async () => {
    adminResult = null;
    communityResult = createCommunity({ isActive: true, isPublic: false });
    const { ctx, replyCalls } = createCommandContext();

    await handleUnhideCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(0);
    expect(replyCalls).toEqual([
      "You are not authorized to manage community visibility. Contact an administrator to be added to the whitelist.",
    ]);
  });

  test("hide notifies when community is not activated yet (missing row)", async () => {
    adminResult = { id: "admin-1" };
    communityResult = null;
    const { ctx, replyCalls } = createCommandContext();

    await handleHideCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(0);
    expect(replyCalls).toEqual([
      "This community is not activated yet. Use /activate_community to enable it.",
    ]);
  });

  test("unhide notifies when community is not activated yet (inactive row)", async () => {
    adminResult = { id: "admin-1" };
    communityResult = createCommunity({ isActive: false, isPublic: false });
    const { ctx, replyCalls } = createCommandContext();

    await handleUnhideCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(0);
    expect(replyCalls).toEqual([
      "This community is not activated yet. Use /activate_community to enable it.",
    ]);
  });

  test("hide is idempotent when community is already hidden", async () => {
    adminResult = { id: "admin-1" };
    communityResult = createCommunity({ isActive: true, isPublic: false });
    const { ctx, replyCalls } = createCommandContext();

    await handleHideCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(0);
    expect(replyCalls).toEqual(["This community is already hidden."]);
  });

  test("unhide is idempotent when community is already visible", async () => {
    adminResult = { id: "admin-1" };
    communityResult = createCommunity({ isActive: true, isPublic: true });
    const { ctx, replyCalls } = createCommandContext();

    await handleUnhideCommunityCommand(ctx);

    expect(updateValuesCaptured).toHaveLength(0);
    expect(replyCalls).toEqual(["This community is already visible."]);
  });
});
