import { getBot } from "@/lib/telegram/bot-api/bot";

const bot = await getBot();

export const sendBusinessConnectionMessage = async (
  connectionId: string,
  connectionEnabled: boolean,
  userId: number
) => {
  if (connectionEnabled) {
    await bot.api.sendMessage(userId, "You've connected Loyal to messages.");
  } else {
    await bot.api.sendMessage(
      userId,
      "You've disconnected Loyal from messages."
    );
  }
};
