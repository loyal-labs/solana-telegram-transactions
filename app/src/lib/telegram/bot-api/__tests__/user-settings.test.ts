import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { CallbackQueryContext, Context } from "grammy";

import type { UserSettings } from "@/lib/core/schema";

let mockDb: {
  query: {
    users: { findFirst: () => Promise<{ id: string } | null> };
    userSettings: { findFirst: () => Promise<UserSettings | null> };
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

let OUTDATED_USER_SETTINGS_ALERT_TEXT: string;
let UNAUTHORIZED_USER_SETTINGS_ALERT_TEXT: string;
let USER_SETTINGS_CALLBACK_DATA_REGEX: RegExp;
let buildUserSettingsKeyboard: (
  userId: string,
  notifications: boolean
) => {
  inline_keyboard: Array<
    Array<{ callback_data?: string; text?: string; url?: string }>
  >;
};
let buildUserSettingsUpdateValues: (callbackData: {
  userId: string;
  dimension: "notif";
  value: "off" | "on";
}) => {
  notifications: boolean;
  updatedAt: Date;
};
let encodeUserSettingsCallbackData: (callbackData: {
  userId: string;
  dimension: "notif";
  value: "off" | "on";
}) => string;
let handleUserSettingsCallback: (
  ctx: CallbackQueryContext<Context>
) => Promise<void>;
let parseUserSettingsCallbackData: (data: string) => {
  userId: string;
  dimension: "notif";
  value: "off" | "on";
} | null;

let actorResult: { id: string } | null;
let settingsFindResults: Array<UserSettings | null>;
let updateValuesCaptured: Array<Record<string, unknown>>;

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
        chat: { id: options.chatId ?? 777 },
        message_id: options.messageId ?? 101,
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

describe("user settings helpers", () => {
  beforeAll(async () => {
    const loadedModule = await import("../user-settings");
    ({
      OUTDATED_USER_SETTINGS_ALERT_TEXT,
      UNAUTHORIZED_USER_SETTINGS_ALERT_TEXT,
      USER_SETTINGS_CALLBACK_DATA_REGEX,
      buildUserSettingsKeyboard,
      buildUserSettingsUpdateValues,
      encodeUserSettingsCallbackData,
      handleUserSettingsCallback,
      parseUserSettingsCallbackData,
    } = loadedModule);
  });

  beforeEach(() => {
    actorResult = null;
    settingsFindResults = [];
    updateValuesCaptured = [];

    mockDb = {
      query: {
        users: {
          findFirst: async () => actorResult,
        },
        userSettings: {
          findFirst: async () => settingsFindResults.shift() ?? null,
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

  test("parses valid callback data", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";

    expect(
      parseUserSettingsCallbackData(
        encodeUserSettingsCallbackData({
          userId,
          dimension: "notif",
          value: "on",
        })
      )
    ).toEqual({
      userId,
      dimension: "notif",
      value: "on",
    });
  });

  test("rejects malformed callback data", () => {
    expect(
      parseUserSettingsCallbackData(
        "usr:settings:550e8400-e29b-41d4-a716-446655440000:notif:24"
      )
    ).toBeNull();
    expect(
      parseUserSettingsCallbackData(
        "usr:settings:550e8400-e29b-41d4-a716-446655440000:master:on"
      )
    ).toBeNull();
    expect(parseUserSettingsCallbackData("invalid:data")).toBeNull();
  });

  test("regex trigger only matches expected callback format", () => {
    expect(
      USER_SETTINGS_CALLBACK_DATA_REGEX.test(
        "usr:settings:550e8400-e29b-41d4-a716-446655440000:notif:on"
      )
    ).toBe(true);
    expect(
      USER_SETTINGS_CALLBACK_DATA_REGEX.test(
        "usr:settings:550e8400-e29b-41d4-a716-446655440000:notif:on:extra"
      )
    ).toBe(false);
    expect(
      USER_SETTINGS_CALLBACK_DATA_REGEX.test("usr:settings:not-a-uuid:notif:on")
    ).toBe(false);
  });

  test("builds a one-row keyboard with active markers and callback payloads", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const keyboard = buildUserSettingsKeyboard(userId, true);
    const rows = keyboard.inline_keyboard;

    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(2);
    expect(rows[0][1]?.text).toContain("✅");
    expect(rows[0][1]?.callback_data).toBe(
      "usr:settings:550e8400-e29b-41d4-a716-446655440000:notif:on"
    );
  });

  test("maps callback action to typed DB update values", () => {
    const update = buildUserSettingsUpdateValues({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      dimension: "notif",
      value: "off",
    });

    expect(update.notifications).toBe(false);
    expect(update.updatedAt).toBeInstanceOf(Date);
  });

  test("shows authorization alert when user presses another account's callback", async () => {
    actorResult = { id: "6f717210-4b32-4df5-a76c-f799ebf1dad8" };

    const { answerCalls, ctx, editCalls } = createCallbackContext({
      data: "usr:settings:550e8400-e29b-41d4-a716-446655440000:notif:on",
    });

    await handleUserSettingsCallback(ctx);

    expect(answerCalls).toEqual([
      {
        show_alert: true,
        text: UNAUTHORIZED_USER_SETTINGS_ALERT_TEXT,
      },
    ]);
    expect(updateValuesCaptured).toHaveLength(0);
    expect(editCalls).toHaveLength(0);
  });

  test("shows stale-panel alert when settings row is missing", async () => {
    actorResult = { id: "550e8400-e29b-41d4-a716-446655440000" };
    settingsFindResults = [null];

    const { answerCalls, ctx, editCalls } = createCallbackContext({
      data: "usr:settings:550e8400-e29b-41d4-a716-446655440000:notif:on",
    });

    await handleUserSettingsCallback(ctx);

    expect(answerCalls).toEqual([
      {
        show_alert: true,
        text: OUTDATED_USER_SETTINGS_ALERT_TEXT,
      },
    ]);
    expect(updateValuesCaptured).toHaveLength(0);
    expect(editCalls).toHaveLength(0);
  });

  test("shows stale-panel alert when callback message is from another chat", async () => {
    actorResult = { id: "550e8400-e29b-41d4-a716-446655440000" };

    const { answerCalls, ctx, editCalls } = createCallbackContext({
      chatId: -1009876543210,
      data: "usr:settings:550e8400-e29b-41d4-a716-446655440000:notif:on",
      fromId: 777,
    });

    await handleUserSettingsCallback(ctx);

    expect(answerCalls).toEqual([
      {
        show_alert: true,
        text: OUTDATED_USER_SETTINGS_ALERT_TEXT,
      },
    ]);
    expect(updateValuesCaptured).toHaveLength(0);
    expect(editCalls).toHaveLength(0);
  });

  test("updates DB and refreshes keyboard when user toggles notifications", async () => {
    actorResult = { id: "550e8400-e29b-41d4-a716-446655440000" };
    const initialSettings = createUserSettings({ notifications: true });
    const updatedSettings = createUserSettings({ notifications: false });
    settingsFindResults = [initialSettings, updatedSettings];

    const { answerCalls, ctx, editCalls } = createCallbackContext({
      chatId: 777,
      data: "usr:settings:550e8400-e29b-41d4-a716-446655440000:notif:off",
      messageId: 123,
    });

    await handleUserSettingsCallback(ctx);

    expect(updateValuesCaptured).toHaveLength(1);
    expect(updateValuesCaptured[0]?.notifications).toBe(false);
    expect(updateValuesCaptured[0]?.updatedAt).toBeInstanceOf(Date);

    expect(editCalls).toHaveLength(1);
    expect(editCalls[0]?.[0]).toBe(777);
    expect(editCalls[0]?.[1]).toBe(123);
    expect(editCalls[0]?.[2]).toContain("Your notification settings");

    expect(answerCalls).toEqual([{ text: "Settings updated" }]);
  });
});
