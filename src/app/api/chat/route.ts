import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const customProvider = createOpenAICompatible({
  baseURL: "https://api.redpill.ai/v1/",
  name: "loyal-oracle",
  headers: {
    Authorization: `Bearer ${process.env.PHALA_API_KEY}`,
  },
});

const MODEL_ID = process.env.PHALA_MODEL_ID?.trim() || "loyal-oracle";
const loyalOracleModel = customProvider.languageModel(MODEL_ID);

export async function POST(req: Request) {
  if (!process.env.PHALA_API_KEY) {
    console.error("Missing PHALA_API_KEY environment variable.");
    return new Response("Server misconfiguration", { status: 500 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
  if (!Array.isArray(messages)) {
    return new Response("Invalid request payload", { status: 400 });
  }

  const result = streamText({
    model: loyalOracleModel,
    system:
      "You are a helpful AI assistant for Loyal, a private intelligence platform.",
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
