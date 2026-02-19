import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { CommandContext, Context } from "grammy";

mock.module("server-only", () => ({}));

let mockDb: {
  insert: () => {
    values: (values: Record<string, unknown>) => {
      onConflictDoNothing: () => Promise<void>;
    };
  };
};

const insertValuesCaptured: Array<Record<string, unknown>> = [];
let onConflictDoNothingCalls = 0;

mock.module("@/lib/core/database", () => ({
  getDatabase: () => mockDb,
}));

let replyWithAutoCleanup: typeof import("../helper-message-cleanup").replyWithAutoCleanup;
let scheduleHelperMessageDeletion: typeof import("../helper-message-cleanup").scheduleHelperMessageDeletion;
let sendMessageWithAutoCleanup: typeof import("../helper-message-cleanup").sendMessageWithAutoCleanup;

describe("helper message cleanup helpers", () => {
  beforeAll(async () => {
    const loadedModule = await import("../helper-message-cleanup");
    replyWithAutoCleanup = loadedModule.replyWithAutoCleanup;
    scheduleHelperMessageDeletion = loadedModule.scheduleHelperMessageDeletion;
    sendMessageWithAutoCleanup = loadedModule.sendMessageWithAutoCleanup;
  });

  beforeEach(() => {
    insertValuesCaptured.length = 0;
    onConflictDoNothingCalls = 0;

    mockDb = {
      insert: () => ({
        values: (values: Record<string, unknown>) => {
          insertValuesCaptured.push(values);
          return {
            onConflictDoNothing: async () => {
              onConflictDoNothingCalls += 1;
            },
          };
        },
      }),
    };
  });

  test("scheduleHelperMessageDeletion stores queue rows with computed deleteAfter", async () => {
    const before = Date.now();
    await scheduleHelperMessageDeletion("-1009876543210", 777, 60_000);
    const after = Date.now();

    expect(insertValuesCaptured).toHaveLength(1);
    const row = insertValuesCaptured[0];
    expect(row?.chatId).toBe(BigInt("-1009876543210"));
    expect(row?.messageId).toBe(777);
    expect(row?.deleteAfter).toBeInstanceOf(Date);
    const deleteAfterMs = (row?.deleteAfter as Date).getTime();
    expect(deleteAfterMs).toBeGreaterThanOrEqual(before + 60_000);
    expect(deleteAfterMs).toBeLessThanOrEqual(after + 60_000);
    expect(onConflictDoNothingCalls).toBe(1);
  });

  test("scheduleHelperMessageDeletion remains idempotent with onConflictDoNothing", async () => {
    await scheduleHelperMessageDeletion("-1009876543210", 1, 60_000);
    await scheduleHelperMessageDeletion("-1009876543210", 1, 60_000);

    expect(insertValuesCaptured).toHaveLength(2);
    expect(onConflictDoNothingCalls).toBe(2);
  });

  test("replyWithAutoCleanup schedules only for community chats", async () => {
    const communityCtx = {
      chat: {
        id: -1009876543210,
        type: "supergroup",
      },
      reply: async () => ({ message_id: 77 } as never),
    } as unknown as CommandContext<Context>;

    const privateCtx = {
      chat: {
        id: 777,
        type: "private",
      },
      reply: async () => ({ message_id: 88 } as never),
    } as unknown as CommandContext<Context>;

    await replyWithAutoCleanup(communityCtx, "community helper");
    await replyWithAutoCleanup(privateCtx, "private helper");

    expect(insertValuesCaptured).toHaveLength(1);
    expect(insertValuesCaptured[0]?.chatId).toBe(BigInt("-1009876543210"));
    expect(insertValuesCaptured[0]?.messageId).toBe(77);
  });

  test("sendMessageWithAutoCleanup schedules only for community chats", async () => {
    const api = {
      sendMessage: async () => ({ message_id: 505 } as never),
    } as unknown as Pick<Context["api"], "sendMessage">;

    await sendMessageWithAutoCleanup({
      api,
      chatId: "-1009876543210",
      chatType: "supergroup",
      text: "onboarding helper",
    });

    await sendMessageWithAutoCleanup({
      api,
      chatId: "777",
      chatType: "private",
      text: "private helper",
    });

    expect(insertValuesCaptured).toHaveLength(1);
    expect(insertValuesCaptured[0]?.chatId).toBe(BigInt("-1009876543210"));
    expect(insertValuesCaptured[0]?.messageId).toBe(505);
  });
});
