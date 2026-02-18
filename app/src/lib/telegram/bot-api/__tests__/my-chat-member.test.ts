import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { Context } from "grammy";

let mockDb: {
  insert: () => {
    values: (values: Record<string, unknown>) => {
      onConflictDoUpdate: (config: {
        set: Record<string, unknown>;
        target: unknown;
      }) => Promise<void>;
    };
  };
  update: () => {
    set: (values: Record<string, unknown>) => {
      where: () => Promise<void>;
    };
  };
};

let evictCalls: Array<bigint | number | string> = [];

let upsertShouldThrow = false;
let removalUpdateShouldThrow = false;
let insertValuesCaptured: Array<Record<string, unknown>>;
let conflictSetCaptured: Array<Record<string, unknown>>;
let conflictTargetCaptured: unknown[] = [];
let removalUpdateValuesCaptured: Array<Record<string, unknown>>;
let removalWhereCalls = 0;

mock.module("@/lib/core/database", () => ({
  getDatabase: () => mockDb,
}));

mock.module("../message-handlers", () => ({
  evictActiveCommunityCache: (chatId: bigint | number | string) => {
    evictCalls.push(chatId);
  },
}));

let handleMyChatMemberUpdate: (ctx: Context) => Promise<void>;

const COMMUNITY_CHAT_ID = -1009876543210;
const ONBOARDING_MESSAGE =
  "Thanks for adding me. Run /activate_community to enable summaries for this community.\nAfter activation, summaries are available in this chat and in the app.\nUse /notifications to set notification cycles.\nUse /hide or /unhide to control public visibility.";

function createContext(options: {
  chatType: "group" | "supergroup" | "channel" | "private";
  newStatus:
    | "administrator"
    | "creator"
    | "kicked"
    | "left"
    | "member"
    | "restricted";
  oldStatus:
    | "administrator"
    | "creator"
    | "kicked"
    | "left"
    | "member"
    | "restricted";
  sendMessageShouldThrow?: boolean;
}) {
  const sendMessageCalls: Array<{ chatId: number | string; text: string }> = [];

  const ctx = {
    api: {
      sendMessage: async (chatId: number | string, text: string) => {
        sendMessageCalls.push({ chatId, text });
        if (options.sendMessageShouldThrow) {
          throw new Error("send failed");
        }
        return {} as never;
      },
    },
    update: {
      my_chat_member: {
        chat: {
          id: COMMUNITY_CHAT_ID,
          title: "New Community Title",
          type: options.chatType,
        },
        from: {
          id: 777,
        },
        new_chat_member: {
          status: options.newStatus,
        },
        old_chat_member: {
          status: options.oldStatus,
        },
      },
    },
  } as unknown as Context;

  return { ctx, sendMessageCalls };
}

