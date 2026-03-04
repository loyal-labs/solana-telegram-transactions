import { ai, type AxAIService } from "@ax-llm/ax";
import type { LlmProviderConfig } from "@loyal-labs/llm-core";

export function createAxOpenAiClient(config: LlmProviderConfig): AxAIService {
  const providerName = config.name ?? "openai";
  if (providerName !== "openai" && providerName !== "openai-responses") {
    throw new Error(
      `createAxOpenAiClient only supports openai-compatible providers. Received: ${providerName}`
    );
  }

  const service = ai({
    apiKey: config.apiKey,
    apiURL: config.apiURL,
    name: providerName,
  });

  if (config.headers && Object.keys(config.headers).length > 0) {
    const maybeConfigurableClient = service as AxAIService & {
      setHeaders?: (headers: () => Promise<Record<string, string>>) => void;
    };

    maybeConfigurableClient.setHeaders?.(async () => config.headers ?? {});
  }

  return service;
}
