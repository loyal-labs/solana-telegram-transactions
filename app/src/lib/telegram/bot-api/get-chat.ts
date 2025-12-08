import { ChatFullInfo } from "grammy/types";

import { getBot } from "./bot";

export const getChat = async (chatId: number): Promise<ChatFullInfo> => {
  const bot = await getBot();
  const chat = await bot.api.getChat(chatId);
  return chat;
};
