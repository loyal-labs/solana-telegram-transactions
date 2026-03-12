import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { resolveLlmProviderConfig } from "@loyal-labs/llm-core";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { serverEnv } from "@/lib/core/config/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const DEFAULT_MODEL_ID = "loyal-oracle";
const LOYAL_ORACLE_PROVIDER_NAME = "loyal-oracle";
const REDPILL_API_BASE_URL = "https://api.redpill.ai/v1/";
const { chatRuntime } = serverEnv;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  if (!Array.isArray(messages)) {
    return new Response("Invalid request payload", { status: 400 });
  }

  const { config, model } = resolveLlmProviderConfig({
    defaults: {
      apiKey: chatRuntime.apiKey,
      model: DEFAULT_MODEL_ID,
    },
    overrides: {
      model: chatRuntime.modelId,
    },
    provider: {
      apiURL: REDPILL_API_BASE_URL,
      name: "openai",
    },
  });

  const customProvider = createOpenAICompatible({
    baseURL: config.apiURL,
    name: LOYAL_ORACLE_PROVIDER_NAME,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...(config.headers ?? {}),
    },
  });

  const result = streamText({
    model: customProvider.languageModel(model),
    system:
      "You are a helpful AI assistant for Loyal, a private intelligence platform.",
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
