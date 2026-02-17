import { describe, expect, mock, test } from "bun:test";

describe("registerBotCommands", () => {
  test("registers /settings in private scope and keeps group commands", async () => {
    const setMyCommands = mock(async () => true as const);
    const bot = {
      api: {
        setMyCommands,
      },
    };

    const { registerBotCommands } = await import("../register-commands");

    await registerBotCommands(bot as never);

    expect(setMyCommands).toHaveBeenCalledTimes(2);

    expect(setMyCommands).toHaveBeenNthCalledWith(
      1,
      [
        { command: "start", description: "Start the bot and get help" },
        {
          command: "settings",
          description: "Manage your private notification settings",
        },
      ],
      { scope: { type: "all_private_chats" } }
    );

    expect(setMyCommands).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        { command: "summary", description: "Get the latest chat summary" },
        {
          command: "notifications",
          description: "Configure summary notifications (admins only)",
        },
      ]),
      { scope: { type: "all_group_chats" } }
    );
  });
});
