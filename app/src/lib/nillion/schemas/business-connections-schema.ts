export const BusinessConnectionsSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  uniqueItems: true,
  items: {
    type: "object",
    properties: {
      _id: { type: "string", format: "uuid" },
      user_id: { type: "integer", minimum: 0 },
      enabled: { type: "boolean" },
      created_at: { type: "string", format: "date-time" },
      updated_at: { type: "string", format: "date-time" },
    },
    required: [
      "_id",
      "user_id",
      "user_handle",
      "enabled",
      "created_at",
      "updated_at",
    ],
  },
};
