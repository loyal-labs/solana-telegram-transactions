import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { CallbackQueryContext, CommandContext, Context } from "grammy";

import type { Community } from "@/lib/core/schema";

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

mock.module("@/lib/core/database", () => ({
  getDatabase: () => mockDb,
}));

const autoCleanupReplyCalls: Array<{
  options?: unknown;
  text: string;
}> = [];

mock.module("../helper-message-cleanup", () => ({
  replyWithAutoCleanup: async (
    ctx: CommandContext<Context>,
    text: string,
    options?: unknown
  ) => {
    autoCleanupReplyCalls.push({ options, text });
    await ctx.reply(text, options as never);
  },
}));

let NOTIFICATION_SETTINGS_CALLBACK_DATA_REGEX: RegExp;
let OUTDATED_NOTIFICATION_SETTINGS_ALERT_TEXT: string;
let UNAUTHORIZED_NOTIFICATION_SETTINGS_ALERT_TEXT: string;
let buildNotificationSettingsKeyboard: (community: Community) => {
  inline_keyboard: Array<
    Array<{ callback_data?: string; text?: string; url?: string }>
  >;
};
let buildNotificationSettingsUpdateValues: (callbackData: {
  communityId: string;
  dimension: "time" | "msg" | "master";
  value: "off" | "on" | 24 | 48 | 500 | 1000;
}) => {
  summaryNotificationMessageCount?: 500 | 1000 | null;
  summaryNotificationTimeHours?: 24 | 48 | null;
  summaryNotificationsEnabled?: boolean;
  updatedAt: Date;
};
let encodeNotificationSettingsCallbackData: (callbackData: {
  communityId: string;
  dimension: "time" | "msg" | "master";
  value: "off" | "on" | 24 | 48 | 500 | 1000;
}) => string;
let handleNotificationSettingsCallback: (
  ctx: CallbackQueryContext<Context>
) => Promise<void>;
let parseNotificationSettingsCallbackData: (data: string) => {
  communityId: string;
  dimension: "time" | "msg" | "master";
  value: "off" | "on" | 24 | 48 | 500 | 1000;
} | null;
let sendNotificationSettingsMessage: typeof import("../notification-settings").sendNotificationSettingsMessage;

let adminResult: { id: string } | null;
let communityFindResults: Array<Community | null>;
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

function createCallbackContext(options: {
  data: string;
  includeFrom?: boolean;
  fromId?: number;
  chatId?: number;
  messageId?: number;
}) {
  const answerCalls: unknown[] = [];
  const editCalls: unknown[][] = [];

  const rawContext: Record<string, unknown> = {
    callbackQuery: {
      data: options.data,
      message: {
        chat: { id: options.chatId ?? -1009876543210 },
        message_id: options.messageId ?? 99,
      },
    },
    answerCallbackQuery: async (payload?: unknown) => {
      answerCalls.push(payload);
      return true as const;
    },
    api: {
      editMessageText: async (...args: unknown[]) => {
        editCalls.push(args);
        return {} as never;
      },
    },
  };

  if (options.includeFrom !== false) {
    rawContext.from = { id: options.fromId ?? 777 };
  }

  return {
    answerCalls,
    ctx: rawContext as unknown as CallbackQueryContext<Context>,
    editCalls,
  };
}

