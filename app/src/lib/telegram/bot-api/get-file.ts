import { File } from "grammy/types";

import { getBot } from "./bot";

const getFileId = async (fileId: string): Promise<File> => {
  const bot = await getBot();
  const file = await bot.api.getFile(fileId);
  return file;
};

export const getFileUrl = async (fileId: string): Promise<string> => {
  const file = await getFileId(fileId);
  return `https://api.telegram.org/file/bot${process.env.ASKLOYAL_TGBOT_KEY}/${file.file_path}`;
};
