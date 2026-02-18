import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { BusinessConnection as TelegramBusinessConnection } from "grammy/types";

const sendMessageCalls: Array<{ chatId: number; text: string }> = [];
const upsertInsertValuesCaptured: Array<Record<string, unknown>> = [];
const upsertConflictSetCaptured: Array<Record<string, unknown>> = [];
const getOrCreateUserCalls: Array<{
  displayName: string;
  telegramUserId: bigint;
  username: string | null;
}> = [];
let usersFindFirstResult: { id: string } | null = null;
let userSettingsFindFirstResult: { notifications: boolean } | null = null;

const mockDb = {
  insert: () => ({
    values: (values: Record<string, unknown>) => {
      upsertInsertValuesCaptured.push(values);
      return {
        onConflictDoUpdate: async (config: {
          set: Record<string, unknown>;
          target: unknown;
        }) => {
          upsertConflictSetCaptured.push(config.set);
        },
      };
    },
  }),
  query: {
    userSettings: {
      findFirst: async () => userSettingsFindFirstResult,
    },
    users: {
      findFirst: async () => usersFindFirstResult,
    },
  },
};

mock.module("server-only", () => ({}));

mock.module("@/lib/core/database", () => ({
  getDatabase: () => mockDb,
}));

mock.module("../bot", () => ({
  getBot: async () => ({
    api: {
      sendMessage: async (chatId: number, text: string) => {
        sendMessageCalls.push({ chatId, text });
        return {} as never;
      },
    },
  }),
}));

mock.module("@/lib/telegram/user-service", () => ({
  getOrCreateUser: async (
    telegramUserId: bigint,
    userData: { displayName: string; username: string | null }
  ) => {
    getOrCreateUserCalls.push({
      displayName: userData.displayName,
      telegramUserId,
      username: userData.username,
    });
    return "resolved-user-id";
  },
}));

let handleBusinessConnection: typeof import("../handle-business-connection").handleBusinessConnection;

function createBusinessConnection(isEnabled: boolean): TelegramBusinessConnection {
  return {
    date: 1_735_257_600,
    id: "business-connection-id",
    is_enabled: isEnabled,
    rights: { can_reply: true },
    user: {
      first_name: "Taylor",
      id: 777,
      is_bot: false,
      username: "taylor",
    },
    user_chat_id: 777,
  } as unknown as TelegramBusinessConnection;
}

describe("handleBusinessConnection", () => {
  beforeAll(async () => {
    const loadedModule = await import("../handle-business-connection");
    handleBusinessConnection = loadedModule.handleBusinessConnection;
  });

  beforeEach(() => {
    sendMessageCalls.length = 0;
    upsertInsertValuesCaptured.length = 0;
    upsertConflictSetCaptured.length = 0;
    getOrCreateUserCalls.length = 0;
    usersFindFirstResult = { id: "resolved-user-id" };
    userSettingsFindFirstResult = { notifications: true };
  });

  test("skips sending user message when notifications are disabled", async () => {
    userSettingsFindFirstResult = { notifications: false };

    await handleBusinessConnection(createBusinessConnection(true));

    expect(getOrCreateUserCalls).toHaveLength(1);
    expect(upsertInsertValuesCaptured).toHaveLength(1);
    expect(upsertConflictSetCaptured).toHaveLength(1);
    expect(sendMessageCalls).toHaveLength(0);
  });

  test("sends user message when notifications are enabled", async () => {
    await handleBusinessConnection(createBusinessConnection(true));

    expect(getOrCreateUserCalls).toHaveLength(1);
    expect(upsertInsertValuesCaptured).toHaveLength(1);
    expect(sendMessageCalls).toEqual([
      {
        chatId: 777,
        text: "You've connected Loyal to messages.",
      },
    ]);
  });
});
