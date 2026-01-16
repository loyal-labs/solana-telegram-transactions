export const USERS_COLLECTION_ID = "31170ce9-c208-46f3-9f29-1a76c6f424af";

export const UsersSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  uniqueItems: true,
  items: {
    type: "object",
    properties: {
      _id: { type: "string", format: "uuid" },
      telegram_id: { type: "string" },
      username: { type: "string" },
      display_name: { type: "string" },
      avatar_url: { type: "string" },
      settings: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
      created_at: { type: "string", format: "date-time" },
      updated_at: { type: "string", format: "date-time" },
    },
    required: [
      "_id",
      "telegram_id",
      "display_name",
      "created_at",
      "updated_at",
    ],
  },
};
