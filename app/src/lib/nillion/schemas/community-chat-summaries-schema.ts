export const COMMUNITY_CHAT_SUMMARIES_COLLECTION_ID =
  "57f5d577-56e3-4f81-b2a8-630363fe77b0";

export const CommunityChatSummariesSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  uniqueItems: true,
  items: {
    type: "object",
    properties: {
      _id: { type: "string", format: "uuid" },
      chat_id: { type: "string" },
      chat_title: { type: "string" },
      message_count: { type: "integer" },
      from_message_id: { type: "integer" },
      to_message_id: { type: "integer" },
      topics: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            sources: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["title", "content", "sources"],
        },
      },
      created_at: { type: "string", format: "date-time" },
    },
    required: [
      "_id",
      "chat_id",
      "chat_title",
      "message_count",
      "topics",
      "created_at",
    ],
  },
};
