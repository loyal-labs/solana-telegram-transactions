import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

const getBotMock = mock(async () => ({}));

mock.module("@/lib/telegram/bot-api/bot", () => ({
  getBot: getBotMock,
}));

let DEFAULT_CHAT_ID: typeof import("./setup-chat-commands").DEFAULT_CHAT_ID;
let CHAT_USER_COMMANDS: typeof import("./setup-chat-commands").CHAT_USER_COMMANDS;
let CHAT_ADMIN_COMMANDS: typeof import("./setup-chat-commands").CHAT_ADMIN_COMMANDS;
let registerCommandsForChat: typeof import("./setup-chat-commands").registerCommandsForChat;
let runSetupChatCommandsCli: typeof import("./setup-chat-commands").runSetupChatCommandsCli;

describe("telegram setup chat commands script", () => {
  beforeAll(async () => {
    const loadedModule = await import("./setup-chat-commands");
    DEFAULT_CHAT_ID = loadedModule.DEFAULT_CHAT_ID;
    CHAT_USER_COMMANDS = loadedModule.CHAT_USER_COMMANDS;
    CHAT_ADMIN_COMMANDS = loadedModule.CHAT_ADMIN_COMMANDS;
    registerCommandsForChat = loadedModule.registerCommandsForChat;
    runSetupChatCommandsCli = loadedModule.runSetupChatCommandsCli;
  });

  beforeEach(() => {
    getBotMock.mockReset();
  });

  test("registers chat and chat admin scopes for default chat", async () => {
    const setMyCommandsMock = mock(async () => true);
    const fakeBot = { api: { setMyCommands: setMyCommandsMock } };
    getBotMock.mockResolvedValue(fakeBot);
    const consoleInfoMock = mock(() => undefined);
    const previousConsoleInfo = console.info;
    console.info = consoleInfoMock;

    try {
      const exitCode = await runSetupChatCommandsCli();
      expect(exitCode).toBe(0);
      expect(getBotMock).toHaveBeenCalledTimes(1);
      expect(setMyCommandsMock).toHaveBeenCalledTimes(2);
      expect(setMyCommandsMock).toHaveBeenNthCalledWith(1, CHAT_USER_COMMANDS, {
        scope: { type: "chat", chat_id: DEFAULT_CHAT_ID },
      });
      expect(setMyCommandsMock).toHaveBeenNthCalledWith(2, CHAT_ADMIN_COMMANDS, {
        scope: { type: "chat_administrators", chat_id: DEFAULT_CHAT_ID },
      });
      expect(consoleInfoMock).toHaveBeenCalledWith(
        `Telegram bot commands registered for chat ${DEFAULT_CHAT_ID}.`
      );
    } finally {
      console.info = previousConsoleInfo;
    }
  });

  test("registers commands for explicit chat id", async () => {
    const setMyCommandsMock = mock(async () => true);
    const fakeBot = { api: { setMyCommands: setMyCommandsMock } };

    await registerCommandsForChat(
      fakeBot as unknown as Parameters<typeof registerCommandsForChat>[0],
      "-1001111111111"
    );

    expect(setMyCommandsMock).toHaveBeenCalledTimes(2);
    expect(setMyCommandsMock).toHaveBeenNthCalledWith(1, CHAT_USER_COMMANDS, {
      scope: { type: "chat", chat_id: "-1001111111111" },
    });
    expect(setMyCommandsMock).toHaveBeenNthCalledWith(2, CHAT_ADMIN_COMMANDS, {
      scope: { type: "chat_administrators", chat_id: "-1001111111111" },
    });
  });

  test("returns non-zero exit code when command registration fails", async () => {
    const expectedError = new Error("failed to setup chat commands");
    getBotMock.mockRejectedValue(expectedError);
    const consoleErrorMock = mock(() => undefined);
    const previousConsoleError = console.error;
    console.error = consoleErrorMock;

    try {
      const exitCode = await runSetupChatCommandsCli(DEFAULT_CHAT_ID);
      expect(exitCode).toBe(1);
      expect(consoleErrorMock).toHaveBeenCalledWith(
        `Failed to register Telegram bot commands for chat ${DEFAULT_CHAT_ID}.`,
        expectedError
      );
    } finally {
      console.error = previousConsoleError;
    }
  });
});
