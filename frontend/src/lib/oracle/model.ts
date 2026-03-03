import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type {
  DelegationTokenRequest,
  NilaiOpenAIClient,
} from "@nillion/nilai-ts";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { ORACLE_MODEL_BASE_URL } from "./constants";
import type { AvailableModels } from "./enums";
import { getModelClient } from "./helpers";

export async function createModelDelegationToken(
  client: NilaiOpenAIClient | undefined
) {
  if (!client) {
    console.warn("No Loyal model client provided, using default client");
    client = getModelClient();
  }

  const delegationRequest: DelegationTokenRequest =
    client.getDelegationRequest();
  return delegationRequest;
}

export async function sendQuery(
  client: NilaiOpenAIClient | undefined,
  model: AvailableModels,
  messages: ChatCompletionMessageParam[]
) {
  if (!client) {
    console.error("No Loyal model client provided, cannot send query");
    throw new Error("No Loyal model client provided");
  }

  const response = await client.chat.completions.create({
    model,
    messages,
  });
  return response;
}

export function getLoyalModel() {
  const provider = createOpenAICompatible({
    baseURL: ORACLE_MODEL_BASE_URL,
    name: "loyal-oracle",
    includeUsage: true,
  });

  return provider;
}
