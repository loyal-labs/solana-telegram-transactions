export type LlmProviderName =
  | "anthropic"
  | "azure-openai"
  | "cohere"
  | "deepseek"
  | "google-gemini"
  | "grok"
  | "groq"
  | "huggingface"
  | "mistral"
  | "ollama"
  | "openai"
  | "openai-responses"
  | "openrouter"
  | "reka"
  | "together"
  | "webllm";

export type LlmProviderConfig = {
  apiKey: string;
  apiURL: string;
  headers?: Record<string, string>;
  name?: LlmProviderName;
};

export type LlmModelPolicy = {
  allowOverride?: boolean;
  defaultModel: string;
};

export type RetryPolicy = {
  backoffMultiplier?: number;
  initialDelayMs?: number;
  jitterRatio?: number;
  maxAttempts: number;
  maxDelayMs?: number;
};

export type LlmRunMeta = {
  attempts: number;
  failureReasons: string[];
  finalModel: string;
  latencyMs: number;
};
