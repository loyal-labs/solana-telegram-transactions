export type HandleSummaryCommandOptions = {
  summarySourceChatId?: bigint;
};

export type SendSummaryResult =
  | { sent: true }
  | { sent: false; reason: "not_activated" | "no_summaries" };

export type SendLatestSummaryOptions = {
  destinationChatId?: bigint;
  replyToMessageId?: number;
};
