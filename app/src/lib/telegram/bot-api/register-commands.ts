import type { Bot } from "grammy";

export async function registerBotCommands(bot: Bot): Promise<void> {
  // Commands for private chats
  await bot.api.setMyCommands(
    [{ command: "start", description: "Start the bot and get help" }],
    { scope: { type: "all_private_chats" } }
  );

  // Commands for group chats
  await bot.api.setMyCommands(
    [
      { command: "summary", description: "Get the latest chat summary" },
      { command: "ca", description: "Show $LOYAL contract address" },
      {
        command: "notifications",
        description: "Configure summary notifications (admins only)",
      },
      {
        command: "activate_community",
        description: "Enable message tracking (admins only)",
      },
      {
        command: "deactivate_community",
        description: "Disable message tracking (admins only)",
      },
    ],
    { scope: { type: "all_group_chats" } }
  );
}
