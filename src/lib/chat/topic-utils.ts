import type { UserChat } from "@/lib/loyal/types";

export type TopicListItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export const toSafeNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "bigint") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    try {
      const parsed = (value as { toNumber: () => number }).toNumber();
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
};

export const toIsoDateString = (value: unknown): string => {
  const timestamp = toSafeNumber(value);
  if (timestamp === null || timestamp <= 0) {
    return new Date().toISOString();
  }
  const normalized = timestamp > 1e12 ? timestamp : timestamp * 1000;
  return Number.isFinite(normalized)
    ? new Date(normalized).toISOString()
    : new Date().toISOString();
};

export const mapChatsToTopics = (userChats: UserChat[]): TopicListItem[] =>
  userChats.map((chat, index) => {
    const chatIdNumber = toSafeNumber(chat.id);
    const topicId =
      chatIdNumber !== null
        ? chatIdNumber.toString()
        : String(chat.id ?? index);
    const displayNumber = chatIdNumber !== null ? chatIdNumber + 1 : index + 1;

    return {
      id: topicId,
      title: `Chat ${displayNumber}`,
      updatedAt: toIsoDateString(chat.createdAt),
    };
  });
