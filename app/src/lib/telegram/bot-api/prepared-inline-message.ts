import { InlineQueryResultBuilder } from "grammy";
import { PreparedInlineMessage } from "grammy/types";

import { getBot } from "./bot";

export const prepareInlineMessage = async (
  userId: number,
  photoUrl: string
): Promise<PreparedInlineMessage> => {
  const bot = await getBot();

  // const keyboard = new InlineKeyboard().webApp("Open", MINI_APP_LINK);

  const inlineMessage = InlineQueryResultBuilder.photo("id0", photoUrl).text(
    "Tap to open the transaction"
  );

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
