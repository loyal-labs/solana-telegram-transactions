import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

const getBotMock = mock(async () => ({}));
const registerBotCommandsMock = mock(async () => undefined);

mock.module("@/lib/telegram/bot-api/bot", () => ({
  getBot: getBotMock,
}));
mock.module("@/lib/telegram/bot-api/register-commands", () => ({
  registerBotCommands: registerBotCommandsMock,
}));

let runSetupCommands: typeof import("./setup-commands").runSetupCommands;
let runSetupCommandsCli: typeof import("./setup-commands").runSetupCommandsCli;

describe("telegram setup commands script", () => {
  beforeAll(async () => {
    const loadedModule = await import("./setup-commands");
    runSetupCommands = loadedModule.runSetupCommands;
    runSetupCommandsCli = loadedModule.runSetupCommandsCli;
  });

  beforeEach(() => {
    getBotMock.mockReset();
    registerBotCommandsMock.mockReset();
  });

  test("registers bot commands successfully", async () => {
    const fakeBot = { api: {} };
    getBotMock.mockResolvedValue(fakeBot);
    const consoleInfoMock = mock(() => undefined);
    const previousConsoleInfo = console.info;
    console.info = consoleInfoMock;

    try {
      const exitCode = await runSetupCommandsCli();
      expect(exitCode).toBe(0);

      expect(getBotMock).toHaveBeenCalledTimes(1);
      expect(registerBotCommandsMock).toHaveBeenCalledTimes(1);
      expect(registerBotCommandsMock).toHaveBeenCalledWith(fakeBot);
      expect(consoleInfoMock).toHaveBeenCalledTimes(1);
      expect(consoleInfoMock).toHaveBeenCalledWith(
        "Telegram bot commands registered successfully."
      );
    } finally {
      console.info = previousConsoleInfo;
    }
  });

  test("returns non-zero exit code when command registration fails", async () => {
    const expectedError = new Error("failed to setup commands");
    getBotMock.mockRejectedValue(expectedError);
    const consoleErrorMock = mock(() => undefined);
    const previousConsoleError = console.error;
    console.error = consoleErrorMock;

    try {
      await expect(runSetupCommands()).rejects.toThrow("failed to setup commands");

      const exitCode = await runSetupCommandsCli();
      expect(exitCode).toBe(1);
      expect(consoleErrorMock).toHaveBeenCalledTimes(1);
      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Failed to register Telegram bot commands.",
        expectedError
      );
    } finally {
      console.error = previousConsoleError;
    }
  });
});
