import { Bot } from "grammy";

let bot: Bot | null = null;

export const getBot = async (): Promise<Bot> => {
  const token = process.env.ASKLOYAL_TGBOT_KEY;
  if (!token) {
    throw new Error("ASKLOYAL_TGBOT_KEY is not set");
  }

  if (bot) return bot;
  bot = new Bot(token);
  return bot;
};
