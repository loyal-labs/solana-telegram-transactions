import type { Context, InlineQueryContext } from "grammy";
import { InlineQueryResult } from "grammy/types";

import { MINI_APP_LINK } from "@/lib/telegram/constants";

//TODO: implement results
export const handleInlineQuery = async (ctx: InlineQueryContext<Context>) => {
  const results: InlineQueryResult[] = [];

  await ctx.answerInlineQuery(results, {
    button: {
      text: "Loyal Wallet",
      web_app: {
        url: MINI_APP_LINK,
      },
    },
  });
};