describe("my chat member onboarding", () => {
  beforeAll(async () => {
    const loadedModule = await import("../my-chat-member");
    handleMyChatMemberUpdate = loadedModule.handleMyChatMemberUpdate;
  });

  beforeEach(() => {
    upsertShouldThrow = false;
    removalUpdateShouldThrow = false;
    evictCalls = [];
    insertValuesCaptured = [];
    conflictSetCaptured = [];
    conflictTargetCaptured = [];
    removalUpdateValuesCaptured = [];
    removalWhereCalls = 0;

    mockDb = {
      insert: () => ({
        values: (values: Record<string, unknown>) => {
          insertValuesCaptured.push(values);
          return {
            onConflictDoUpdate: async (config) => {
              conflictSetCaptured.push(config.set);
              conflictTargetCaptured.push(config.target);
              if (upsertShouldThrow) {
                throw new Error("upsert failed");
              }
            },
          };
        },
      }),
      update: () => ({
        set: (values: Record<string, unknown>) => {
          removalUpdateValuesCaptured.push(values);
          return {
            where: async () => {
              removalWhereCalls += 1;
              if (removalUpdateShouldThrow) {
                throw new Error("removal update failed");
              }
            },
          };
        },
      }),
    };
  });

  test("upserts inactive hidden community when bot is freshly added", async () => {
    const { ctx, sendMessageCalls } = createContext({
      chatType: "supergroup",
      oldStatus: "left",
      newStatus: "member",
    });

    await handleMyChatMemberUpdate(ctx);

    expect(insertValuesCaptured).toHaveLength(1);
    expect(removalUpdateValuesCaptured).toHaveLength(0);
    expect(insertValuesCaptured[0]?.chatId).toBe(BigInt(COMMUNITY_CHAT_ID));
    expect(insertValuesCaptured[0]?.chatTitle).toBe("New Community Title");
    expect(insertValuesCaptured[0]?.activatedBy).toBe(BigInt(777));
    expect(insertValuesCaptured[0]?.isActive).toBe(false);
    expect(insertValuesCaptured[0]?.isPublic).toBe(false);
    expect(insertValuesCaptured[0]?.updatedAt).toBeInstanceOf(Date);
    expect(conflictSetCaptured).toHaveLength(1);
    expect(conflictSetCaptured[0]?.chatTitle).toBe("New Community Title");
    expect(conflictSetCaptured[0]?.isActive).toBe(false);
    expect(conflictSetCaptured[0]?.isPublic).toBe(false);
    expect(conflictSetCaptured[0]?.updatedAt).toBeInstanceOf(Date);
    expect(conflictTargetCaptured).toHaveLength(1);
    expect(evictCalls).toEqual([BigInt(COMMUNITY_CHAT_ID)]);
    expect(sendMessageCalls).toEqual([
      { chatId: COMMUNITY_CHAT_ID, text: ONBOARDING_MESSAGE },
    ]);
  });

  test("supports channel onboarding with the same upsert behavior", async () => {
    const { ctx, sendMessageCalls } = createContext({
      chatType: "channel",
      oldStatus: "kicked",
      newStatus: "administrator",
    });

    await handleMyChatMemberUpdate(ctx);

    expect(insertValuesCaptured).toHaveLength(1);
    expect(removalUpdateValuesCaptured).toHaveLength(0);
    expect(conflictSetCaptured).toHaveLength(1);
    expect(evictCalls).toEqual([BigInt(COMMUNITY_CHAT_ID)]);
    expect(sendMessageCalls).toHaveLength(1);
  });

  test("ignores non-join status transitions", async () => {
    const { ctx, sendMessageCalls } = createContext({
      chatType: "supergroup",
      oldStatus: "member",
      newStatus: "administrator",
    });

    await handleMyChatMemberUpdate(ctx);

    expect(insertValuesCaptured).toHaveLength(0);
    expect(removalUpdateValuesCaptured).toHaveLength(0);
    expect(conflictSetCaptured).toHaveLength(0);
    expect(evictCalls).toHaveLength(0);
    expect(sendMessageCalls).toHaveLength(0);
  });

  test("ignores unsupported chat types", async () => {
    const { ctx, sendMessageCalls } = createContext({
      chatType: "private",
      oldStatus: "left",
      newStatus: "member",
    });

    await handleMyChatMemberUpdate(ctx);

    expect(insertValuesCaptured).toHaveLength(0);
    expect(removalUpdateValuesCaptured).toHaveLength(0);
    expect(conflictSetCaptured).toHaveLength(0);
    expect(evictCalls).toHaveLength(0);
    expect(sendMessageCalls).toHaveLength(0);
  });

  test("evicts cache and does not crash when upsert fails", async () => {
    upsertShouldThrow = true;
    const { ctx, sendMessageCalls } = createContext({
      chatType: "group",
      oldStatus: "left",
      newStatus: "member",
    });
    const consoleErrorMock = mock(() => undefined);
    const previousConsoleError = console.error;
    console.error = consoleErrorMock;

    try {
      await handleMyChatMemberUpdate(ctx);
    } finally {
      console.error = previousConsoleError;
    }

    expect(insertValuesCaptured).toHaveLength(1);
    expect(removalUpdateValuesCaptured).toHaveLength(0);
    expect(evictCalls).toEqual([BigInt(COMMUNITY_CHAT_ID)]);
    expect(sendMessageCalls).toHaveLength(0);
    expect(consoleErrorMock).toHaveBeenCalledTimes(1);
  });

  test("logs onboarding send failures without reverting upsert intent", async () => {
    const { ctx } = createContext({
      chatType: "group",
      oldStatus: "left",
      newStatus: "member",
      sendMessageShouldThrow: true,
    });
    const consoleErrorMock = mock(() => undefined);
    const previousConsoleError = console.error;
    console.error = consoleErrorMock;

    try {
      await handleMyChatMemberUpdate(ctx);
    } finally {
      console.error = previousConsoleError;
    }

    expect(insertValuesCaptured).toHaveLength(1);
    expect(removalUpdateValuesCaptured).toHaveLength(0);
    expect(conflictSetCaptured).toHaveLength(1);
    expect(evictCalls).toEqual([BigInt(COMMUNITY_CHAT_ID)]);
    expect(consoleErrorMock).toHaveBeenCalledTimes(1);
  });

  test("onboarding message includes activation and visibility commands", async () => {
    const { ctx, sendMessageCalls } = createContext({
      chatType: "group",
      oldStatus: "left",
      newStatus: "member",
    });

    await handleMyChatMemberUpdate(ctx);

    const sentMessage = sendMessageCalls[0]?.text ?? "";
    expect(sentMessage).toContain("/activate_community");
    expect(sentMessage).toContain("/notifications");
    expect(sentMessage).toContain("/hide");
    expect(sentMessage).toContain("/unhide");
  });

  test("handles removal member -> left by deactivating and hiding without onboarding message", async () => {
    const { ctx, sendMessageCalls } = createContext({
      chatType: "supergroup",
      oldStatus: "member",
      newStatus: "left",
    });

    await handleMyChatMemberUpdate(ctx);

    expect(insertValuesCaptured).toHaveLength(0);
    expect(conflictSetCaptured).toHaveLength(0);
    expect(removalUpdateValuesCaptured).toHaveLength(1);
    expect(removalUpdateValuesCaptured[0]?.chatTitle).toBe("New Community Title");
    expect(removalUpdateValuesCaptured[0]?.isActive).toBe(false);
    expect(removalUpdateValuesCaptured[0]?.isPublic).toBe(false);
    expect(removalUpdateValuesCaptured[0]?.updatedAt).toBeInstanceOf(Date);
    expect(removalWhereCalls).toBe(1);
    expect(evictCalls).toEqual([BigInt(COMMUNITY_CHAT_ID)]);
    expect(sendMessageCalls).toHaveLength(0);
  });

  test("handles removal administrator -> kicked in channel by deactivating and hiding", async () => {
    const { ctx, sendMessageCalls } = createContext({
      chatType: "channel",
      oldStatus: "administrator",
      newStatus: "kicked",
    });

    await handleMyChatMemberUpdate(ctx);

    expect(insertValuesCaptured).toHaveLength(0);
    expect(conflictSetCaptured).toHaveLength(0);
    expect(removalUpdateValuesCaptured).toHaveLength(1);
    expect(removalWhereCalls).toBe(1);
    expect(evictCalls).toEqual([BigInt(COMMUNITY_CHAT_ID)]);
    expect(sendMessageCalls).toHaveLength(0);
  });

  test("handles removal restricted -> left by deactivating and hiding", async () => {
    const { ctx, sendMessageCalls } = createContext({
      chatType: "supergroup",
      oldStatus: "restricted",
      newStatus: "left",
    });

    await handleMyChatMemberUpdate(ctx);

    expect(insertValuesCaptured).toHaveLength(0);
    expect(conflictSetCaptured).toHaveLength(0);
    expect(removalUpdateValuesCaptured).toHaveLength(1);
    expect(removalWhereCalls).toBe(1);
    expect(evictCalls).toEqual([BigInt(COMMUNITY_CHAT_ID)]);
    expect(sendMessageCalls).toHaveLength(0);
  });

  test("evicts cache and does not crash when removal update fails", async () => {
    removalUpdateShouldThrow = true;
    const { ctx, sendMessageCalls } = createContext({
      chatType: "group",
      oldStatus: "member",
      newStatus: "left",
    });
    const consoleErrorMock = mock(() => undefined);
    const previousConsoleError = console.error;
    console.error = consoleErrorMock;

    try {
      await handleMyChatMemberUpdate(ctx);
    } finally {
      console.error = previousConsoleError;
    }

    expect(insertValuesCaptured).toHaveLength(0);
    expect(removalUpdateValuesCaptured).toHaveLength(1);
    expect(evictCalls).toEqual([BigInt(COMMUNITY_CHAT_ID)]);
    expect(sendMessageCalls).toHaveLength(0);
    expect(consoleErrorMock).toHaveBeenCalledTimes(1);
  });
});
