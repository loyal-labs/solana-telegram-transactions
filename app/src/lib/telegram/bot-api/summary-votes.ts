import { eq, sql } from "drizzle-orm";
import type { CallbackQueryContext, Context } from "grammy";
import { InlineKeyboard } from "grammy";

import { getDatabase } from "@/lib/core/database";
import {
  summaries,
  type SummaryVoteAction as PersistedSummaryVoteAction,
  summaryVotes,
} from "@/lib/core/schema";
import { getOrCreateUser } from "@/lib/telegram/user-service";
import { getTelegramDisplayName } from "@/lib/telegram/utils";

import { isMessageNotModifiedError } from "./callback-query-utils";
import { MINI_APP_FEED_LINK } from "./constants";

type SummaryVoteAction = "u" | "d" | "s";

type SummaryVoteCallbackData = {
  action: SummaryVoteAction;
  summaryId: string;
};

export type SummaryVoteTotals = {
  dislikes: number;
  likes: number;
  score: number;
};

const SUMMARY_ID_REGEX_PART =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

export const SUMMARY_VOTE_CALLBACK_DATA_REGEX = new RegExp(
  `^sv:(u|d|s):(${SUMMARY_ID_REGEX_PART})$`
);

export function encodeSummaryVoteCallbackData(
  callbackData: SummaryVoteCallbackData
): string {
  return `sv:${callbackData.action}:${callbackData.summaryId}`;
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

  if (action !== "u" && action !== "d" && action !== "s") {
    return null;
  }

  return {
    action,
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
        summaryId,
      })
    )
    .text(
      `Score: ${score}`,
      encodeSummaryVoteCallbackData({
        action: "s",
        summaryId,
      })
    )
    .text(
      "👎👎👎",
      encodeSummaryVoteCallbackData({
        action: "d",
        summaryId,
      })
    )
    .row()
    .url("Read in full", MINI_APP_FEED_LINK);
}

export async function getSummaryVoteTotals(
  summaryId: string
): Promise<SummaryVoteTotals> {
  const db = getDatabase();

  const [result] = await db
    .select({
      dislikes: sql<number>`coalesce(sum(case when ${summaryVotes.action} = 'DISLIKE' then 1 else 0 end), 0)`,
      likes: sql<number>`coalesce(sum(case when ${summaryVotes.action} = 'LIKE' then 1 else 0 end), 0)`,
    })
    .from(summaries)
    .leftJoin(summaryVotes, eq(summaryVotes.summaryId, summaries.id))
    .where(eq(summaries.id, summaryId))
    .groupBy(summaries.id);

  return toSummaryVoteTotals({
    dislikes: Number(result?.dislikes ?? 0),
    likes: Number(result?.likes ?? 0),
  });
}

function toSummaryVoteTotals(input: {
  dislikes: number;
  likes: number;
}): SummaryVoteTotals {
  const likes = Number.isFinite(input.likes) ? input.likes : 0;
  const dislikes = Number.isFinite(input.dislikes) ? input.dislikes : 0;

  return {
    dislikes,
    likes,
    score: likes - dislikes,
  };
}

function mapVoteAction(
  action: SummaryVoteAction
): PersistedSummaryVoteAction | null {
  if (action === "u") {
    return "LIKE";
  }

  if (action === "d") {
    return "DISLIKE";
  }

  return null;
}

export async function handleSummaryVoteCallback(
  ctx: CallbackQueryContext<Context>
): Promise<void> {
  const callbackData = parseSummaryVoteCallbackData(ctx.callbackQuery.data);
  if (!callbackData) {
    await ctx.answerCallbackQuery();
    return;
  }

  if (callbackData.action === "s") {
    try {
      const voteTotals = await getSummaryVoteTotals(callbackData.summaryId);
      await ctx.answerCallbackQuery({
        show_alert: true,
        text: `Current summary score is ${voteTotals.score}.`,
      });
    } catch (error) {
      console.error("Failed to fetch summary score", error);
      await ctx.answerCallbackQuery({
        show_alert: true,
        text: "Unable to load summary score right now.",
      });
    }
    return;
  }

  const callbackMessage = ctx.callbackQuery.message;
  if (!callbackMessage) {
    await ctx.answerCallbackQuery();
    return;
  }

  if (!ctx.from) {
    await ctx.answerCallbackQuery();
    return;
  }

  try {
    const voteAction = mapVoteAction(callbackData.action);
    if (!voteAction) {
      await ctx.answerCallbackQuery();
      return;
    }

    const userId = await getOrCreateUser(BigInt(ctx.from.id), {
      username: ctx.from.username || null,
      displayName: getTelegramDisplayName(ctx.from),
    });

    const db = getDatabase();
    const insertedVote = await db
      .insert(summaryVotes)
      .values({
        action: voteAction,
        summaryId: callbackData.summaryId,
        userId,
      })
      .onConflictDoNothing()
      .returning({ id: summaryVotes.id });

    if (insertedVote.length === 0) {
      await ctx.answerCallbackQuery({
        show_alert: true,
        text: "You've voted already!",
      });
      return;
    }

    const voteTotals = await getSummaryVoteTotals(callbackData.summaryId);

    await ctx.api.editMessageReplyMarkup(
      callbackMessage.chat.id,
      callbackMessage.message_id,
      {
        reply_markup: buildSummaryVoteKeyboard(
          callbackData.summaryId,
          voteTotals.likes,
          voteTotals.dislikes
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
