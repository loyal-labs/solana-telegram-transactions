export type Topic = {
  id: string;
  title: string;
  content: string;
  sources: string[];
};

export type ChatSummary = {
  id: string;
  chatId?: string;
  title: string;
  messageCount?: number;
  createdAt?: string;
  oneliner?: string;
  photoBase64?: string;
  photoMimeType?: string;
  topics: Topic[];
};

export type SummariesApiResponse = {
  summaries: ChatSummary[];
};
