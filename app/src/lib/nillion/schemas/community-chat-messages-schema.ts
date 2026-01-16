export const COMMUNITY_CHAT_MESSAGES_COLLECTION_ID =
  "2fd4e677-33b6-4b02-bcb1-cea85f457e4e";

export const CommunityChatMessagesSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  uniqueItems: true,
  items: {
    type: "object",
    properties: {
      _id: { type: "string", format: "uuid" },
      chat_id: { type: "string" },
      message_id: { type: "integer" },
      sender_id: { type: "string" },
      sender_name: { type: "string" },
      content: { type: "string" },
      created_at: { type: "string", format: "date-time" },
    },
    required: [
      "_id",
      "chat_id",
      "message_id",
      "sender_id",
      "sender_name",
      "content",
      "created_at",
    ],
  },
};
