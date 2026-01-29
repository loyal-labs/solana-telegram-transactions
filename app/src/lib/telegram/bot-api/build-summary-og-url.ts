import { resolveEndpoint } from "@/lib/core/api";

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
};

export const buildSummaryOgImageUrl = (text: string, date: Date): string => {
  const endpoint = resolveEndpoint("api/og/share-summary");
  const url = new URL(endpoint);
  url.searchParams.set("text", text);
  url.searchParams.set("date", formatDate(date));
  return url.toString();
};

const INVISIBLE_CHAR = String.fromCharCode(0x200b);

export const buildSummaryMessageWithPreview = (
  messageText: string,
  ogText: string,
  date: Date
): string => {
  const photoUrl = buildSummaryOgImageUrl(ogText, date);
  return `${messageText}<a href="${photoUrl}">${INVISIBLE_CHAR}</a>`;
};
