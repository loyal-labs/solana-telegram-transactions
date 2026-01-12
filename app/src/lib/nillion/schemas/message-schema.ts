export const MessageSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  uniqueItems: true,
  items: {
    type: "object",
    properties: {
      _id: { type: "string", format: "uuid" },
      user_did: { type: "string" },
      conversation_id: { type: "integer", minimum: 0 },
      idx: { type: "integer", minimum: 0 },
      role: { type: "string", enum: ["system", "user", "assistant", "tool"] },
      complete: { type: "boolean" },
      created_at: { type: "string", format: "date-time" },

      content: {
        // ENCRYPTED
        type: "object",
        properties: { "%share": { type: "string" } },
        required: ["%share"],
      },
    },
    required: [
      "_id",
      "user_did",
      "conversation_id",
      "idx",
      "role",
      "created_at",
      "content",
    ],
  },
};