describe("notification settings helpers", () => {
  beforeAll(async () => {
    const loadedModule = await import("../notification-settings");
    ({
      NOTIFICATION_SETTINGS_CALLBACK_DATA_REGEX,
      OUTDATED_NOTIFICATION_SETTINGS_ALERT_TEXT,
      UNAUTHORIZED_NOTIFICATION_SETTINGS_ALERT_TEXT,
      buildNotificationSettingsKeyboard,
      buildNotificationSettingsUpdateValues,
      encodeNotificationSettingsCallbackData,
      handleNotificationSettingsCallback,
      parseNotificationSettingsCallbackData,
      sendNotificationSettingsMessage,
    } = loadedModule);
  });

  beforeEach(() => {
    adminResult = null;
    communityFindResults = [];
    updateValuesCaptured = [];
    autoCleanupReplyCalls.length = 0;

    mockDb = {
      query: {
        admins: {
          findFirst: async () => adminResult,
        },
        communities: {
          findFirst: async () => communityFindResults.shift() ?? null,
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

  test("parses valid callback data for each dimension", () => {
    const communityId = "550e8400-e29b-41d4-a716-446655440000";

    expect(
      parseNotificationSettingsCallbackData(
        encodeNotificationSettingsCallbackData({
          communityId,
          dimension: "time",
          value: 48,
        })
      )
    ).toEqual({
      communityId,
      dimension: "time",
      value: 48,
    });

    expect(
      parseNotificationSettingsCallbackData(
        encodeNotificationSettingsCallbackData({
          communityId,
          dimension: "msg",
          value: 1000,
        })
      )
    ).toEqual({
      communityId,
      dimension: "msg",
      value: 1000,
    });

    expect(
      parseNotificationSettingsCallbackData(
        encodeNotificationSettingsCallbackData({
          communityId,
          dimension: "master",
          value: "on",
        })
      )
    ).toEqual({
      communityId,
      dimension: "master",
      value: "on",
    });
  });

  test("rejects malformed and mismatched callback data", () => {
    expect(
      parseNotificationSettingsCallbackData(
        "notif:settings:550e8400-e29b-41d4-a716-446655440000:time:500"
      )
    ).toBeNull();
    expect(
      parseNotificationSettingsCallbackData(
        "notif:settings:550e8400-e29b-41d4-a716-446655440000:msg:24"
      )
    ).toBeNull();
    expect(
      parseNotificationSettingsCallbackData(
        "notif:settings:550e8400-e29b-41d4-a716-446655440000:master:1000"
      )
    ).toBeNull();
    expect(
      parseNotificationSettingsCallbackData(
        "notif:settings:550e8400-e29b-41d4-a716-446655440000:msg:9999"
      )
    ).toBeNull();
    expect(parseNotificationSettingsCallbackData("invalid:data")).toBeNull();
  });

  test("regex trigger only matches expected callback format", () => {
    expect(
      NOTIFICATION_SETTINGS_CALLBACK_DATA_REGEX.test(
        "notif:settings:550e8400-e29b-41d4-a716-446655440000:time:24"
      )
    ).toBe(true);
    expect(
      NOTIFICATION_SETTINGS_CALLBACK_DATA_REGEX.test(
        "notif:settings:550e8400-e29b-41d4-a716-446655440000:time:24:extra"
      )
    ).toBe(false);
    expect(
      NOTIFICATION_SETTINGS_CALLBACK_DATA_REGEX.test(
        "notif:settings:not-a-uuid:time:24"
      )
    ).toBe(false);
  });

  test("builds a two-row keyboard with active markers and callback payloads", () => {
    const community = createCommunity({
      summaryNotificationsEnabled: true,
      summaryNotificationTimeHours: 24,
      summaryNotificationMessageCount: null,
    });
    const keyboard = buildNotificationSettingsKeyboard(community);
    const rows = keyboard.inline_keyboard;

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(3);
    expect(rows[1]).toHaveLength(2);

    expect(rows[0][1]?.text).toContain("✅");
    expect(rows[0][1]?.callback_data).toBe(
      "notif:settings:550e8400-e29b-41d4-a716-446655440000:time:24"
    );
    expect(rows[1][1]?.text).toContain("✅");
    expect(rows[1][1]?.callback_data).toBe(
      "notif:settings:550e8400-e29b-41d4-a716-446655440000:master:on"
    );
  });

  test("maps callback actions to typed DB update values", () => {
    const timeUpdate = buildNotificationSettingsUpdateValues({
      communityId: "550e8400-e29b-41d4-a716-446655440000",
      dimension: "time",
      value: "off",
    });
    expect(timeUpdate.summaryNotificationTimeHours).toBeNull();
    expect(timeUpdate.summaryNotificationMessageCount).toBeUndefined();
    expect(timeUpdate.summaryNotificationsEnabled).toBeUndefined();
    expect(timeUpdate.updatedAt).toBeInstanceOf(Date);

    const messageUpdate = buildNotificationSettingsUpdateValues({
      communityId: "550e8400-e29b-41d4-a716-446655440000",
      dimension: "msg",
      value: 500,
    });
    expect(messageUpdate.summaryNotificationMessageCount).toBe(500);
    expect(messageUpdate.summaryNotificationTimeHours).toBeUndefined();
    expect(messageUpdate.summaryNotificationsEnabled).toBeUndefined();
    expect(messageUpdate.updatedAt).toBeInstanceOf(Date);

    const masterUpdate = buildNotificationSettingsUpdateValues({
      communityId: "550e8400-e29b-41d4-a716-446655440000",
      dimension: "master",
      value: "off",
    });
    expect(masterUpdate.summaryNotificationsEnabled).toBe(false);
    expect(masterUpdate.summaryNotificationTimeHours).toBeUndefined();
    expect(masterUpdate.summaryNotificationMessageCount).toBeUndefined();
    expect(masterUpdate.updatedAt).toBeInstanceOf(Date);
  });

  test("shows authorization alert when non-admin presses callback button", async () => {
    adminResult = null;

    const { answerCalls, ctx, editCalls } = createCallbackContext({
      data: "notif:settings:550e8400-e29b-41d4-a716-446655440000:time:24",
    });

    await handleNotificationSettingsCallback(ctx);

    expect(answerCalls).toEqual([
      {
        show_alert: true,
        text: UNAUTHORIZED_NOTIFICATION_SETTINGS_ALERT_TEXT,
      },
    ]);
    expect(updateValuesCaptured).toHaveLength(0);
    expect(editCalls).toHaveLength(0);
  });

  test("shows stale-panel alert when callback message chat does not match community", async () => {
    adminResult = { id: "admin-1" };
    communityFindResults = [
      createCommunity({ chatId: BigInt("-1001111111111") }),
    ];

    const { answerCalls, ctx, editCalls } = createCallbackContext({
      chatId: -1002222222222,
      data: "notif:settings:550e8400-e29b-41d4-a716-446655440000:master:on",
    });

    await handleNotificationSettingsCallback(ctx);

    expect(answerCalls).toEqual([
      {
        show_alert: true,
        text: OUTDATED_NOTIFICATION_SETTINGS_ALERT_TEXT,
      },
    ]);
    expect(updateValuesCaptured).toHaveLength(0);
    expect(editCalls).toHaveLength(0);
  });

  test("updates DB and refreshes keyboard when authorized admin changes setting", async () => {
    adminResult = { id: "admin-1" };
    const initialCommunity = createCommunity({
      summaryNotificationMessageCount: null,
    });
    const updatedCommunity = createCommunity({
      summaryNotificationMessageCount: 500,
    });
    communityFindResults = [initialCommunity, updatedCommunity];

    const { answerCalls, ctx, editCalls } = createCallbackContext({
      chatId: -1009876543210,
      data: "notif:settings:550e8400-e29b-41d4-a716-446655440000:msg:500",
      messageId: 123,
    });

    await handleNotificationSettingsCallback(ctx);

    expect(updateValuesCaptured).toHaveLength(1);
    expect(updateValuesCaptured[0]?.summaryNotificationMessageCount).toBe(500);
    expect(updateValuesCaptured[0]?.updatedAt).toBeInstanceOf(Date);

    expect(editCalls).toHaveLength(1);
    expect(editCalls[0]?.[0]).toBe(-1009876543210);
    expect(editCalls[0]?.[1]).toBe(123);
    expect(editCalls[0]?.[2]).toContain(
      "Notification settings for this community"
    );

    expect(answerCalls).toEqual([{ text: "Notification settings updated" }]);
  });

  test("sends settings panel using auto-cleanup reply wrapper", async () => {
    const community = createCommunity({
      summaryNotificationsEnabled: true,
      summaryNotificationTimeHours: 24,
    });
    const replyCalls: Array<{ options?: unknown; text: string }> = [];
    const ctx = {
      chat: {
        id: -1009876543210,
        type: "supergroup",
      },
      reply: async (text: string, options?: unknown) => {
        replyCalls.push({ options, text });
        return {} as never;
      },
    } as unknown as CommandContext<Context>;

    await sendNotificationSettingsMessage(ctx, community);

    expect(replyCalls).toHaveLength(1);
    expect(replyCalls[0]?.text).toContain(
      "Notification settings for this community"
    );
    expect(replyCalls[0]?.options).toEqual(
      expect.objectContaining({ parse_mode: "HTML" })
    );
    expect(autoCleanupReplyCalls).toHaveLength(1);
  });
});
