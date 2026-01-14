export const USER_KEY_MAPPING_COLLECTION_ID =
  "2219dc58-8ed1-495e-85b5-3fb875c0656e";

export const UserKeyMappingSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  uniqueItems: true,
  items: {
    type: "object",
    properties: {
      solana_public_key: { type: "string" },
      telegram_id: { type: "string" },
      nildb_key: {
        // encrypted field
        type: "object",
        properties: { "%share": { type: "string" } },
        required: ["%share"],
      },
      created_at: { type: "string", format: "date-time" },
    },
    required: ["solana_public_key", "nildb_key", "created_at"],
  },
};
