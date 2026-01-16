export const COMMUNITY_CHATS_COLLECTION_ID =
  "d12a1e5e-e8dc-469d-9e7c-e44334af847b";

export const CommunityChatsSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  uniqueItems: true,
  items: {
    type: "object",
    properties: {
      _id: { type: "string", format: "uuid" },
      chat_id: { type: "string" },
      chat_title: { type: "string" },
      activated_by: { type: "string" },
      settings: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
      activated_at: { type: "string", format: "date-time" },
      updated_at: { type: "string", format: "date-time" },
    },
    required: [
      "_id",
      "chat_id",
      "chat_title",
      "activated_by",
      "activated_at",
      "updated_at",
    ],
  },
};
