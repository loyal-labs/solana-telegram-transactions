import type { ChatSummary, SummariesApiResponse } from "@loyal-labs/shared";

import { env } from "@/config/env";

export type GroupChat = {
  id: string;
  title: string;
  subtitle: string;
  photoBase64?: string;
  photoMimeType?: string;
};

/**
 * Fetch all summaries from the API.
 */
export async function fetchSummaries(): Promise<ChatSummary[]> {
  const response = await fetch(`${env.apiBaseUrl}/api/summaries`);
  if (!response.ok) {
    throw new Error(`Failed to fetch summaries: ${response.status}`);
  }
  const data: SummariesApiResponse = await response.json();
  return data.summaries;
}

/**
 * Fetch summaries for a specific group chat.
 */
export async function fetchSummariesByGroup(
  groupChatId: string,
): Promise<ChatSummary[]> {
  const response = await fetch(
    `${env.apiBaseUrl}/api/summaries?groupChatId=${encodeURIComponent(groupChatId)}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch summaries: ${response.status}`);
  }
  const data: SummariesApiResponse = await response.json();
  return data.summaries;
}

/**
 * Transform flat summaries array into deduplicated group list.
 * Keeps the most recent summary per group (input assumed sorted newest-first from API).
 */
export function transformSummariesToGroups(
  summaries: ChatSummary[],
): GroupChat[] {
  const groupMap = new Map<string, GroupChat>();

  for (const summary of summaries) {
    const groupKey = summary.chatId ?? summary.title;
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        id: groupKey,
        title: summary.title,
        subtitle: summary.topics[0]?.content ?? "",
        photoBase64: summary.photoBase64,
        photoMimeType: summary.photoMimeType,
      });
    }
  }

  return Array.from(groupMap.values());
}
