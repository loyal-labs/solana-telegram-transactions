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

export const MockUserMessage = {
  _id: "7a2d7fec-9b61-45dd-9842-35eb88f6ee85",
  user_did: "did:key:user123",
  conversation_id: 1,
  idx: 0,
  role: "user",
  complete: false,
  created_at: "2024-04-27T16:00:00.000Z",
  content: { "%allot": "Hello, assistant!" },
};

export const MockAssistantMessage = {
  _id: "9c6d1a42-3ff3-4e8e-9c1f-b769df0977ab",
  user_did: "did:key:user123",
  conversation_id: 1,
  idx: 1,
  role: "assistant",
  complete: true,
  created_at: "2024-04-27T16:00:05.000Z",
  content: { "%allot": "Hello! How can I help?" },
};
