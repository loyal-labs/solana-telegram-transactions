export const UserKeyMappingSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  uniqueItems: true,
  items: {
    type: "object",
    properties: {
      solana_public_key: { type: "string" },
      nildb_key: { type: "string" },
      telegram_id: { type: "string" },
      created_at: { type: "string", format: "date-time" },
    },
    required: ["solana_public_key", "nildb_key", "created_at"],
  },
};
