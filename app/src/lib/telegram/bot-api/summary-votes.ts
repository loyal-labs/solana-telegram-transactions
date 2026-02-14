import type { CallbackQueryContext, Context } from "grammy";
import { InlineKeyboard } from "grammy";

import { isMessageNotModifiedError } from "./callback-query-utils";
import { MINI_APP_FEED_LINK } from "./constants";

type SummaryVoteAction = "u" | "d" | "s";

type SummaryVoteCallbackData = {
  action: SummaryVoteAction;
  dislikes: number;
  likes: number;
  summaryId: string;
};

const SUMMARY_ID_REGEX_PART =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const MAX_VOTE_COUNT = 2_147_483_647;

export const SUMMARY_VOTE_CALLBACK_DATA_REGEX = new RegExp(
  `^sv:(u|d|s):(${SUMMARY_ID_REGEX_PART}):(\\d+):(\\d+)$`
);

export function encodeSummaryVoteCallbackData(
  callbackData: SummaryVoteCallbackData
): string {
  return `sv:${callbackData.action}:${callbackData.summaryId}:${callbackData.likes}:${callbackData.dislikes}`;
}

export function parseSummaryVoteCallbackData(
  data: string
): SummaryVoteCallbackData | null {
  const matches = SUMMARY_VOTE_CALLBACK_DATA_REGEX.exec(data);
  if (!matches) {
    return null;
  }

  const action = matches[1];
  const summaryId = matches[2];
  const likes = Number(matches[3]);
  const dislikes = Number(matches[4]);

  if (action !== "u" && action !== "d" && action !== "s") {
    return null;
  }

  if (
    !Number.isInteger(likes) ||
    !Number.isInteger(dislikes) ||
    likes < 0 ||
    dislikes < 0 ||
    likes > MAX_VOTE_COUNT ||
    dislikes > MAX_VOTE_COUNT
  ) {
    return null;
  }

  return {
    action,
    dislikes,
    likes,
    summaryId,
  };
}

export function buildSummaryVoteKeyboard(
  summaryId: string,
  likes: number,
  dislikes: number
): InlineKeyboard {
  const score = likes - dislikes;

  return new InlineKeyboard()
    .text(
      "👍👍👍",
      encodeSummaryVoteCallbackData({
        action: "u",
        dislikes,
        likes,
        summaryId,
      })
    )
    .text(
      `Score: ${score}`,
      encodeSummaryVoteCallbackData({
        action: "s",
        dislikes,
        likes,
        summaryId,
      })
    )
    .text(
      "👎👎👎",
      encodeSummaryVoteCallbackData({
        action: "d",
        dislikes,
        likes,
        summaryId,
      })
    )
    .row()
    .url("Read in full", MINI_APP_FEED_LINK);
}

export async function handleSummaryVoteCallback(
  ctx: CallbackQueryContext<Context>
): Promise<void> {
  const callbackData = parseSummaryVoteCallbackData(ctx.callbackQuery.data);
  if (!callbackData) {
    await ctx.answerCallbackQuery();
    return;
  }

  const score = callbackData.likes - callbackData.dislikes;
  if (callbackData.action === "s") {
    await ctx.answerCallbackQuery({
      show_alert: true,
      text: `Current summary score is ${score}.`,
    });
    return;
  }

  const callbackMessage = ctx.callbackQuery.message;
  if (!callbackMessage) {
    await ctx.answerCallbackQuery();
    return;
  }

  const nextLikes =
    callbackData.action === "u"
      ? incrementVoteCount(callbackData.likes)
      : callbackData.likes;
  const nextDislikes =
    callbackData.action === "d"
      ? incrementVoteCount(callbackData.dislikes)
      : callbackData.dislikes;

  try {
    await ctx.api.editMessageReplyMarkup(
      callbackMessage.chat.id,
      callbackMessage.message_id,
      {
        reply_markup: buildSummaryVoteKeyboard(
          callbackData.summaryId,
          nextLikes,
          nextDislikes
        ),
      }
    );
    await ctx.answerCallbackQuery();
  } catch (error) {
    if (isMessageNotModifiedError(error)) {
      await ctx.answerCallbackQuery();
      return;
    }

    console.error("Failed to update summary vote keyboard", error);
    await ctx.answerCallbackQuery({
      show_alert: true,
      text: "Unable to update summary score right now.",
    });
  }
}

function incrementVoteCount(currentValue: number): number {
  return Math.min(currentValue + 1, MAX_VOTE_COUNT);
}
