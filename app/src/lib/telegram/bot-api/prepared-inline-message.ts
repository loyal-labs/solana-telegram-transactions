import { InlineKeyboard, InlineQueryResultBuilder } from "grammy";
import { PreparedInlineMessage } from "grammy/types";

import { getBot } from "./bot";
import { MINI_APP_LINK } from "./constants";

export const prepareInlineMessage = async (
  userId: number,
  photoUrl: string
): Promise<PreparedInlineMessage> => {
  const bot = await getBot();

  const keyboard = new InlineKeyboard().url("Open", MINI_APP_LINK);

  const invisibleUnicodeSymbol = String.fromCharCode(0x200b);
  const text = `Tap to open Loyal app and claim the transaction!<a href="${photoUrl}">${invisibleUnicodeSymbol}</a>`;

  const inlineMessage = InlineQueryResultBuilder.article(
    "id0",
    "Tap to open Loyal app and claim the transaction!",
    {
      reply_markup: keyboard,
      url: photoUrl,
      thumbnail_url: photoUrl,
    }
  ).text(text, { parse_mode: "HTML" });

  const preparedInlineMessage = await bot.api.savePreparedInlineMessage(
    userId,
    inlineMessage,
    {
      allow_bot_chats: false,
      allow_channel_chats: false,
      allow_group_chats: false,
      allow_user_chats: true,
    }
  );

  return preparedInlineMessage;
};
