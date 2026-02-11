import { File } from "grammy/types";

import { serverEnv } from "@/lib/core/config/server";

import { getBot } from "./bot";

const getFileId = async (fileId: string): Promise<File> => {
  const bot = await getBot();
  const file = await bot.api.getFile(fileId);
  return file;
};

export const getFileUrl = async (fileId: string): Promise<string> => {
  const file = await getFileId(fileId);
  return `https://api.telegram.org/file/bot${serverEnv.askLoyalBotToken}/${file.file_path}`;
};
